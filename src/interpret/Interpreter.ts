import { FixedLengthReader } from "../helpers/Lexer";
import { WASMValue } from "../spec/Code";
import { WASMOPCode } from "../spec/OpCode";
import { WASMFuncType, WASMSection2Content, WASMSection4Content } from "../spec/sections";
import { WASMValueType } from "../spec/types";
import { WASMGlobalImport } from "../interface/Global";
import WASMMemory from "../interface/Memory";
import WASMTable from "../interface/Table";
import WASMModule from "../compile/Module";
import { convertToExecForm } from "./Convert";
import evalConstExpr from "./ConstEval";

//TODO: speed up with in-place allocation

class StackFrame {
    locals : Array<WASMValue>;
    pc : number;
    constructor(locals : Array<WASMValue>, pc : number) {
        this.locals = locals;
        this.pc = pc;
    }
}

function toTruthy(b : boolean) : number {
    return b ? 1 : 0;
}

function popSafe(arr : Array<WASMValue>) : WASMValue {
    if (arr.length === 0) throw new Error("Stack empty, cannot pop");
    const v = arr.pop();
    if (v === undefined) throw new Error("Won't happen");
    return v;
}

function readFuncPtr(reader : FixedLengthReader, idx : number) : number {
    reader.at = idx * 4;
    return reader.read_u32();
}

export class Program {
    code : Uint8Array = new Uint8Array(0);
    memory : WASMMemory = new WASMMemory({});
    funcTypes : Array<WASMFuncType> = [];
    globals : Array<WASMValue> = [];
    tables : Array<WASMTable> = [];

    importedFuncs : Array<Function> = [];
    importFuncCount : number = 0;
    importGlobalCount : number = 0;

    funcCount : number = 0;

