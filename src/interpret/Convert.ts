import WASMRepr from "../compile/Repr";

import { FixedLengthWriter } from "../helpers/Lexer";
import { InstrNode, WASMValue } from "../spec/Code";
import { WASMOPCode } from "../spec/OpCode";
import { WASMFuncType } from "../spec/sections";
import { WASMValueType } from "../spec/types";
import evalConstExpr from "./Consteval";
import { Program } from "./Interpreter";

function writeWASMValue(writer : FixedLengthWriter, value : WASMValue) : void {
    switch (value.type) {
        case WASMValueType.u32:
            writer.write_u32(value.u32)
            break;
        case WASMValueType.i32:
            writer.write_i32(value.i32)
            break;
        case WASMValueType.f32:
            writer.write_f32(value.f32)
            break;
        case WASMValueType.i64:
            writer.write_i64(value.i64)
            break;
        case WASMValueType.f64:
            writer.write_f64(value.f64)
            break;
        default:
            break;
    }
}

function writeInstrNodes(writer : FixedLengthWriter, instrs : Array<InstrNode>, blockPtrStack : Array<Array<number>>, funcPtrArr : Array<Array<number>>) : void {
    for (const instr of instrs) {
        writer.write_u8(instr.instr);
        switch (instr.instr) {
            case WASMOPCode.op_block: {
                blockPtrStack.push([]);
                writeInstrNodes(writer, instr.child, blockPtrStack, funcPtrArr);
                const toWrite = blockPtrStack.pop();
                if (toWrite == undefined) throw new Error("Empty blockPtrStack : impossible");
                for (const ptr of toWrite) {
                    writer.retroactive_write_u32(writer.at, ptr); //jump instructions
                }
                break;
            }
            case WASMOPCode.op_if: {
                const anchor = writer.at;
                writer.write_u32(0);
                blockPtrStack.push([]);
                writeInstrNodes(writer, instr.child, blockPtrStack, funcPtrArr);
                if (instr.hasElse) {
                    writer.write_u8(WASMOPCode.op_br);
                    const anchor2 = writer.at;
                    writer.write_u32(0);
                    writer.retroactive_write_u32(writer.at, anchor); //skip on fail
                    writeInstrNodes(writer, instr.child2, blockPtrStack, funcPtrArr);
                    writer.retroactive_write_u32(writer.at, anchor2); //skip fail clause on success
                } else {
                    writer.retroactive_write_u32(writer.at, anchor); //skip on fail
                }
                const toWrite = blockPtrStack.pop();
                if (toWrite == undefined) throw new Error("Empty blockPtrStack : impossible");
                for (const ptr of toWrite) {
                    writer.retroactive_write_u32(writer.at, ptr); //loop back
                }
                break;
            }
            case WASMOPCode.op_loop: {
                const anchor = writer.at;
                blockPtrStack.push([]);
                writeInstrNodes(writer, instr.child, blockPtrStack, funcPtrArr);
                const toWrite = blockPtrStack.pop();
                if (toWrite == undefined) throw new Error("Empty blockPtrStack : impossible");
                for (const ptr of toWrite) {
                    writer.retroactive_write_u32(anchor, ptr); //loop back
                }
                break;
            }
            case WASMOPCode.op_br_if:
            case WASMOPCode.op_br: {
                const depth : number = instr.immediates[0].u32;
                if (depth >= blockPtrStack.length) throw new Error("Branch depth OOB: " + depth);
                blockPtrStack[blockPtrStack.length - depth - 1].push(writer.at);
                writer.write_u32(0); //temporarily write 0
                break;
            }
            case WASMOPCode.op_br_table: {
                writer.write_u32(instr.immediates[0].u32); //number of non-defaults
                for (let i = 0; i < instr.immediates[0].u32 + 1; i++) {
                    const immediate = instr.immediates[i + 1];
                    const depth : number = immediate.u32;
                    if (depth >= blockPtrStack.length) 
                        throw new Error("Branch depth OOB: " + depth + " | " + blockPtrStack.length);
                    blockPtrStack[blockPtrStack.length - depth - 1].push(writer.at);
                    writer.write_u32(0); //temporarily write 0
                }
                break;
            }
            case WASMOPCode.op_call: {
                //funcidx
                //write down the funcptr once this all works
                writer.write_u32(instr.immediates[0].u32);
                break;
            }
            case WASMOPCode.op_call_indirect: {
                //functype, probably won't work
                writer.write_u32(instr.immediates[0].u32);
                break;
            }
            case WASMOPCode.op_memory_size: case WASMOPCode.op_memory_grow:
                writer.write_u8(instr.immediates[0].u32);
                break;
            case WASMOPCode.op_i32_load: case WASMOPCode.op_i32_load8_s: case WASMOPCode.op_i32_load8_u: case WASMOPCode.op_i32_load16_s: case WASMOPCode.op_i32_load16_u:
            case WASMOPCode.op_i64_load: case WASMOPCode.op_i64_load8_s: case WASMOPCode.op_i64_load8_u: case WASMOPCode.op_i64_load16_s: case WASMOPCode.op_i64_load16_u: case WASMOPCode.op_i64_load32_s: case WASMOPCode.op_i64_load32_u:
            case WASMOPCode.op_f32_load:
            case WASMOPCode.op_f64_load:
            case WASMOPCode.op_i32_store: case WASMOPCode.op_i32_store8: case WASMOPCode.op_i32_store16:
            case WASMOPCode.op_i64_store: case WASMOPCode.op_i64_store8: case WASMOPCode.op_i64_store16: case WASMOPCode.op_i64_store32:
            case WASMOPCode.op_f32_store:
            case WASMOPCode.op_f64_store:
                writer.write_u32(instr.immediates[0].u32);
                writer.write_u32(instr.immediates[1].u32);
                break;
            case WASMOPCode.op_i32_const:
            case WASMOPCode.op_i64_const:
            case WASMOPCode.op_f32_const:
            case WASMOPCode.op_f64_const:
                writeWASMValue(writer, instr.immediates[0]);
                break;
            case WASMOPCode.op_local_get: case WASMOPCode.op_local_set: case WASMOPCode.op_local_tee:
            case WASMOPCode.op_global_get: case WASMOPCode.op_global_set:
                writer.write_u32(instr.immediates[0].u32);
                break;
            default:
                break;
        }
    }
}

