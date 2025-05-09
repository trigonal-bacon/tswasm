"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createProgramFromRepr;
var Lexer_1 = require("../helpers/Lexer");
var OpCode_1 = require("../spec/OpCode");
var types_1 = require("../spec/types");
var Consteval_1 = require("./Consteval");
var Interpreter_1 = require("./Interpreter");
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
    var funcPtrs = new Uint32Array(repr.section10.content.length);
    if (repr.has_section(10)) {
        for (var i = 0; i < repr.section10.content.length; ++i) {
            var code = repr.section10.content[i];
            funcPtrs[i] = writer.at;
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
    var program = new Interpreter_1.Program(writer.toBuffer(), funcPtrs);
    console.log("End conversion");
    return program;
}
function createProgramFromRepr(repr) {
    var program = convertToExecForm(repr);
    program.importFuncCount = repr.importFunc;
    program.importGlobalCount = repr.importGlobal;
    if (repr.has_section(1)) {
        //functypes
        program.funcTypes = repr.funcTypes.map(function (idx) { return repr.section1.content[idx]; });
    }
    if (repr.has_section(4)) {
        //tables
        program.initializeTables(repr.section4.content);
    }
    if (repr.has_section(5)) {
        //memory
        var minPages = 0;
        var maxPages = 0;
        for (var _i = 0, _a = repr.section5.content; _i < _a.length; _i++) {
            var memory = _a[_i];
            minPages = memory.min;
            maxPages = Math.max(memory.max, memory.min);
        }
        program.initializeMemory(minPages, maxPages);
    }
    if (repr.has_section(6)) {
        //globals
        for (var _b = 0, _c = repr.section6.content; _b < _c.length; _b++) {
            var glob = _c[_b];
            program.globals.push((0, Consteval_1.default)(glob.expr));
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
        for (var _d = 0, _e = repr.section9.content; _d < _e.length; _d++) {
            var elem = _e[_d];
            //using passive tables
            var offset = (0, Consteval_1.default)(elem.offset).u32;
            if (offset + elem.funcrefs.length > program.tables[0].length)
                throw new Error("Out of Bounds element initialization");
            for (var i = 0; i < elem.funcrefs.length; ++i)
                program.tables[0].elements[i + offset] = elem.funcrefs[i];
        }
    }
    if (repr.has_section(11)) {
        //data
        for (var _f = 0, _g = repr.section11.content; _f < _g.length; _f++) {
            var data = _g[_f];
            var offset = (0, Consteval_1.default)(data.offset).u32;
            if (offset + data.data.length > program.memory.length)
                throw new Error("Out of bounds data initialization");
            program.memory.buffer.set(data.data, offset);
        }
    }
    return program;
}
