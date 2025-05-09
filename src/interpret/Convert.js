"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToExecForm = convertToExecForm;
var Lexer_1 = require("../helpers/Lexer");
var OpCode_1 = require("../spec/OpCode");
var types_1 = require("../spec/types");
function writeWASMValue(writer, value) {
    switch (value.type) {
        case types_1.WASMValueType.u32:
            writer.write_u32(value.u32);
            break;
        case types_1.WASMValueType.i32:
            writer.write_i32(value.i32);
            break;
        case types_1.WASMValueType.f32:
            writer.write_f32(value.f32);
            break;
        case types_1.WASMValueType.i64:
            writer.write_i64(value.i64);
            break;
        case types_1.WASMValueType.f64:
            writer.write_f64(value.f64);
            break;
        default:
            break;
    }
}
function writeInstrNodes(writer, instrs, blockPtrStack, funcPtrArr) {
    for (var _i = 0, instrs_1 = instrs; _i < instrs_1.length; _i++) {
        var instr = instrs_1[_i];
        writer.write_u8(instr.instr);
        switch (instr.instr) {
            case OpCode_1.WASMOPCode.op_block: {
                blockPtrStack.push([]);
                writeInstrNodes(writer, instr.child, blockPtrStack, funcPtrArr);
                var toWrite = blockPtrStack.pop();
                if (toWrite == undefined)
                    throw new Error("Empty blockPtrStack : impossible");
                for (var _a = 0, toWrite_1 = toWrite; _a < toWrite_1.length; _a++) {
                    var ptr = toWrite_1[_a];
                    writer.retroactive_write_u32(writer.at, ptr); //jump instructions
                }
                break;
            }
            case OpCode_1.WASMOPCode.op_if: {
                var anchor = writer.at;
                writer.write_u32(0);
                blockPtrStack.push([]);
                writeInstrNodes(writer, instr.child, blockPtrStack, funcPtrArr);
                if (instr.hasElse) {
                    writer.write_u8(OpCode_1.WASMOPCode.op_br);
                    var anchor2 = writer.at;
                    writer.write_u32(0);
                    writer.retroactive_write_u32(writer.at, anchor); //skip on fail
                    writeInstrNodes(writer, instr.child2, blockPtrStack, funcPtrArr);
                    writer.retroactive_write_u32(writer.at, anchor2); //skip fail clause on success
                }
                else {
                    writer.retroactive_write_u32(writer.at, anchor); //skip on fail
                }
                var toWrite = blockPtrStack.pop();
                if (toWrite == undefined)
                    throw new Error("Empty blockPtrStack : impossible");
                for (var _b = 0, toWrite_2 = toWrite; _b < toWrite_2.length; _b++) {
                    var ptr = toWrite_2[_b];
                    writer.retroactive_write_u32(writer.at, ptr); //loop back
                }
                break;
            }
            case OpCode_1.WASMOPCode.op_loop: {
                var anchor = writer.at;
                blockPtrStack.push([]);
                writeInstrNodes(writer, instr.child, blockPtrStack, funcPtrArr);
                var toWrite = blockPtrStack.pop();
                if (toWrite == undefined)
                    throw new Error("Empty blockPtrStack : impossible");
                for (var _c = 0, toWrite_3 = toWrite; _c < toWrite_3.length; _c++) {
                    var ptr = toWrite_3[_c];
                    writer.retroactive_write_u32(anchor, ptr); //loop back
                }
                break;
            }
            case OpCode_1.WASMOPCode.op_br_if:
            case OpCode_1.WASMOPCode.op_br: {
                var depth = instr.immediates[0].u32;
                if (depth >= blockPtrStack.length)
                    throw new Error("Branch depth OOB: " + depth);
                blockPtrStack[blockPtrStack.length - depth - 1].push(writer.at);
                writer.write_u32(0); //temporarily write 0
                break;
            }
            case OpCode_1.WASMOPCode.op_br_table: {
                writer.write_u32(instr.immediates[0].u32); //number of non-defaults
                for (var i = 0; i < instr.immediates[0].u32 + 1; i++) {
                    var immediate = instr.immediates[i + 1];
                    var depth = immediate.u32;
                    if (depth >= blockPtrStack.length)
                        throw new Error("Branch depth OOB: " + depth + " | " + blockPtrStack.length);
                    blockPtrStack[blockPtrStack.length - depth - 1].push(writer.at);
                    writer.write_u32(0); //temporarily write 0
                }
                break;
            }
            case OpCode_1.WASMOPCode.op_call: {
                //funcidx
                //write down the funcptr once this all works
                writer.write_u32(instr.immediates[0].u32);
                break;
            }
            case OpCode_1.WASMOPCode.op_call_indirect: {
                //functype, probably won't work
                writer.write_u32(instr.immediates[0].u32);
                break;
            }
            case OpCode_1.WASMOPCode.op_memory_size:
            case OpCode_1.WASMOPCode.op_memory_grow:
                writer.write_u8(instr.immediates[0].u32);
                break;
            case OpCode_1.WASMOPCode.op_i32_load:
            case OpCode_1.WASMOPCode.op_i32_load8_s:
            case OpCode_1.WASMOPCode.op_i32_load8_u:
            case OpCode_1.WASMOPCode.op_i32_load16_s:
            case OpCode_1.WASMOPCode.op_i32_load16_u:
            case OpCode_1.WASMOPCode.op_i64_load:
            case OpCode_1.WASMOPCode.op_i64_load8_s:
            case OpCode_1.WASMOPCode.op_i64_load8_u:
            case OpCode_1.WASMOPCode.op_i64_load16_s:
            case OpCode_1.WASMOPCode.op_i64_load16_u:
            case OpCode_1.WASMOPCode.op_i64_load32_s:
            case OpCode_1.WASMOPCode.op_i64_load32_u:
            case OpCode_1.WASMOPCode.op_f32_load:
            case OpCode_1.WASMOPCode.op_f64_load:
            case OpCode_1.WASMOPCode.op_i32_store:
            case OpCode_1.WASMOPCode.op_i32_store8:
            case OpCode_1.WASMOPCode.op_i32_store16:
            case OpCode_1.WASMOPCode.op_i64_store:
            case OpCode_1.WASMOPCode.op_i64_store8:
            case OpCode_1.WASMOPCode.op_i64_store16:
            case OpCode_1.WASMOPCode.op_i64_store32:
            case OpCode_1.WASMOPCode.op_f32_store:
            case OpCode_1.WASMOPCode.op_f64_store:
                writer.write_u32(instr.immediates[0].u32);
                writer.write_u32(instr.immediates[1].u32);
                break;
            case OpCode_1.WASMOPCode.op_i32_const:
            case OpCode_1.WASMOPCode.op_i64_const:
            case OpCode_1.WASMOPCode.op_f32_const:
            case OpCode_1.WASMOPCode.op_f64_const:
                writeWASMValue(writer, instr.immediates[0]);
                break;
            case OpCode_1.WASMOPCode.op_local_get:
            case OpCode_1.WASMOPCode.op_local_set:
            case OpCode_1.WASMOPCode.op_local_tee:
            case OpCode_1.WASMOPCode.op_global_get:
            case OpCode_1.WASMOPCode.op_global_set:
                writer.write_u32(instr.immediates[0].u32);
                break;
            default:
                break;
        }
    }
}
function convertToExecForm(repr) {
    console.log("Begin conversion");
    var writer = new Lexer_1.FixedLengthWriter();
    for (var i = 0; i < repr.section10.content.length; ++i)
        writer.write_u32(0);
    if (repr.has_section(10)) {
        for (var i = 0; i < repr.section10.content.length; ++i) {
            var code = repr.section10.content[i];
            writer.retroactive_write_u32(writer.at, i * 4);
            //write [#args] [#locals] [code]
            var funcSig = repr.section1.content[repr.section3.content[i].index];
            writer.write_u32(funcSig.args.length);
            var localCount = 0;
            for (var _i = 0, _a = code.locals; _i < _a.length; _i++) {
                var localChunk = _a[_i];
                localCount += localChunk.count;
            }
            writer.write_u32(localCount);
            writeInstrNodes(writer, code.code, [], []);
            writer.write_u8(OpCode_1.WASMOPCode.op_return); //force a return statement
        }
    }
    console.log("End conversion");
    return writer.toBuffer();
}