function convertToExecForm(repr : WASMRepr) : Program {
    console.log("Begin conversion");
    const writer = new FixedLengthWriter();
    const funcPtrs = new Uint32Array(repr.section10.content.length);
    if (repr.has_section(10)) {
        for (let i = 0; i < repr.section10.content.length; ++i) {
            const code = repr.section10.content[i];
            funcPtrs[i] = writer.at;
            //write [#args] [#locals] [code]
            const funcSig = repr.section1.content[repr.section3.content[i].index];
            writer.write_u32(funcSig.args.length);
            let localCount = 0;
            for (const localChunk of code.locals) localCount += localChunk.count;
            writer.write_u32(localCount);
            writeInstrNodes(writer, code.code, [], []);
            writer.write_u8(WASMOPCode.op_return); //force a return statement
        }
    }
    const program = new Program(writer.toBuffer(), funcPtrs);
    console.log("End conversion");
    return program;
}

export default function createProgramFromRepr(repr : WASMRepr) : Program {
    const program = convertToExecForm(repr);
    program.importFuncCount = repr.importFunc;
    program.importGlobalCount = repr.importGlobal;
    if (repr.has_section(1)) {
        //functypes
        program.funcTypes = repr.funcTypes.map(idx => repr.section1.content[idx]);
    }
    if (repr.has_section(4)) {
        //tables
        program.initializeTables(repr.section4.content);
    }
    if (repr.has_section(5)) {
        //memory
        let minPages = 0;
        let maxPages = 0;
        for (const memory of repr.section5.content) {
            minPages = memory.min;
            maxPages = Math.max(memory.max, memory.min);
        }
        program.initializeMemory(minPages, maxPages);
    }
    if (repr.has_section(6)) {
        //globals
        for (const glob of repr.section6.content) {
            program.globals.push(evalConstExpr(glob.expr));
        }
    }
    if (repr.has_section(8)) {
        //start
        program.start = repr.section8.index;
    }
    if (repr.has_section(9)) {
        //elems
        if (program.tables.length === 0)
            throw new Error("Expected a table initialization");
        for (const elem of repr.section9.content) {
            //using passive tables
            const offset = evalConstExpr(elem.offset).u32;
            if (offset + elem.funcrefs.length > program.tables[0].length)
                throw new Error("Out of Bounds element initialization");
            for (let i = 0; i < elem.funcrefs.length; ++i)
                program.tables[0].elements[i + offset] = elem.funcrefs[i];
        }
    }
    if (repr.has_section(11)) {
        //data
        for (const data of repr.section11.content) {
            const offset = evalConstExpr(data.offset).u32;
            if (offset + data.data.length > program.memory.length)
                throw new Error("Out of bounds data initialization");
            program.memory.buffer.set(data.data, offset);
        }
    }
    return program;
}