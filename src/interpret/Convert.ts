import WASMRepr from "../compile/Repr";

import { FixedLengthWriter } from "../helpers/Lexer";
import { InstrNode, WASMValue } from "../spec/Code";
import { WASMOPCode } from "../spec/OpCode";
import { WASMValueType } from "../spec/types";

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
        if (instr.instr === WASMOPCode.op_end) break;
        writer.write_instr(instr.instr);
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
            case WASMOPCode.op_memory_size: case WASMOPCode.op_memory_grow: case WASMOPCode.op_memory_copy:
                break;
            case WASMOPCode.op_i32_load: case WASMOPCode.op_i32_load8_s: case WASMOPCode.op_i32_load8_u: case WASMOPCode.op_i32_load16_s: case WASMOPCode.op_i32_load16_u:
            case WASMOPCode.op_i64_load: case WASMOPCode.op_i64_load8_s: case WASMOPCode.op_i64_load8_u: case WASMOPCode.op_i64_load16_s: case WASMOPCode.op_i64_load16_u: case WASMOPCode.op_i64_load32_s: case WASMOPCode.op_i64_load32_u:
            case WASMOPCode.op_f32_load:
            case WASMOPCode.op_f64_load:
            case WASMOPCode.op_i32_store: case WASMOPCode.op_i32_store8: case WASMOPCode.op_i32_store16:
            case WASMOPCode.op_i64_store: case WASMOPCode.op_i64_store8: case WASMOPCode.op_i64_store16: case WASMOPCode.op_i64_store32:
            case WASMOPCode.op_f32_store:
            case WASMOPCode.op_f64_store:
                //error did not write alignmeny at arg[0]
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

export function convertToExecForm(repr : WASMRepr) : Uint8Array {
    //console.log("Begin conversion");
    const writer = new FixedLengthWriter();
    for (let i = 0; i < repr.section10.content.length; ++i)
        writer.write_u32(0);
    if (repr.has_section(10)) {
        for (let i = 0; i < repr.section10.content.length; ++i) {
            const code = repr.section10.content[i];
            writer.retroactive_write_u32(writer.at, i * 4);
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
    //console.log("End conversion");
    return writer.toBuffer();
}
