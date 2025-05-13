import { CTRL_ARG_BYTELEN, FixedLengthReader } from "../helpers/Lexer";
import { WASMValue } from "../spec/Code";
import { WASMOPCode } from "../spec/OpCode";
import { WASMFuncType, WASMSection2Content, WASMSection4Content } from "../spec/Sections";
import { typeArrayToString, WASMRefType, WASMValueType } from "../spec/Types";
import { WASMExternalGlobal } from "../interface/Global";
import WASMMemory from "../interface/Memory";
import WASMTable from "../interface/Table";
import WASMModule from "../compile/Module";
import { convertToExecForm } from "./ConvertBinary";
import evalConstExpr from "./ConstEval";
import { toTruthy, ctz32, popcnt32, rotl32, rotl64, rotr32, rotr64 } from "../helpers/Math";
import {
    CONVERSION_UINT8, CONVERSION_INT8, 
    CONVERSION_UINT16, CONVERSION_INT16,
    CONVERSION_UINT32, CONVERSION_INT32, CONVERSION_FLOAT32,
    CONVERSION_UINT64, CONVERSION_INT64, CONVERSION_FLOAT64,
    toConvert, fromConvert
} from "../helpers/Conversion";

import { newI32, newF32, newI64, newF64, freeVal, cloneValue, newValue } from "./Alloc";
import { LinkError, RuntimeError } from "../spec/Error";


const CALL_STACK_LIMIT = 300;
//TODO: speed up with in-place allocation
//TODO: speed up memory instructions
function makeExportFunction(prog : Program, index : number) : (...args: Array<any>) => number | bigint | Array<number | bigint> | undefined {
    const funcType = prog.funcTypes[index];
    const numIters = funcType.args.length;
    const exportFuncWrapper = (...args : Array<any>) => {
    const passedOn : Array<WASMValue> = [];
    for (let i = 0; i < numIters; ++i) {
            switch (funcType.args[i]) {
                case WASMValueType.i32:
                    passedOn.push(newI32(args[i]));
                    break;
                case WASMValueType.f32:
                    passedOn.push(newF32(args[i]));
                    break;
                case WASMValueType.i64:
                    passedOn.push(newI64(BigInt(args[i])));
                    break;
                case WASMValueType.f64:
                    passedOn.push(newF64(args[i]));
                    break;
            }
        }
        return prog.run(index, passedOn);
    }
    return exportFuncWrapper;
}

class StackFrame {
    locals : Array<WASMValue>;
    pc : number;
    func : number;
    constructor(locals : Array<WASMValue>, pc : number, func : number) {
        this.locals = locals;
        this.pc = pc;
        this.func = func;
    }
}

function branchUp(blockFrames : Array<number>, valueStack : Array<WASMValue>, depth : number, toKeep : number) : void {
    //if (blockFrames.length - 1 < depth)
        //throw new RangeError(`Branch depth ${depth} exceeds max depth ${blockFrames.length - 1}`);
    const anchor = blockFrames[blockFrames.length - 1 - depth];
    //if (anchor + toKeep > valueStack.length) 
        //throw new RangeError(`Saved length ${anchor} and toKeep ${toKeep} >= real length ${valueStack.length}`);
    const top = valueStack.length - toKeep;
    if (toKeep > 0) {
        for (let i = 0; i < toKeep; ++i)
            valueStack[anchor + i] = valueStack[top + i];
    }
    for (let i = 0; i < depth + 1; i++)
        blockFrames.pop();
    const rmv = valueStack.length - (anchor + toKeep);
    for (let i = 0; i < rmv; ++i)
        valueStack.pop();
    //blockFrames.length -= depth + 1;
    //valueStack.length = (anchor + toKeep);
}

function pushSafe(arr : Array<WASMValue>, v : WASMValue) : void {
    arr.push(v);
}

function popSafe(arr : Array<WASMValue>) : WASMValue {
    //if (arr.length === 0) 
        //throw new RuntimeError("Stack empty, cannot pop");
    const v = arr[arr.length - 1];
    arr.pop();
    return v;
}

function readFuncPtr(reader : FixedLengthReader, idx : number) : void {
    reader.at = idx * 4;
    reader.at = reader.read_u32();
}

export class Program {
    code : Uint8Array;
    memory : WASMMemory = new WASMMemory({});
    funcTypes : Array<WASMFuncType> = [];
    globals : Array<WASMValue> = [];
    tables : Array<WASMTable> = [];

    importedFuncs : Array<Function> = [];
    importFuncCount : number = 0;
    importGlobalCount : number = 0;

    funcCount : number = 0;

    exports : Record<string, any> = {};

    constructor(repr : WASMModule, imports : any) {
        this.code = convertToExecForm(repr);
        this.importFuncCount = repr.importFunc;
        this.importGlobalCount = repr.importGlobal;
        if (repr.has_section(1)) 
            //functypes
            this.funcTypes = repr.funcTypes.map(idx => repr.section1.content[idx]);
        
        if (repr.has_section(2)) 
            //imports
            this.initializeImports(imports, repr.section2.content);
        
        if (repr.has_section(3)) 
            //functions
            this.funcCount = repr.section3.content.length;
        
        if (repr.has_section(4)) 
            //tables
            this.initializeTables(repr.section4.content);
        
        if (repr.has_section(5)) {
            //memory
            let minPages = 0;
            let maxPages = 0;
            for (const memory of repr.section5.content) {
                minPages = memory.min;
                maxPages = Math.max(memory.max, memory.min);
            }
            this.initializeMemory(minPages, maxPages);
        }
        if (repr.has_section(6)) {
            //globals
            for (const glob of repr.section6.content) 
                this.globals.push(evalConstExpr(glob.expr));
        }
        if (repr.has_section(9)) {
            //elems
            if (this.tables.length === 0)
                throw new LinkError("Expected a table initialization");
            for (const elem of repr.section9.content) {
                //using passive tables
                const offset = evalConstExpr(elem.offset).u32;
                if (offset + elem.funcrefs.length > this.tables[0].length)
                    throw new LinkError("Out of range element initialization");
                for (let i = 0; i < elem.funcrefs.length; ++i) {
                    const table = this.tables[0];
                    table.elements[i + offset] = elem.funcrefs[i];
                    table.__funcRefs[i + offset] = makeExportFunction(this, elem.funcrefs[i]);
                }
            }
        }
        if (repr.has_section(11)) {
            //data
            for (const data of repr.section11.content) {
                const offset = evalConstExpr(data.offset).u32;
                if (offset + data.data.length > this.memory.length)
                    throw new LinkError("Out of range data initialization");
                this.memory._buffer.set(data.data, offset);
            }
        }
        if (repr.has_section(7)) {
            //exports
            for (const exp of repr.section7.content) {
                switch (exp.kind) {
                    case 0: {
                        const funcType = this.funcTypes[exp.index];
                        const numIters = funcType.args.length;
                        const exportFuncWrapper = (...args : Array<any>) => {
                            const passedOn : Array<WASMValue> = [];
                            for (let i = 0; i < numIters; ++i) {
                                switch (funcType.args[i]) {
                                    case WASMValueType.i32:
                                        passedOn.push(newI32(args[i]));
                                        break;
                                    case WASMValueType.f32:
                                        passedOn.push(newF32(args[i]));
                                        break;
                                    case WASMValueType.i64:
                                        passedOn.push(newI64(BigInt(args[i])));
                                        break;
                                    case WASMValueType.f64:
                                        passedOn.push(newF64(args[i]));
                                        break;
                                }
                            }
                            return this.run(exp.index, passedOn);
                        }
                        this.exports[exp.name] = makeExportFunction(this, exp.index);
                        break;
                    }
                    case 1:
                        this.exports[exp.name] = this.tables[exp.index];
                        break;
                    case 2: 
                        this.exports[exp.name] = this.memory;
                        break;
                    case 3:
                        this.exports[exp.name] = new WASMExternalGlobal({});
                        this.exports[exp.name]._value = this.globals[exp.index];
                        break;
                    default:
                        break;
                }
            }
        }
        if (repr.has_section(8)) 
            //start
            this.run(repr.section8.index, []);
    }