    exports : object = {};

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
            for (const glob of repr.section6.content) {
                this.globals.push(evalConstExpr(glob.expr));
            }
        }
        if (repr.has_section(7)) {
            //exports
            //error fix
            //0 = func
            //1 = table
            //2 = memory
            //3 = global
        }
        if (repr.has_section(9)) {
            //elems
            if (this.tables.length === 0)
                throw new Error("Expected a table initialization");
            for (const elem of repr.section9.content) {
                //using passive tables
                const offset = evalConstExpr(elem.offset).u32;
                if (offset + elem.funcrefs.length > this.tables[0].length)
                    throw new Error("Out of Bounds element initialization");
                for (let i = 0; i < elem.funcrefs.length; ++i)
                    this.tables[0].elements[i + offset] = elem.funcrefs[i];
            }
        }
        if (repr.has_section(11)) {
            //data
            for (const data of repr.section11.content) {
                const offset = evalConstExpr(data.offset).u32;
                if (offset + data.data.length > this.memory.length)
                    throw new Error("Out of bounds data initialization");
                this.memory.buffer.set(data.data, offset);
            }
        }

        if (repr.has_section(8)) {
            //start
            //this.start = repr.section8.index;
            this.run(repr.section8.index, []);
        }
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
                throw new Error(`Imported module [${module}] does not exist or is not an object`);
            switch (desc.kind) {
                case 0: {
                    //func
                    const func = imports[module][name];
                    if (!(func instanceof Function)) 
                        throw new Error(`Invalid import ${module}.${name}: expected function`);
                    this.importedFuncs.push(func);
                    break;
                }
                case 1: {
                    const table = imports[module][name];
                    if (!(table instanceof WASMTable))
                        throw new Error(`Invalid import ${module}.${name}: expected WebAssembly.table`);
                    this.tables.push(table);
                    break;
                }
                case 2: {
                    //memory, we assume there is only 1
                    const mem = imports[module][name];
                    if (!(mem instanceof WASMMemory))
                        throw new Error(`Invalid import ${module}.${name}: expected WebAssembly.Memory`);
                    if (mem.init !== desc.limits.min)
                        throw new Error("Imported memory initial size wrong")
                    if (mem.max !== desc.limits.max)
                        throw new Error("Imported memory maximum size wrong")
                    this.memory = mem;
                    break;
                }
                case 3: {
                    //global
                    const glob = imports[module][name];
                    if (!(glob instanceof WASMGlobalImport)) 
                        throw new Error(`Invalid import ${module}.${name}: expected WebAssembly.Global`);
                    if (glob._value.type !== desc.type)
                        throw new Error("Imported global type mismatch");
                    ++importGlobalCount;
                    this.globals.unshift(glob._value);
                    break;
                }
                default:
                    throw new Error("Unexpected import type");
                    break;
            }
        }
        if (this.importFuncCount !== this.importedFuncs.length)
            throw new Error(`Function import count mismatch: expected ${this.importFuncCount}, got ${this.importedFuncs.length}`);
        
        if (this.importGlobalCount !== importGlobalCount)
            throw new Error(`Global import count mismatch: expected ${this.importGlobalCount}, got ${importGlobalCount}`);
    }

    initializeTables(tableDesc : Array<WASMSection4Content>) : void {
        for (const desc of tableDesc)
            this.tables.push(new WASMTable({ initial: desc.limit.min, maximum: desc.limit.max }))
    }

    run(entry : number, args : Array<WASMValue>) : bigint | number | undefined {
        if (entry < 0 || entry >= this.funcCount + this.importFuncCount)
            throw new Error("Invalid function index");
        if (entry < this.importFuncCount) {
            console.warn("Attempting to start with an imported function: returning 0 for now");
            return 0; //import function call?
        }
        const reader = new FixedLengthReader(this.code);
        reader.at = readFuncPtr(reader, entry - this.importFuncCount);
        const valueStack : Array<WASMValue> = [];
        const callStack : Array<StackFrame> = [];
        let argC = reader.read_u32();
        let localC = reader.read_u32();
        let locals : Array<WASMValue> = new Array(argC + localC);
        if (argC !== args.length) 
            throw new Error("Invalid number of arguments");

        for (let i = 0; i < argC; ++i) {
            if (this.funcTypes[entry].args[i] !== args[i].type) 
                throw new Error("Invalid initial argument type");
            locals[i] = args[i];
            //check arg type
        }
        while (true) {
            const instr = reader.read_u8();
            switch (instr) {
                case WASMOPCode.op_unreachable:
                    throw new Error("Unreachable");
                case WASMOPCode.op_drop:
                    popSafe(valueStack);
                    break;
                case WASMOPCode.op_return: {
                    if (callStack.length === 0) {
                        if (this.funcTypes[entry].ret !== WASMValueType.nil) {
                            if (valueStack.length !== 1) throw new Error("Stack size not exactly 1");
                            const retval = valueStack.pop();
                            return retval?.numeric;
                        }
                        if (valueStack.length !== 0) throw new Error("Stack expected to be empty");
                        return;
                    }
                    else {
                        const frame = callStack.pop();
                        frame !== undefined &&
                        (locals = frame.locals) &&
                        (reader.at = frame.pc);
                    }
                    break;
                }
                case WASMOPCode.op_i32_const:
                    valueStack.push(WASMValue.createI32Literal(reader.read_i32()));
                    break;
                case WASMOPCode.op_f32_const:
                    valueStack.push(WASMValue.createF32Literal(reader.read_f32()));
                    break;
                case WASMOPCode.op_i64_const:
                    valueStack.push(WASMValue.createI64Literal(reader.read_i64()));
                    break;
                case WASMOPCode.op_f64_const:
                    valueStack.push(WASMValue.createF64Literal(reader.read_f64()));
                    break;
                case WASMOPCode.op_i32_add: {
                    const y = popSafe(valueStack);
                    const x = popSafe(valueStack);
                    valueStack.push(WASMValue.createI32Literal(x.i32 + y.i32));
                    break;
                }
                case WASMOPCode.op_i32_sub: {
                    const y = popSafe(valueStack);
                    const x = popSafe(valueStack);
                    valueStack.push(WASMValue.createI32Literal(x.i32 - y.i32));
                    break;
                }
                case WASMOPCode.op_i32_mul: {
                    const y = popSafe(valueStack);
                    const x = popSafe(valueStack);
                    valueStack.push(WASMValue.createI32Literal(x.i32 * y.i32));
                    break;
                }
                case WASMOPCode.op_i32_div_s: {
                    const y = popSafe(valueStack);
                    const x = popSafe(valueStack);
                    valueStack.push(WASMValue.createI32Literal((x.i32 / y.i32)|0));
                    break;
                }
                case WASMOPCode.op_i32_div_u: {
                    const y = popSafe(valueStack);
                    const x = popSafe(valueStack);
                    valueStack.push(WASMValue.createI32Literal(Math.trunc(x.u32 / y.u32)));
                    break;
                }
                case WASMOPCode.op_f64_add: {
                    const y = popSafe(valueStack);
                    const x = popSafe(valueStack);
                    valueStack.push(WASMValue.createF64Literal(x.f64 + y.f64));
                    break;
                }
                case WASMOPCode.op_f64_sub: {
                    const y = popSafe(valueStack);
                    const x = popSafe(valueStack);
                    valueStack.push(WASMValue.createF64Literal(x.f64 - y.f64));
                    break;
                }
                case WASMOPCode.op_f64_mul: {
                    const y = popSafe(valueStack);
                    const x = popSafe(valueStack);
                    valueStack.push(WASMValue.createF64Literal(x.f64 * y.f64));
                    break;
                }
                case WASMOPCode.op_f64_div: {
                    const y = popSafe(valueStack);
                    const x = popSafe(valueStack);
                    valueStack.push(WASMValue.createF64Literal(x.f64 / y.f64));
                    break;
                }
                case WASMOPCode.op_f64_lt: {
                    const y = popSafe(valueStack);
                    const x = popSafe(valueStack);
                    valueStack.push(WASMValue.createI32Literal(toTruthy(x.f64 < y.f64)));
                    break;
                }
                case WASMOPCode.op_call: {
                    const funcIdx = reader.read_u32();
                    if (funcIdx < this.importFuncCount) {
                        //imported func call
                        const argArr : Array<any> = new Array(this.funcTypes[funcIdx].args.length);
                        for (let i = argArr.length; i > 0; --i) 
                            argArr[i - 1] = popSafe(valueStack).numeric;
                        const ret = this.importedFuncs[funcIdx](...argArr);
                        switch(this.funcTypes[funcIdx].ret) {
                            case WASMValueType.i32:
                                valueStack.push(WASMValue.createI32Literal(ret));
                                break;
                            case WASMValueType.f32:
                                valueStack.push(WASMValue.createF32Literal(ret));
                                break;
                            case WASMValueType.i64:
                                valueStack.push(WASMValue.createI64Literal(BigInt(ret)));
                                break;
                            case WASMValueType.f64:
                                valueStack.push(WASMValue.createF64Literal(ret));
                                break;
                            case WASMValueType.nil:
                            default:
                                break;
                        }
                        break;
                    }
                    const frame = new StackFrame(locals, reader.at);
                    callStack.push(frame);
                    reader.at = readFuncPtr(reader, funcIdx - this.importFuncCount);
                    const argC = reader.read_u32();
                    const localC = reader.read_u32();
                    locals = new Array(argC + localC);
                    for (let i = argC; i > 0; --i)
                        locals[i - 1] = popSafe(valueStack);

                    break;
                }
                case WASMOPCode.op_local_get: {
                    const idx = reader.read_u32();
                    if (idx >= locals.length) throw new Error("Local index OOB");
                    valueStack.push(locals[idx]);
                    break;
                }
                case WASMOPCode.op_local_set: {
                    const idx = reader.read_u32();
                    if (idx >= locals.length) throw new Error("Local index OOB");
                    const x = popSafe(valueStack);
                    locals[idx] = x;
                    break;
                }
                case WASMOPCode.op_global_get: {
                    const idx = reader.read_u32();
                    if (idx >= this.globals.length) 
                        throw new Error("Global index OOB");
                    valueStack.push(this.globals[idx]);
                    break;
                }
                case WASMOPCode.op_global_set: {
                    const idx = reader.read_u32();
                    if (idx >= this.globals.length)
                        throw new Error("Global index OOB");
                    const x = popSafe(valueStack);
                    this.globals[idx].set(x);
                    break;
                }
                case WASMOPCode.op_br: {
                    const idx = reader.read_u32();
                    reader.at = idx;
                    break;
                }
                case WASMOPCode.op_br_if: {
                    const idx = reader.read_u32();
                    const x = popSafe(valueStack);
                    if (x.i32 !== 0) reader.at = idx;
                    break;
                }
                case WASMOPCode.op_if: {
                    const idx = reader.read_u32();
                    const x = popSafe(valueStack);
                    if (x.i32 === 0) reader.at = idx;
                    break;
                }
            }
        }
        //throw new Error(`Unreachable`);
    }
}