    initializeMemory(start : number, end : number) {
        this.memory = new WASMMemory({ initial: start, maximum: end });
    }

    initializeImports(imports : any, importDesc : Array<WASMSection2Content>) : void {
        let importGlobalCount = 0;
        for (const desc of importDesc) {
            const module = desc.module;
            const name = desc.name;
            if (typeof imports[module] !== "object")
                throw new LinkError(`Imported module [${module}] does not exist or is not an object`);
            switch (desc.kind) {
                case 0: {
                    //func
                    const func = imports[module][name];
                    if (!(func instanceof Function)) 
                        throw new LinkError(`Invalid import ${module}.${name}: expected function`);
                    this.importedFuncs.push(func);
                    break;
                }
                case 1: {
                    const table = imports[module][name];
                    if (!(table instanceof WASMTable))
                        throw new LinkError(`Invalid import ${module}.${name}: expected WebAssembly.table`);
                    this.tables.push(table);
                    break;
                }
                case 2: {
                    //memory, we assume there is only 1
                    const mem = imports[module][name];
                    if (!(mem instanceof WASMMemory))
                        throw new LinkError(`Invalid import ${module}.${name}: expected WebAssembly.Memory`);
                    if (mem.init !== desc.limits.min)
                        throw new LinkError("Imported memory initial size wrong")
                    if (mem.max !== desc.limits.max)
                        throw new LinkError("Imported memory maximum size wrong")
                    this.memory = mem;
                    break;
                }
                case 3: {
                    //global
                    const glob = imports[module][name];
                    if (!(glob instanceof WASMExternalGlobal)) 
                        throw new LinkError(`Invalid import ${module}.${name}: expected WebAssembly.Global`);
                    if (glob._value.type !== desc.type)
                        throw new LinkError("Imported global type mismatch");
                    ++importGlobalCount;
                    this.globals.push(glob._value);
                    break;
                }
                default:
                    throw new LinkError("Unexpected import type");
                    break;
            }
        }
        if (this.importFuncCount !== this.importedFuncs.length)
            throw new LinkError(`Function import count mismatch: expected ${this.importFuncCount}, got ${this.importedFuncs.length}`);
        
        if (this.importGlobalCount !== importGlobalCount)
            throw new LinkError(`Global import count mismatch: expected ${this.importGlobalCount}, got ${importGlobalCount}`);
    }

    initializeTables(tableDesc : Array<WASMSection4Content>) : void {
        const prog = this;
        for (const desc of tableDesc) {
            const table = new WASMTable({ initial: desc.limit.min, maximum: desc.limit.max });
            if (desc.refKind !== WASMRefType.funcref)
                throw new LinkError(`External ref table not supported`);
            this.tables.push(table);
        }

    }

    run(entry : number, args : Array<WASMValue>) : bigint | number | Array<bigint | number> | undefined {
        if (entry < 0 || entry >= this.funcCount + this.importFuncCount)
            throw new RangeError("Function index out of range");
        if (entry < this.importFuncCount) {
            console.warn("Attempting to externally call an imported function");
            const argArr : Array<any> = new Array(this.funcTypes[entry].args.length);
            for (let i = argArr.length; i > 0; --i) 
                argArr[i] = args[i].numeric;
            return this.importedFuncs[entry](...argArr);
        }
        const reader = new FixedLengthReader(this.code);
        readFuncPtr(reader, entry - this.importFuncCount);
        const valueStack : Array<WASMValue> = [];
        const callStack : Array<StackFrame> = [];
        let memBuf = this.memory._buffer;
        let argC = reader.read_ctrl_arg();
        let localC = reader.read_ctrl_arg();
        let locals : Array<WASMValue> = new Array(argC + localC);
        const blockFrames : Array<number> = [];
        if (argC !== args.length) 
            throw new RangeError(`Expected ${argC} arguments to function call, got ${args.length}`);

        for (let i = 0; i < argC; ++i) {
            if (this.funcTypes[entry].args[i] !== args[i].type) 
                throw new TypeError(`Function expected [${typeArrayToString(this.funcTypes[entry].args)}], got [${typeArrayToString(args.map(x => x.type))}]`)
            locals[i] = args[i];
        }
        for (let i = 0; i < localC; ++i) 
            locals[argC + i] = newValue(); //error typecheck, won't matter
        while (true) {
            const instr = reader.read_instr();
            switch (instr) {
                case WASMOPCode.op_unreachable:
                    throw new RuntimeError("Unreachable");
                case WASMOPCode.op_if: {
                    const idx = reader.read_u32();
                    const x = popSafe(valueStack).i32;
                    if (x === 0) {
                        reader.at = idx;
                        break;
                    }
                }
                case WASMOPCode.op_else:
                case WASMOPCode.op_block:
                case WASMOPCode.op_loop: {
                    const numDrop = reader.read_ctrl_arg();
                    blockFrames.push(valueStack.length - numDrop);
                }
                case WASMOPCode.op_nop:
                    break;
                case WASMOPCode.op_end:
                    blockFrames.pop();
                    break;
                case WASMOPCode.op_br: {
                    const numKeep = reader.read_ctrl_arg();
                    const idx = reader.read_u32();
                    const branchDepth = reader.read_ctrl_arg();
                    reader.at = idx;
                    branchUp(blockFrames, valueStack, branchDepth, numKeep);
                    break;
                }
                case WASMOPCode.op_br_if: {
                    const numKeep = reader.read_ctrl_arg();
                    const idx = reader.read_u32();
                    const branchDepth = reader.read_ctrl_arg();
                    const x = popSafe(valueStack).i32;
                    if (x !== 0) {
                        reader.at = idx;
                        branchUp(blockFrames, valueStack, branchDepth, numKeep);
                    }
                    break;
                }
                case WASMOPCode.op_br_table: {
                    const numKeep = reader.read_ctrl_arg();
                    const size = reader.read_ctrl_arg();
                    const x = popSafe(valueStack).i32;
                    const anchor = reader.at;
                    if (x >= 0 && x < size)
                        reader.at = anchor + x * (4 + CTRL_ARG_BYTELEN);
                    else 
                        reader.at = anchor + size * (4 + CTRL_ARG_BYTELEN);
                    const jumpTo = reader.read_u32();
                    const branchDepth = reader.read_ctrl_arg();
                    reader.at = jumpTo;
                    branchUp(blockFrames, valueStack, branchDepth, numKeep);
                    break;
                }
                case WASMOPCode.op_return: {
                    const branchDepth = reader.read_ctrl_arg();
                    const numKeep = reader.read_ctrl_arg();
                    if (callStack.length === 0) {
                        if (this.funcTypes[entry].rets.length !== valueStack.length) 
                            throw new RuntimeError(`Expected ${this.funcTypes[entry].rets.length} on return, got ${valueStack.length}`);
                        if (valueStack.length === 1)
                            return popSafe(valueStack).numeric;
                        return valueStack.map(x => x.numeric);
                    }
                    else {
                        const frame = callStack.pop();
                        frame !== undefined &&
                        (locals = frame.locals) &&
                        (reader.at = frame.pc) &&
                        (entry = frame.func);
                        //branch x - 1 times;
                        if (branchDepth > 0)
                            branchUp(blockFrames, valueStack, branchDepth - 1, numKeep);
                    }
                    break;
                }
                case WASMOPCode.op_call_indirect:
                case WASMOPCode.op_call: {
                    let funcIdx : number = 0;
                    if (instr === WASMOPCode.op_call) 
                        funcIdx = reader.read_ctrl_arg();
                    else {
                        const tableIdx = popSafe(valueStack).i32;
                        if (this.tables.length === 0)
                            throw new RuntimeError(`No table to index into for call_indirect`);
                        if (tableIdx < 0 || tableIdx >= this.tables[0].length)
                            throw new RuntimeError(`Table index ${tableIdx} out of range`);
                        funcIdx = this.tables[0].elements[tableIdx];
                    }
                    if (funcIdx < this.importFuncCount) {
                        //imported func call
                        const argArr : Array<any> = new Array(this.funcTypes[funcIdx].args.length);
                        for (let i = argArr.length; i > 0; --i) 
                            argArr[i - 1] = popSafe(valueStack).numeric;
                        let retVal = this.importedFuncs[funcIdx](...argArr);
                        const retLen = this.funcTypes[funcIdx].rets.length;
                        retVal = retLen === 1 ? [retVal] : retVal;
                        for (let i = 0; i < retLen; ++i) {
                            const retType = this.funcTypes[funcIdx].rets[i];
                            const ret = retVal[i];
                            switch(retType) {
                                case WASMValueType.i32:
                                    pushSafe(valueStack, newI32(ret));
                                    break;
                                case WASMValueType.f32:
                                    pushSafe(valueStack, newF32(ret));
                                    break;
                                case WASMValueType.i64:
                                    pushSafe(valueStack, newI64(BigInt(ret)));
                                    break;
                                case WASMValueType.f64:
                                    pushSafe(valueStack, newF64(ret));
                                    break;
                                case WASMValueType.nil:
                                default:
                                    break;
                            }
                        }
                        break;
                    }
                    if (callStack.length >= CALL_STACK_LIMIT)
                        throw new RuntimeError(`Maximum call stack size of ${CALL_STACK_LIMIT} exceeded`);
                    const frame = new StackFrame(locals, reader.at, entry);
                    callStack.push(frame);
                    entry = funcIdx;
                    readFuncPtr(reader, funcIdx - this.importFuncCount);
                    const argC = reader.read_ctrl_arg();
                    const localC = reader.read_ctrl_arg();
                    locals = new Array(argC + localC);
                    for (let i = argC; i > 0; --i)
                        locals[i - 1] = cloneValue(popSafe(valueStack));
                    for (let i = 0; i < localC; ++i)
                        locals[i + argC] = new WASMValue(); //error typecheck, won't matter
                    break;
                }
                case WASMOPCode.op_drop:
                    popSafe(valueStack);
                    break;
                case WASMOPCode.op_select: {
                    const choose = popSafe(valueStack).i32;
                    const y = popSafe(valueStack);
                    const x = popSafe(valueStack);
                    if (choose !== 0) pushSafe(valueStack, x);
                    else pushSafe(valueStack, y);
                    break;
                }
                case WASMOPCode.op_local_get: {
                    const idx = reader.read_ctrl_arg();
                    if (idx >= locals.length) 
                        throw new RuntimeError(`Local index ${idx} OOB`);
                    pushSafe(valueStack, cloneValue(locals[idx]));
                    break;
                }
                case WASMOPCode.op_local_set: {
                    const idx = reader.read_ctrl_arg();
                    if (idx >= locals.length) 
                        throw new RuntimeError(`Local index ${idx} OOB`);
                    locals[idx] = popSafe(valueStack);
                    break;
                }
                case WASMOPCode.op_local_tee: {
                    const idx = reader.read_ctrl_arg();
                    if (idx >= locals.length) 
                        throw new RuntimeError(`Local index ${idx} OOB`);
                    const x = popSafe(valueStack);
                    locals[idx] = cloneValue(x);
                    pushSafe(valueStack, x);
                    break;
                }
                case WASMOPCode.op_global_get: {
                    const idx = reader.read_ctrl_arg();
                    if (idx >= this.globals.length) 
                        throw new RuntimeError(`Global index ${idx} OOB`);
                    pushSafe(valueStack, cloneValue(this.globals[idx]));
                    break;
                }
                case WASMOPCode.op_global_set: {
                    const idx = reader.read_ctrl_arg();
                    if (idx >= this.globals.length)
                        throw new RuntimeError(`Global index ${idx} OOB`);
                    const x = popSafe(valueStack);
                    this.globals[idx].set(x);
                    break;
                }
                case WASMOPCode.op_i32_load: {
                    const offset = reader.read_u32();
                    const ptr = popSafe(valueStack).i32;
                    toConvert(memBuf, ptr + offset, 4);
                    pushSafe(valueStack, newI32(CONVERSION_INT32[0]));
                    break;
                }
                case WASMOPCode.op_i64_load: {
                    const offset = reader.read_u32();
                    const ptr = popSafe(valueStack).i32;
                    toConvert(memBuf, ptr + offset, 8);
                    pushSafe(valueStack, newI64(CONVERSION_INT64[0]));
                    break;
                }
                case WASMOPCode.op_f32_load: {
                    const offset = reader.read_u32();
                    const ptr = popSafe(valueStack).i32;
                    toConvert(memBuf, ptr + offset, 4);
                    pushSafe(valueStack, newF32(CONVERSION_FLOAT32[0]));
                    break;
                }
                case WASMOPCode.op_f64_load: {
                    const offset = reader.read_u32();
                    const ptr = popSafe(valueStack).i32;
                    toConvert(memBuf, ptr + offset, 8);
                    pushSafe(valueStack, newF64(CONVERSION_FLOAT64[0]));
                    break;
                }
                case WASMOPCode.op_i32_load8_s: {
                    const offset = reader.read_u32();
                    const ptr = popSafe(valueStack).i32;
                    toConvert(memBuf, ptr + offset, 1);
                    pushSafe(valueStack, newI32(CONVERSION_INT8[0]));
                    break;
                }
                case WASMOPCode.op_i32_load8_u: {
                    const offset = reader.read_u32();
                    const ptr = popSafe(valueStack).i32;
                    toConvert(memBuf, ptr + offset, 1);
                    pushSafe(valueStack, newI32(CONVERSION_UINT8[0]));
                    break;
                }
                case WASMOPCode.op_i32_load16_s: {
                    const offset = reader.read_u32();
                    const ptr = popSafe(valueStack).i32;
                    toConvert(memBuf, ptr + offset, 2);
                    pushSafe(valueStack, newI32(CONVERSION_INT16[0]));
                    break;
                }
                case WASMOPCode.op_i32_load16_u: {
                    const offset = reader.read_u32();
                    const ptr = popSafe(valueStack).i32;
                    toConvert(memBuf, ptr + offset, 2);
                    pushSafe(valueStack, newI32(CONVERSION_UINT16[0]));
                    break;
                }
                case WASMOPCode.op_i64_load8_s: {
                    const offset = reader.read_u32();
                    const ptr = popSafe(valueStack).i32;
                    toConvert(memBuf, ptr + offset, 1);
                    pushSafe(valueStack, newI64(BigInt(CONVERSION_INT8[0])));
                    break;
                }
                case WASMOPCode.op_i64_load8_u: {
                    const offset = reader.read_u32();
                    const ptr = popSafe(valueStack).i32;
                    toConvert(memBuf, ptr + offset, 1);
                    pushSafe(valueStack, newI64(BigInt(CONVERSION_UINT8[0])));
                    break;
                }
                case WASMOPCode.op_i64_load16_s: {
                    const offset = reader.read_u32();
                    const ptr = popSafe(valueStack).i32;
                    toConvert(memBuf, ptr + offset, 2);
                    pushSafe(valueStack, newI64(BigInt(CONVERSION_INT16[0])));
                    break;
                }
                case WASMOPCode.op_i64_load16_u: {
                    const offset = reader.read_u32();
                    const ptr = popSafe(valueStack).i32;
                    toConvert(memBuf, ptr + offset, 2);
                    pushSafe(valueStack, newI64(BigInt(CONVERSION_UINT16[0])));
                    break;
                }
                case WASMOPCode.op_i64_load32_s: {
                    const offset = reader.read_u32();
                    const ptr = popSafe(valueStack).i32;
                    toConvert(memBuf, ptr + offset, 4);
                    pushSafe(valueStack, newI64(BigInt(CONVERSION_INT32[0])));
                    break;
                }
                case WASMOPCode.op_i64_load32_u: {
                    const offset = reader.read_u32();
                    const ptr = popSafe(valueStack).i32;
                    toConvert(memBuf, ptr + offset, 4);
                    pushSafe(valueStack, newI64(BigInt(CONVERSION_UINT32[0])));
                    break;
                }
                case WASMOPCode.op_i32_store: {
                    const offset = reader.read_u32();
                    const val = popSafe(valueStack).i32;
                    const ptr = popSafe(valueStack).i32;
                    CONVERSION_INT32[0] = val;
                    fromConvert(memBuf, ptr + offset, 4);
                    break;
                }
                case WASMOPCode.op_i64_store: {
                    const offset = reader.read_u32();
                    const val = popSafe(valueStack).i64;
                    const ptr = popSafe(valueStack).i32;
                    CONVERSION_INT64[0] = val;
                    fromConvert(memBuf, ptr + offset, 8);
                    break;
                }
                case WASMOPCode.op_f32_store: {
                    const offset = reader.read_u32();
                    const val = popSafe(valueStack).f32;
                    const ptr = popSafe(valueStack).i32;
                    CONVERSION_FLOAT32[0] = val;
                    fromConvert(memBuf, ptr + offset, 4);
                    break;
                }
                case WASMOPCode.op_f64_store: {
                    const offset = reader.read_u32();
                    const val = popSafe(valueStack).f64;
                    const ptr = popSafe(valueStack).i32;
                    CONVERSION_FLOAT64[0] = val;
                    fromConvert(memBuf, ptr + offset, 8);
                    break;
                }
                case WASMOPCode.op_i32_store8: {
                    const offset = reader.read_u32();
                    const val = popSafe(valueStack).i32;
                    const ptr = popSafe(valueStack).i32;
                    CONVERSION_INT32[0] = val;
                    fromConvert(memBuf, ptr + offset, 1);
                    break;
                }
                case WASMOPCode.op_i32_store16: {
                    const offset = reader.read_u32();
                    const val = popSafe(valueStack).i32;
                    const ptr = popSafe(valueStack).i32;
                    CONVERSION_INT32[0] = val;
                    fromConvert(memBuf, ptr + offset, 2);
                    break;
                }
                case WASMOPCode.op_i64_store8: {
                    const offset = reader.read_u32();
                    const val = popSafe(valueStack).i64;
                    const ptr = popSafe(valueStack).i32;
                    CONVERSION_INT64[0] = val;
                    fromConvert(memBuf, ptr + offset, 1);
                    break;
                }
                case WASMOPCode.op_i64_store16: {
                    const offset = reader.read_u32();
                    const val = popSafe(valueStack).i64;
                    const ptr = popSafe(valueStack).i32;
                    CONVERSION_INT64[0] = val;
                    fromConvert(memBuf, ptr + offset, 2);
                    break;
                }
                case WASMOPCode.op_i64_store32: {
                    const offset = reader.read_u32();
                    const val = popSafe(valueStack).i64;
                    const ptr = popSafe(valueStack).i32;
                    CONVERSION_INT64[0] = val;
                    fromConvert(memBuf, ptr + offset, 4);
                    break;
                }
                case WASMOPCode.op_memory_size:
                    pushSafe(valueStack, newI32(this.memory.init));
                    break;
                case WASMOPCode.op_memory_grow:
                    pushSafe(valueStack, newI32(this.memory.init));
                    console.warn("Memory grow not implemented");
                    break;
                case WASMOPCode.op_i32_const:
                    pushSafe(valueStack, newI32(reader.read_i32()));
                    break;
                case WASMOPCode.op_i64_const:
                    pushSafe(valueStack, newI64(reader.read_i64()));
                    break;
                case WASMOPCode.op_f32_const:
                    pushSafe(valueStack, newF32(reader.read_f32()));
                    break;
                case WASMOPCode.op_f64_const:
                    pushSafe(valueStack, newF64(reader.read_f64()));
                    break;
                case WASMOPCode.op_i32_eqz: {
                    const x = popSafe(valueStack).i32;
                    pushSafe(valueStack, newI32(toTruthy(x === 0)));
                    break;
                }
                case WASMOPCode.op_i32_eq: {
                    const y = popSafe(valueStack).i32;
                    const x = popSafe(valueStack).i32;
                    pushSafe(valueStack, newI32(toTruthy(x === y)));
                    break;
                }
                case WASMOPCode.op_i32_ne: {
                    const y = popSafe(valueStack).i32;
                    const x = popSafe(valueStack).i32;
                    pushSafe(valueStack, newI32(toTruthy(x !== y)));
                    break;
                }
                case WASMOPCode.op_i32_lt_s: {
                    const y = popSafe(valueStack).i32;
                    const x = popSafe(valueStack).i32;
                    pushSafe(valueStack, newI32(toTruthy(x < y)));
                    break;
                }
                case WASMOPCode.op_i32_lt_u: {
                    CONVERSION_INT32[0] = popSafe(valueStack).i32;
                    const y = CONVERSION_UINT32[0];
                    CONVERSION_INT32[0] = popSafe(valueStack).i32;
                    const x = CONVERSION_UINT32[0];
                    pushSafe(valueStack, newI32(toTruthy(x < y)));
                    break;
                }
                case WASMOPCode.op_i32_gt_s: {
                    const y = popSafe(valueStack).i32;
                    const x = popSafe(valueStack).i32;
                    pushSafe(valueStack, newI32(toTruthy(x > y)));
                    break;
                }
                case WASMOPCode.op_i32_gt_u: {
                    CONVERSION_INT32[0] = popSafe(valueStack).i32;
                    const y = CONVERSION_UINT32[0];
                    CONVERSION_INT32[0] = popSafe(valueStack).i32;
                    const x = CONVERSION_UINT32[0];
                    pushSafe(valueStack, newI32(toTruthy(x > y)));
                    break;
                }
                case WASMOPCode.op_i32_le_s: {
                    const y = popSafe(valueStack).i32;
                    const x = popSafe(valueStack).i32;
                    pushSafe(valueStack, newI32(toTruthy(x <= y)));
                    break;
                }
                case WASMOPCode.op_i32_le_u: {
                    CONVERSION_INT32[0] = popSafe(valueStack).i32;
                    const y = CONVERSION_UINT32[0];
                    CONVERSION_INT32[0] = popSafe(valueStack).i32;
                    const x = CONVERSION_UINT32[0];
                    pushSafe(valueStack, newI32(toTruthy(x <= y)));
                    break;
                }
                case WASMOPCode.op_i32_ge_s: {
                    const y = popSafe(valueStack).i32;
                    const x = popSafe(valueStack).i32;
                    pushSafe(valueStack, newI32(toTruthy(x >= y)));
                    break;
                }
                case WASMOPCode.op_i32_ge_u: {
                    CONVERSION_INT32[0] = popSafe(valueStack).i32;
                    const y = CONVERSION_UINT32[0];
                    CONVERSION_INT32[0] = popSafe(valueStack).i32;
                    const x = CONVERSION_UINT32[0];
                    pushSafe(valueStack, newI32(toTruthy(x >= y)));
                    break;
                }
                case WASMOPCode.op_i64_eqz: {
                    const x = popSafe(valueStack).i64;
                    pushSafe(valueStack, newI32(toTruthy(x === BigInt(0))));
                    break;
                }
                case WASMOPCode.op_i64_eq: {
                    const y = popSafe(valueStack).i64;
                    const x = popSafe(valueStack).i64;
                    pushSafe(valueStack, newI32(toTruthy(x === y)));
                    break;
                }
                case WASMOPCode.op_i64_ne: {
                    const y = popSafe(valueStack).i64;
                    const x = popSafe(valueStack).i64;
                    pushSafe(valueStack, newI32(toTruthy(x !== y)));
                    break;
                }
                case WASMOPCode.op_i64_lt_s: {
                    const y = popSafe(valueStack).i64;
                    const x = popSafe(valueStack).i64;
                    pushSafe(valueStack, newI32(toTruthy(x < y)));
                    break;
                }
                case WASMOPCode.op_i64_lt_u: {
                    CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    const y = CONVERSION_UINT64[0];
                    CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    const x = CONVERSION_UINT64[0];
                    pushSafe(valueStack, newI32(toTruthy(x < y)));
                    break;
                }
                case WASMOPCode.op_i64_gt_s: {
                    const y = popSafe(valueStack).i64;
                    const x = popSafe(valueStack).i64;
                    pushSafe(valueStack, newI32(toTruthy(x > y)));
                    break;
                }
                case WASMOPCode.op_i64_gt_u: {
                    CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    const y = CONVERSION_UINT64[0];
                    CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    const x = CONVERSION_UINT64[0];
                    pushSafe(valueStack, newI32(toTruthy(x > y)));
                    break;
                }
                case WASMOPCode.op_i64_le_s: {
                    const y = popSafe(valueStack).i64;
                    const x = popSafe(valueStack).i64;
                    pushSafe(valueStack, newI32(toTruthy(x <= y)));
                    break;
                }
                case WASMOPCode.op_i64_le_u: {
                    CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    const y = CONVERSION_UINT64[0];
                    CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    const x = CONVERSION_UINT64[0];
                    pushSafe(valueStack, newI32(toTruthy(x <= y)));
                    break;
                }
                case WASMOPCode.op_i64_ge_s: {
                    const y = popSafe(valueStack).i64;
                    const x = popSafe(valueStack).i64;
                    pushSafe(valueStack, newI32(toTruthy(x >= y)));
                    break;
                }
                case WASMOPCode.op_i64_ge_u: {
                    CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    const y = CONVERSION_UINT64[0];
                    CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    const x = CONVERSION_UINT64[0];
                    pushSafe(valueStack, newI32(toTruthy(x >= y)));
                    break;
                }
                case WASMOPCode.op_f32_eq: {
                    const y = popSafe(valueStack).f32;
                    const x = popSafe(valueStack).f32;
                    pushSafe(valueStack, newI32(toTruthy(x === y)));
                    break;
                }
                case WASMOPCode.op_f32_ne: {
                    const y = popSafe(valueStack).f32;
                    const x = popSafe(valueStack).f32;
                    pushSafe(valueStack, newI32(toTruthy(x !== y)));
                    break;
                }
                case WASMOPCode.op_f32_lt: {
                    const y = popSafe(valueStack).f32;
                    const x = popSafe(valueStack).f32;
                    pushSafe(valueStack, newI32(toTruthy(x < y)));
                    break;
                }
                case WASMOPCode.op_f32_le: {
                    const y = popSafe(valueStack).f32;
                    const x = popSafe(valueStack).f32;
                    pushSafe(valueStack, newI32(toTruthy(x <= y)));
                    break;
                }
                case WASMOPCode.op_f32_gt: {
                    const y = popSafe(valueStack).f32;
                    const x = popSafe(valueStack).f32;
                    pushSafe(valueStack, newI32(toTruthy(x > y)));
                    break;
                }
                case WASMOPCode.op_f32_ge: {
                    const y = popSafe(valueStack).f32;
                    const x = popSafe(valueStack).f32;
                    pushSafe(valueStack, newI32(toTruthy(x >= y)));
                    break;
                }
                case WASMOPCode.op_f64_eq: {
                    const y = popSafe(valueStack).f64;
                    const x = popSafe(valueStack).f64;
                    pushSafe(valueStack, newI32(toTruthy(x === y)));
                    break;
                }
                case WASMOPCode.op_f64_ne: {
                    const y = popSafe(valueStack).f64;
                    const x = popSafe(valueStack).f64;
                    pushSafe(valueStack, newI32(toTruthy(x !== y)));
                    break;
                }
                case WASMOPCode.op_f64_lt: {
                    const y = popSafe(valueStack).f64;
                    const x = popSafe(valueStack).f64;
                    pushSafe(valueStack, newI32(toTruthy(x < y)));
                    break;
                }
                case WASMOPCode.op_f64_le: {
                    const y = popSafe(valueStack).f64;
                    const x = popSafe(valueStack).f64;
                    pushSafe(valueStack, newI32(toTruthy(x <= y)));
                    break;
                }
                case WASMOPCode.op_f64_gt: {
                    const y = popSafe(valueStack).f64;
                    const x = popSafe(valueStack).f64;
                    pushSafe(valueStack, newI32(toTruthy(x > y)));
                    break;
                }
                case WASMOPCode.op_f64_ge: {
                    const y = popSafe(valueStack).f64;
                    const x = popSafe(valueStack).f64;
                    pushSafe(valueStack, newI32(toTruthy(x >= y)));
                    break;
                }
                case WASMOPCode.op_i32_clz: {
                    const x = popSafe(valueStack).i32;
                    pushSafe(valueStack, newI32(Math.clz32(x)));
                    break;
                }
                case WASMOPCode.op_i32_ctz: {
                    const x = popSafe(valueStack).i32 >>> 0;
                    pushSafe(valueStack, newI32(ctz32(x)));
                    break;
                }
                case WASMOPCode.op_i32_popcnt: {
                    const x = popSafe(valueStack).i32 >>> 0;
                    pushSafe(valueStack, newI32(popcnt32(x)));
                    break;
                }
                case WASMOPCode.op_i32_add: {
                    const y = popSafe(valueStack).i32;
                    const x = popSafe(valueStack).i32;
                    pushSafe(valueStack, newI32(x + y));
                    break;
                }
                case WASMOPCode.op_i32_sub: {
                    const y = popSafe(valueStack).i32;
                    const x = popSafe(valueStack).i32;
                    pushSafe(valueStack, newI32(x - y));
                    break;
                }
                case WASMOPCode.op_i32_mul: {
                    const y = popSafe(valueStack).i32;
                    const x = popSafe(valueStack).i32;
                    pushSafe(valueStack, newI32(Math.imul(x, y)));
                    break;
                }
                case WASMOPCode.op_i32_div_s: {
                    const y = popSafe(valueStack).i32;
                    const x = popSafe(valueStack).i32;
                    if (y === 0)
                        throw new RuntimeError('Division by 0');
                    pushSafe(valueStack, newI32(x / y));
                    break;
                }
                case WASMOPCode.op_i32_div_u: {
                    const y = popSafe(valueStack).i32 >>> 0;
                    const x = popSafe(valueStack).i32 >>> 0;
                    if (y === 0)
                        throw new RuntimeError('Division by 0');
                    pushSafe(valueStack, newI32(x / y));
                    break;
                }
                case WASMOPCode.op_i32_rem_s: {
                    const y = popSafe(valueStack).i32;
                    const x = popSafe(valueStack).i32;
                    if (y === 0)
                        throw new RuntimeError('Remainder by 0');
                    pushSafe(valueStack, newI32(x % y));
                    break;
                }
                case WASMOPCode.op_i32_rem_u: {
                    const y = popSafe(valueStack).i32 >>> 0;
                    const x = popSafe(valueStack).i32 >>> 0;
                    if (y === 0)
                        throw new RuntimeError('Remainder by 0');
                    pushSafe(valueStack, newI32(x % y));
                    break;
                }
                case WASMOPCode.op_i32_and: {
                    const y = popSafe(valueStack).i32;
                    const x = popSafe(valueStack).i32;
                    pushSafe(valueStack, newI32(x & y));
                    break;
                }
                case WASMOPCode.op_i32_or: {
                    const y = popSafe(valueStack).i32;
                    const x = popSafe(valueStack).i32;
                    pushSafe(valueStack, newI32(x | y));
                    break;
                }
                case WASMOPCode.op_i32_xor: {
                    const y = popSafe(valueStack).i32;
                    const x = popSafe(valueStack).i32;
                    pushSafe(valueStack, newI32(x ^ y));
                    break;
                }
                case WASMOPCode.op_i32_shl: {
                    const y = popSafe(valueStack).i32;
                    const x = popSafe(valueStack).i32;
                    pushSafe(valueStack, newI32(x << y));
                    break;
                }
                case WASMOPCode.op_i32_shr_s: {
                    const y = popSafe(valueStack).i32;
                    const x = popSafe(valueStack).i32;
                    pushSafe(valueStack, newI32(x >> y));
                    break;
                }
                case WASMOPCode.op_i32_shr_u: {
                    const y = popSafe(valueStack).i32;
                    const x = popSafe(valueStack).i32;
                    pushSafe(valueStack, newI32(x >>> y));
                    break;
                }
                case WASMOPCode.op_i32_rotl: {
                    const y = popSafe(valueStack).i32;
                    const x = popSafe(valueStack).i32;
                    pushSafe(valueStack, newI32(rotl32(x, y)));
                    break;
                }
                case WASMOPCode.op_i32_rotr: {
                    const y = popSafe(valueStack).i32;
                    const x = popSafe(valueStack).i32;
                    pushSafe(valueStack, newI32(rotr32(x, y)));
                    break;
                }
                case WASMOPCode.op_i64_clz: {
                    CONVERSION_UINT64[0] = popSafe(valueStack).i64;
                    if (CONVERSION_UINT32[1] === 0)
                        pushSafe(valueStack, newI64(BigInt(32 + Math.clz32(CONVERSION_UINT32[0]))));
                    else
                        pushSafe(valueStack, newI64(BigInt(Math.clz32(CONVERSION_UINT32[1]))));
                    break;
                }
                case WASMOPCode.op_i64_ctz: {
                    CONVERSION_UINT64[0] = popSafe(valueStack).i64;
                    if (CONVERSION_UINT32[0] === 0)
                        pushSafe(valueStack, newI64(BigInt(32 + ctz32(CONVERSION_UINT32[1]))));
                    else
                        pushSafe(valueStack, newI64(BigInt(ctz32(CONVERSION_UINT32[0]))));
                    break;
                }
                case WASMOPCode.op_i64_popcnt: {
                    CONVERSION_UINT64[0] = popSafe(valueStack).i64;
                    pushSafe(valueStack, newI64(BigInt(popcnt32(CONVERSION_UINT32[0]) + popcnt32(CONVERSION_UINT32[1]))));
                    break;
                }
                case WASMOPCode.op_i64_add: {
                    const y = popSafe(valueStack).i64;
                    const x = popSafe(valueStack).i64;
                    pushSafe(valueStack, newI64(x + y));
                    break;
                }
                case WASMOPCode.op_i64_sub: {
                    const y = popSafe(valueStack).i64;
                    const x = popSafe(valueStack).i64;
                    pushSafe(valueStack, newI64(x - y));
                    break;
                }
                case WASMOPCode.op_i64_mul: {
                    const y = popSafe(valueStack).i64;
                    const x = popSafe(valueStack).i64;
                    pushSafe(valueStack, newI64(x * y));
                    break;
                }
                case WASMOPCode.op_i64_div_s: {
                    const y = popSafe(valueStack).i64;
                    const x = popSafe(valueStack).i64;
                    if (y === BigInt(0))
                        throw new RuntimeError(`Division by 0`);
                    pushSafe(valueStack, newI64(x / y));
                    break;
                }
                case WASMOPCode.op_i64_div_u: {
                    CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    const y = CONVERSION_UINT64[0];
                    CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    const x = CONVERSION_UINT64[0];
                    if (y === BigInt(0))
                        throw new RuntimeError(`Division by 0`);
                    pushSafe(valueStack, newI64(x / y));
                    break;
                }
                case WASMOPCode.op_i64_rem_s: {
                    const y = popSafe(valueStack).i64;
                    const x = popSafe(valueStack).i64;
                    if (y === BigInt(0))
                        throw new RuntimeError(`Remainder by 0`);
                    pushSafe(valueStack, newI64(x % y));
                    break;
                }
                case WASMOPCode.op_i64_rem_u: {
                    CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    const y = CONVERSION_UINT64[0];
                    CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    const x = CONVERSION_UINT64[0];
                    if (y === BigInt(0))
                        throw new RuntimeError(`Remainder by 0`);
                    pushSafe(valueStack, newI64(x % y));
                    break;
                }
                case WASMOPCode.op_i64_and: {
                    const y = popSafe(valueStack).i64;
                    const x = popSafe(valueStack).i64;
                    pushSafe(valueStack, newI64(x & y));
                    break;
                }
                case WASMOPCode.op_i64_or: {
                    const y = popSafe(valueStack).i64;
                    const x = popSafe(valueStack).i64;
                    pushSafe(valueStack, newI64(x | y));
                    break;
                }
                case WASMOPCode.op_i64_xor: {
                    const y = popSafe(valueStack).i64;
                    const x = popSafe(valueStack).i64;
                    pushSafe(valueStack, newI64(x ^ y));
                    break;
                }
                case WASMOPCode.op_i64_shl: {
                    const y = popSafe(valueStack).i64;
                    const x = popSafe(valueStack).i64;
                    pushSafe(valueStack, newI64(x << y));
                    break;
                }
                case WASMOPCode.op_i64_shr_s: {
                    const y = popSafe(valueStack).i64;
                    const x = popSafe(valueStack).i64;
                    pushSafe(valueStack, newI64(x >> y));
                    break;
                }
                case WASMOPCode.op_i64_shr_u: {
                    const y = popSafe(valueStack).i64;
                    CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    const x = CONVERSION_UINT64[0];
                    pushSafe(valueStack, newI64(x >> y));
                    break;
                }
                case WASMOPCode.op_i64_rotl: {
                    const y = popSafe(valueStack).i64;
                    CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    const x = CONVERSION_UINT64[0];
                    pushSafe(valueStack, newI64(rotl64(x, y)));
                    break;
                }
                case WASMOPCode.op_i64_rotr: {
                    const y = popSafe(valueStack).i64;
                    CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    const x = CONVERSION_UINT64[0];
                    pushSafe(valueStack, newI64(rotr64(x, y)));
                    break;
                }
                case WASMOPCode.op_f32_abs: {
                    const x = popSafe(valueStack).f32;
                    pushSafe(valueStack, newF32(Math.abs(x)));
                    break;
                }
                case WASMOPCode.op_f32_neg: {
                    const x = popSafe(valueStack).f32;
                    pushSafe(valueStack, newF32(-x));
                    break;
                }
                case WASMOPCode.op_f32_ceil: {
                    const x = popSafe(valueStack).f32;
                    pushSafe(valueStack, newF32(Math.ceil(x)));
                    break;
                }
                case WASMOPCode.op_f32_floor: {
                    const x = popSafe(valueStack).f32;
                    pushSafe(valueStack, newF32(Math.floor(x)));
                    break;
                }
                case WASMOPCode.op_f32_trunc: {
                    const x = popSafe(valueStack).f32;
                    pushSafe(valueStack, newF32(Math.trunc(x)));
                    break;
                }
                case WASMOPCode.op_f32_nearest: {
                    const x = popSafe(valueStack).f32;
                    pushSafe(valueStack, newF32(Math.round(x)));
                    break;
                }
                case WASMOPCode.op_f32_sqrt: {
                    const x = popSafe(valueStack).f32;
                    pushSafe(valueStack, newF32(Math.sqrt(x)));
                    break;
                }
                case WASMOPCode.op_f32_add: {
                    const y = popSafe(valueStack).f32;
                    const x = popSafe(valueStack).f32;
                    pushSafe(valueStack, newF32(x + y));
                    break;
                }
                case WASMOPCode.op_f32_sub: {
                    const y = popSafe(valueStack).f32;
                    const x = popSafe(valueStack).f32;
                    pushSafe(valueStack, newF32(x - y));
                    break;
                }
                case WASMOPCode.op_f32_mul: {
                    const y = popSafe(valueStack).f32;
                    const x = popSafe(valueStack).f32;
                    pushSafe(valueStack, newF32(x * y));
                    break;
                }
                case WASMOPCode.op_f32_div: {
                    const y = popSafe(valueStack).f32;
                    const x = popSafe(valueStack).f32;
                    pushSafe(valueStack, newF32(x / y));
                    break;
                }
                case WASMOPCode.op_f32_min: {
                    const y = popSafe(valueStack).f32;
                    const x = popSafe(valueStack).f32;
                    pushSafe(valueStack, newF32(Math.min(x, y)));
                    break;
                }
                case WASMOPCode.op_f32_max: {
                    const y = popSafe(valueStack).f32;
                    const x = popSafe(valueStack).f32;
                    pushSafe(valueStack, newF32(Math.max(x, y)));
                    break;
                }
                case WASMOPCode.op_f32_copysign: {
                    const y = popSafe(valueStack).f32;
                    const x = popSafe(valueStack).f32;
                    if (Math.sign(y) === Math.sign(x)) pushSafe(valueStack, newF32(x));
                    else pushSafe(valueStack, newF32(-x));
                    break;
                }
                case WASMOPCode.op_f64_abs: {
                    const x = popSafe(valueStack).f64;
                    pushSafe(valueStack, newF64(Math.abs(x)));
                    break;
                }
                case WASMOPCode.op_f64_neg: {
                    const x = popSafe(valueStack).f64;
                    pushSafe(valueStack, newF64(-x));
                    break;
                }
                case WASMOPCode.op_f64_ceil: {
                    const x = popSafe(valueStack).f64;
                    pushSafe(valueStack, newF64(Math.ceil(x)));
                    break;
                }
                case WASMOPCode.op_f64_floor: {
                    const x = popSafe(valueStack).f64;
                    pushSafe(valueStack, newF64(Math.floor(x)));
                    break;
                }
                case WASMOPCode.op_f64_trunc: {
                    const x = popSafe(valueStack).f64;
                    pushSafe(valueStack, newF64(Math.trunc(x)));
                    break;
                }
                case WASMOPCode.op_f64_nearest: {
                    const x = popSafe(valueStack).f64;
                    pushSafe(valueStack, newF64(Math.round(x)));
                    break;
                }
                case WASMOPCode.op_f64_sqrt: {
                    const x = popSafe(valueStack).f64;
                    pushSafe(valueStack, newF64(Math.sqrt(x)));
                    break;
                }
                case WASMOPCode.op_f64_add: {
                    const y = popSafe(valueStack).f64;
                    const x = popSafe(valueStack).f64;
                    pushSafe(valueStack, newF64(x + y));
                    break;
                }
                case WASMOPCode.op_f64_sub: {
                    const y = popSafe(valueStack).f64;
                    const x = popSafe(valueStack).f64;
                    pushSafe(valueStack, newF64(x - y));
                    break;
                }
                case WASMOPCode.op_f64_mul: {
                    const y = popSafe(valueStack).f64;
                    const x = popSafe(valueStack).f64;
                    pushSafe(valueStack, newF64(x * y));
                    break;
                }
                case WASMOPCode.op_f64_div: {
                    const y = popSafe(valueStack).f64;
                    const x = popSafe(valueStack).f64;
                    pushSafe(valueStack, newF64(x / y));
                    break;
                }
                case WASMOPCode.op_f64_min: {
                    const y = popSafe(valueStack).f64;
                    const x = popSafe(valueStack).f64;
                    pushSafe(valueStack, newF64(Math.min(x, y)));
                    break;
                }
                case WASMOPCode.op_f64_max: {
                    const y = popSafe(valueStack).f64;
                    const x = popSafe(valueStack).f64;
                    pushSafe(valueStack, newF64(Math.max(x, y)));
                    break;
                }
                case WASMOPCode.op_f64_copysign: {
                    const y = popSafe(valueStack).f64;
                    const x = popSafe(valueStack).f64;
                    if (Math.sign(y) === Math.sign(x)) pushSafe(valueStack, newF64(x));
                    else pushSafe(valueStack, newF64(-x));
                    break;
                }
                //bit twiddler operations
                case WASMOPCode.op_i32_wrap_i64: {
                    const x = popSafe(valueStack).i64;
                    CONVERSION_UINT64[0] = x;
                    pushSafe(valueStack, newI32(CONVERSION_INT32[0]));
                    break;
                }
                case WASMOPCode.op_i32_trunc_f32_s: {
                    const x = Math.fround(Math.trunc(popSafe(valueStack).f32));
                    if (x < -0x80000000 || x > 0x7FFFFFFF)
                        throw new RuntimeError('Float unrepresentable as a signed int32');
                    pushSafe(valueStack, newI32(x >> 0));
                    break;
                }
                case WASMOPCode.op_i32_trunc_f32_u: {
                    const x = Math.fround(Math.trunc(popSafe(valueStack).f32));
                    if (x < 0 || x > 0xFFFFFFFF)
                        throw new RuntimeError('Float unrepresentable as an unsigned int32');
                    pushSafe(valueStack, newI32(x >> 0));
                    break;
                }
                case WASMOPCode.op_i32_trunc_f64_s: {
                    const x = Math.trunc(popSafe(valueStack).f64);
                    if (x < -0x80000000 || x > 0x7FFFFFFF)
                        throw new RuntimeError('Float unrepresentable as a signed int32');
                    pushSafe(valueStack, newI32(x >> 0));
                    break;
                }
                case WASMOPCode.op_i32_trunc_f64_u: {
                    const x = Math.trunc(popSafe(valueStack).f64);
                    if (x < 0 || x > 0xFFFFFFFF)
                        throw new RuntimeError('Float unrepresentable as an unsigned int32');
                    pushSafe(valueStack, newI32(x >> 0));
                    break;
                }
                case WASMOPCode.op_i64_extend_i32_s: {
                    const x = popSafe(valueStack).i32;
                    pushSafe(valueStack, newI64(BigInt(x)));
                    break;
                }
                case WASMOPCode.op_i64_extend_i32_u: {
                    const x = popSafe(valueStack).i32;
                    pushSafe(valueStack, newI64(BigInt(x >> 0)));
                    break;
                }
                case WASMOPCode.op_i64_trunc_f32_s: {
                    const x = BigInt(Math.fround(Math.trunc(popSafe(valueStack).f32)));
                    if (x < -BigInt("0x8000000000000000") || x > BigInt("0x7FFFFFFFFFFFFFFF"))
                        throw new RuntimeError('Float unrepresentable as a signed int64');
                    CONVERSION_INT64[0] = x;
                    pushSafe(valueStack, newI64(CONVERSION_INT64[0]));
                    break;
                }
                case WASMOPCode.op_i64_trunc_f32_u: {
                    const x = BigInt(Math.fround(Math.trunc(popSafe(valueStack).f32)));
                    if (x < BigInt(0) || x > BigInt("0xFFFFFFFFFFFFFFFF"))
                        throw new RuntimeError('Float unrepresentable as a signed int64');
                    CONVERSION_UINT64[0] = x;
                    pushSafe(valueStack, newI64(CONVERSION_INT64[0]));
                    break;
                }
                case WASMOPCode.op_i64_trunc_f64_s: {
                    const x = BigInt(Math.trunc(popSafe(valueStack).f64));
                    if (x < -BigInt("0x8000000000000000") || x > BigInt("0x7FFFFFFFFFFFFFFF"))
                        throw new RuntimeError('Float unrepresentable as a signed int64');
                    CONVERSION_INT64[0] = x;
                    pushSafe(valueStack, newI64(CONVERSION_INT64[0]));
                    break;
                }
                case WASMOPCode.op_i64_trunc_f64_u: {
                    const x = BigInt(Math.trunc(popSafe(valueStack).f64));
                    if (x < BigInt(0) || x > BigInt("0xFFFFFFFFFFFFFFFF"))
                        throw new RuntimeError('Float unrepresentable as a signed int64');
                    CONVERSION_UINT64[0] = x;
                    pushSafe(valueStack, newI64(CONVERSION_INT64[0]));
                    break;
                }
                case WASMOPCode.op_f32_convert_i32_s: {
                    const x = Math.fround(popSafe(valueStack).i32 >> 0);
                    pushSafe(valueStack, newF32(x));
                    break;
                }
                case WASMOPCode.op_f32_convert_i32_u: {
                    const x = Math.fround(popSafe(valueStack).i32 >>> 0);
                    pushSafe(valueStack, newF32(x));
                    break;
                }
                case WASMOPCode.op_f32_convert_i64_s: {
                    const x = Math.fround(Number(popSafe(valueStack).i64) >> 0);
                    pushSafe(valueStack, newF32(x));
                    break;
                }
                case WASMOPCode.op_f32_convert_i64_u: {
                    const x = Math.fround(Number(popSafe(valueStack).i64) >>> 0);
                    pushSafe(valueStack, newF32(x));
                    break;
                }
                case WASMOPCode.op_f32_demote_f64: {
                    const x = Math.fround(popSafe(valueStack).f64);
                    pushSafe(valueStack, newF32(x));
                    break;
                }
                case WASMOPCode.op_f64_convert_i32_s: {
                    const x = popSafe(valueStack).i32;
                    pushSafe(valueStack, newF64(x));
                    break;
                }
                case WASMOPCode.op_f64_convert_i32_u: {
                    const x = popSafe(valueStack).i32 >>> 0;
                    pushSafe(valueStack, newF64(x));
                    break;
                }
                case WASMOPCode.op_f64_convert_i64_s: {
                    const x = Number(popSafe(valueStack).i64);
                    pushSafe(valueStack, newF64(x));
                    break;
                }
                case WASMOPCode.op_f64_convert_i64_u: {
                    CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    const x = Number(CONVERSION_UINT64[0]);
                    pushSafe(valueStack, newF64(x));
                    break;
                }
                case WASMOPCode.op_f64_promote_f32: {
                    const x = popSafe(valueStack).f32;
                    pushSafe(valueStack, newF64(x));
                    break;
                }
                case WASMOPCode.op_i32_reinterpret_f32: {
                    CONVERSION_FLOAT32[0] = popSafe(valueStack).f32;
                    pushSafe(valueStack, newI32(CONVERSION_INT32[0]));
                    break;
                }
                case WASMOPCode.op_i64_reinterpret_f64: {
                    CONVERSION_FLOAT64[0] = popSafe(valueStack).f64;
                    pushSafe(valueStack, newI64(CONVERSION_INT64[0]));
                    break;
                }
                case WASMOPCode.op_f32_reinterpret_i32: {
                    CONVERSION_INT32[0] = popSafe(valueStack).i32;
                    pushSafe(valueStack, newF32(CONVERSION_FLOAT32[0]));
                    break;
                }
                case WASMOPCode.op_f64_reinterpret_i64: {
                    CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    pushSafe(valueStack, newF64(CONVERSION_FLOAT64[0]));
                    break;
                }
                case WASMOPCode.op_i32_extend8_s: {
                    const x = popSafe(valueStack).i32;
                    CONVERSION_UINT8[0] = x;
                    pushSafe(valueStack, newI32(CONVERSION_INT32[0]));       
                    break;
                }
                case WASMOPCode.op_i32_extend16_s: {
                    const x = popSafe(valueStack).i32;
                    CONVERSION_UINT16[0] = x;
                    pushSafe(valueStack, newI32(CONVERSION_INT32[0]));       
                    break;
                }
                case WASMOPCode.op_i64_extend8_s: {
                    const x = popSafe(valueStack).i64;
                    CONVERSION_UINT8[0] = Number(x);
                    pushSafe(valueStack, newI64(CONVERSION_INT64[0]));       
                    break;
                }
                case WASMOPCode.op_i64_extend16_s: {
                    const x = popSafe(valueStack).i64;
                    CONVERSION_UINT8[0] = Number(x);
                    pushSafe(valueStack, newI64(CONVERSION_INT64[0]));       
                    break;
                }
                case WASMOPCode.op_i64_extend32_s: {
                    const x = popSafe(valueStack).i64;
                    CONVERSION_UINT8[0] = Number(x);
                    pushSafe(valueStack, newI64(CONVERSION_INT64[0]));       
                    break;
                }
                case WASMOPCode.op_memory_copy: {
                    const n = popSafe(valueStack).i32;
                    const s = popSafe(valueStack).i32;
                    const d = popSafe(valueStack).i32;
                    if (d <= s) {
                        for (let i = 0; i < n; ++i)
                            this.memory._buffer[i + d] = this.memory._buffer[i + s]; 
                    }
                    else {
                        for (let i = n; i > 0; --i)
                            this.memory._buffer[d - i - 1] = this.memory._buffer[s - i - 1]; 
                    }
                    break;
                }
                case WASMOPCode.op_memory_fill: {
                    const n = popSafe(valueStack).i32;
                    const val = popSafe(valueStack).i32;
                    const d = popSafe(valueStack).i32;
                    for (let i = 0; i < n; ++i)
                        this.memory._buffer[d + i] = val;
                    break;
                }
                case WASMOPCode.op_i32_trunc_sat_f32_s: {
                    //nontrapping
                    const x = Math.trunc(popSafe(valueStack).f32);
                    pushSafe(valueStack, newI32(x >> 0));
                    break;
                }
                case WASMOPCode.op_i32_trunc_sat_f32_u: {
                    //nontrapping
                    const x = Math.trunc(popSafe(valueStack).f32);
                    pushSafe(valueStack, newI32(x >>> 0));
                    break;
                }
                case WASMOPCode.op_i32_trunc_sat_f64_s: {
                    //nontrapping
                    const x = Math.trunc(popSafe(valueStack).f64);
                    pushSafe(valueStack, newI32(x >> 0));
                    break;
                }
                case WASMOPCode.op_i32_trunc_sat_f64_u: {
                    //nontrapping
                    const x = Math.trunc(popSafe(valueStack).f64);
                    pushSafe(valueStack, newI32(x >>> 0));
                    break;
                }
                default:
                    throw new RuntimeError(`Invalid opcode ${instr}`)
            }
        }
    }
}