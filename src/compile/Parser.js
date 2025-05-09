"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Lexer_1 = require("../helpers/Lexer");
var Code_1 = require("../spec/Code");
var OpCode_1 = require("../spec/OpCode");
var sections_1 = require("../spec/sections");
var types_1 = require("../spec/types");
function readLimit(lexer) {
    var limit = new sections_1.WASMLimit();
    var hasMax = lexer.read_uint8();
    limit.hasMax = hasMax !== 0;
    if (hasMax) {
        limit.min = lexer.read_uint32();
        limit.max = lexer.read_uint32();
        if (limit.min > limit.max)
            throw new Error("Limit min ".concat(limit.min, " greater than max ").concat(limit.max));
    }
    else {
        limit.min = limit.max = lexer.read_uint32();
    }
    return limit;
}
function readValueType(lexer) {
    var t = lexer.read_uint8();
    switch (t) {
        case types_1.WASMValueType.i32:
        case types_1.WASMValueType.f32:
        case types_1.WASMValueType.i64:
        case types_1.WASMValueType.f64:
        case types_1.WASMValueType.nil:
            return t;
    }
    throw new Error("Invalid value type ".concat(t));
}
function readRefType(lexer) {
    var t = lexer.read_uint8();
    switch (t) {
        case types_1.WASMRefType.funcref:
        case types_1.WASMRefType.externref:
            return t;
    }
    throw new Error("Invalid ref type ".concat(t));
}
var WASMParser = /** @class */ (function () {
    function WASMParser(bin) {
        this.bin = bin;
        this.lexer = new Lexer_1.Reader(bin);
    }
    WASMParser.prototype.parse = function (repr) {
        var lexer = this.lexer;
        lexer.read_float64(); //magic header
        while (lexer.has()) {
            var section = lexer.read_uint8();
            console.log("Parsing section " + section);
            if (section > 12)
                throw new Error("Trying to parse invalid section ".concat(section));
            if (repr.has_section(section)) {
                throw new Error("Section ".concat(section, " already exists"));
            }
            repr.sectionLengths[section] = lexer.read_uint32();
            var anchor = lexer.at;
            switch (section) {
                case 0:
                    this.parseSection0(repr);
                    break;
                case 1:
                    this.parseSection1(repr);
                    break;
                case 2:
                    this.parseSection2(repr);
                    break;
                case 3:
                    this.parseSection3(repr);
                    break;
                case 4:
                    this.parseSection4(repr);
                    break;
                case 5:
                    this.parseSection5(repr);
                    break;
                case 6:
                    this.parseSection6(repr);
                    break;
                case 7:
                    this.parseSection7(repr);
                    break;
                case 8:
                    this.parseSection8(repr);
                    break;
                case 9:
                    this.parseSection9(repr);
                    break;
                case 10:
                    this.parseSection10(repr);
                    break;
                case 11:
                    this.parseSection11(repr);
                    break;
                case 12:
                    this.parseSection12(repr);
                    break;
                default: break;
            }
            if (lexer.at !== anchor + repr.sectionLengths[section]) {
                console.log(lexer.at);
                throw new Error("Section ".concat(section, " has malformed length ").concat(repr.sectionLengths[section]));
            }
        }
        if (lexer.at !== lexer.buf.length)
            throw new Error("Prematurely finished parsing the binary");
        console.log("Parse finished");
        repr.validate();
        return;
    };
    WASMParser.prototype.parseSection0 = function (repr) {
        //skip it
        this.lexer.at += repr.sectionLengths[0];
    };
    WASMParser.prototype.parseSection1 = function (repr) {
        var lexer = this.lexer;
        var sectionLen = lexer.read_uint32();
        for (var i = 0; i < sectionLen; ++i) {
            var content = new sections_1.WASMFuncType();
            var validate = lexer.read_uint8();
            if (validate !== 0x60)
                throw new Error("Expected 0x60 for functype, got ".concat(validate));
            var paramLen = lexer.read_uint32();
            for (var j = 0; j < paramLen; ++j) {
                var valtype = readValueType(lexer);
                content.args.push(valtype);
            }
            var retLen = lexer.read_uint32();
            if (retLen === 0)
                content.ret = types_1.WASMValueType.nil;
            else if (retLen === 1)
                content.ret = readValueType(lexer);
            else
                throw new Error("Multireturn currently not supported");
            repr.section1.content.push(content);
        }
    };
    WASMParser.prototype.parseSection2 = function (repr) {
        var lexer = this.lexer;
        var sectionLen = lexer.read_uint32();
        for (var i = 0; i < sectionLen; ++i) {
            var content = new sections_1.WASMSection2Content();
            content.module = lexer.read_string();
            content.name = lexer.read_string();
            var kind = content.kind = lexer.read_uint8();
            switch (kind) {
                case types_1.WASMDeclType.func:
                    content.index = lexer.read_uint32();
                    repr.funcTypes.push(content.index);
                    ++repr.importFunc;
                    break;
                case types_1.WASMDeclType.global: {
                    var globType = new types_1.WASMGlobalType();
                    globType.type = readValueType(lexer);
                    globType.mutable = (lexer.read_uint8() !== 0);
                    content.type = globType.type;
                    repr.globalTypes.push(globType);
                    ++repr.importGlobal;
                    break;
                }
                case types_1.WASMDeclType.table: {
                    content.type = lexer.read_uint8();
                    content.limits = readLimit(lexer);
                    ++repr.tableCount;
                    break;
                }
                case types_1.WASMDeclType.mem: {
                    content.limits = readLimit(lexer);
                    ++repr.memoryCount;
                    break;
                }
                default:
                    throw new Error("Invalid import type");
            }
            repr.section2.content.push(content);
        }
    };
    WASMParser.prototype.parseSection3 = function (repr) {
        var lexer = this.lexer;
        var sectionLen = lexer.read_uint32();
        for (var i = 0; i < sectionLen; ++i) {
            var content = new sections_1.WASMSection3Content();
            content.index = lexer.read_uint32();
            repr.funcTypes.push(content.index);
            repr.section3.content.push(content);
        }
    };
    WASMParser.prototype.parseSection4 = function (repr) {
        var lexer = this.lexer;
        var sectionLen = lexer.read_uint32();
        for (var i = 0; i < sectionLen; ++i) {
            var content = new sections_1.WASMSection4Content();
            var kind = readRefType(lexer);
            content.refKind = kind;
            content.limit = readLimit(lexer);
        }
        repr.tableCount += sectionLen;
    };
    WASMParser.prototype.parseSection5 = function (repr) {
        var lexer = this.lexer;
        var sectionLen = lexer.read_uint32();
        for (var i = 0; i < sectionLen; ++i) {
            var content = readLimit(lexer);
            repr.section5.content.push(content);
        }
        repr.memoryCount += sectionLen;
    };
    WASMParser.prototype.parseSection6 = function (repr) {
        var lexer = this.lexer;
        var sectionLen = lexer.read_uint32();
        for (var i = 0; i < sectionLen; ++i) {
            var content = new sections_1.WASMSection6Content();
            var type = lexer.read_uint8();
            content.type.mutable = (lexer.read_uint8() !== 0);
            content.type.type = type;
            repr.globalTypes.push(content.type);
            content.expr = this.parseCodeBlock();
            repr.section6.content.push(content);
        }
    };
    WASMParser.prototype.parseSection7 = function (repr) {
        var lexer = this.lexer;
        var sectionLen = lexer.read_uint32();
        for (var i = 0; i < sectionLen; ++i) {
            var content = new sections_1.WASMSection7Content();
            content.name = lexer.read_string();
            var kind = lexer.read_uint8();
            if (kind >= 4)
                throw new Error("Invalid export type ".concat(kind));
            content.kind = kind;
            content.index = lexer.read_uint32();
            repr.section7.content.push(content);
        }
    };
    WASMParser.prototype.parseSection8 = function (repr) {
        var lexer = this.lexer;
        repr.section8.index = lexer.read_uint32();
    };
    WASMParser.prototype.parseSection9 = function (repr) {
        var lexer = this.lexer;
        var sectionLen = lexer.read_uint32();
        for (var i = 0; i < sectionLen; ++i) {
            var content = new sections_1.WASMSection9Content();
            content.kind = lexer.read_uint32();
            content.offset = this.parseCodeBlock();
            var numRefs = lexer.read_uint32();
            for (var j = 0; j < numRefs; ++j)
                content.funcrefs.push(lexer.read_uint32());
            repr.section9.content.push(content);
        }
    };
    WASMParser.prototype.parseSection10 = function (repr) {
        var lexer = this.lexer;
        var sectionLen = lexer.read_uint32();
        for (var i = 0; i < sectionLen; ++i) {
            var section = new sections_1.WASMSection10Content();
            section.byteLen = lexer.read_uint32();
            var localChunks = lexer.read_uint32();
            for (var j = 0; j < localChunks; ++j) {
                var count = lexer.read_uint32();
                var type = readValueType(lexer);
                var en = new sections_1.WASMLocalEnum();
                en.count = count;
                en.type = type;
                section.locals.push(en);
            }
            section.code = this.parseCodeBlock();
            repr.section10.content.push(section);
        }
    };
    WASMParser.prototype.parseSection11 = function (repr) {
        var lexer = this.lexer;
        var sectionLen = lexer.read_uint32();
        for (var i = 0; i < sectionLen; ++i) {
            var content = new sections_1.WASMSection11Content();
            var kind = lexer.read_uint8();
            content.kind = kind;
            switch (kind) {
                case 2:
                    content.memidx = lexer.read_uint32();
                case 0: {
                    content.offset = this.parseCodeBlock();
                }
                case 1:
                    break;
                default:
                    throw new Error("Invalid data flag ".concat(kind));
            }
            var len = lexer.read_uint32();
            content.data = this.bin.slice(lexer.at, lexer.at += len);
            repr.section11.content.push(content);
        }
    };
    WASMParser.prototype.parseSection12 = function (repr) {
        var lexer = this.lexer;
        repr.section12.dataCount = lexer.read_uint32();
    };
    WASMParser.prototype.parseCodeBlock = function () {
        //console.log(this.recursionDepth, this.lexer.at);
        var lexer = this.lexer;
        var instrArray = [];
        while (true) {
            var instr_op = lexer.read_uint8();
            if (instr_op === OpCode_1.WASMOPCode.op_end || instr_op === OpCode_1.WASMOPCode.op_else)
                break;
            var currInstr = new Code_1.InstrNode();
            instrArray.push(currInstr);
            currInstr.instr = instr_op;
            switch (instr_op) {
                case OpCode_1.WASMOPCode.op_block:
                case OpCode_1.WASMOPCode.op_loop:
                case OpCode_1.WASMOPCode.op_if: {
                    var result_type = lexer.read_uint8();
                    currInstr.immediates.push(Code_1.WASMValue.createU32Literal(result_type));
                    currInstr.child = this.parseCodeBlock();
                    lexer.back();
                    if (lexer.read_uint8() === OpCode_1.WASMOPCode.op_else) {
                        currInstr.hasElse = true;
                        currInstr.child2 = this.parseCodeBlock();
                    }
                    break;
                }
                case OpCode_1.WASMOPCode.op_call: {
                    var index = lexer.read_uint32();
                    currInstr.immediates.push(Code_1.WASMValue.createU32Literal(index));
                    break;
                }
                case OpCode_1.WASMOPCode.op_call_indirect: {
                    var index = lexer.read_uint32();
                    currInstr.immediates.push(Code_1.WASMValue.createU32Literal(index));
                    if (lexer.read_uint8() != 0x00)
                        throw new Error("call_indirect typeuse not supported");
                    break;
                }
                case OpCode_1.WASMOPCode.op_br_table: {
                    var indCount = lexer.read_uint32();
                    currInstr.immediates.push(Code_1.WASMValue.createU32Literal(indCount));
                    for (var i = 0; i < indCount; ++i)
                        currInstr.immediates.push(Code_1.WASMValue.createU32Literal(lexer.read_uint32()));
                    var label = lexer.read_uint32();
                    currInstr.immediates.push(Code_1.WASMValue.createU32Literal(label));
                    break;
                }
                case OpCode_1.WASMOPCode.op_memory_size:
                case OpCode_1.WASMOPCode.op_memory_grow:
                    currInstr.immediates.push(Code_1.WASMValue.createU32Literal(lexer.read_uint8()));
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
                    currInstr.immediates.push(Code_1.WASMValue.createU32Literal(lexer.read_uint32()));
                    currInstr.immediates.push(Code_1.WASMValue.createU32Literal(lexer.read_uint32()));
                    break;
                case OpCode_1.WASMOPCode.op_i32_const:
                    currInstr.immediates.push(Code_1.WASMValue.createI32Literal(lexer.read_int32()));
                    break;
                case OpCode_1.WASMOPCode.op_i64_const:
                    currInstr.immediates.push(Code_1.WASMValue.createI64Literal(lexer.read_int64()));
                    break;
                case OpCode_1.WASMOPCode.op_f32_const:
                    currInstr.immediates.push(Code_1.WASMValue.createF32Literal(lexer.read_float32()));
                    break;
                case OpCode_1.WASMOPCode.op_f64_const:
                    currInstr.immediates.push(Code_1.WASMValue.createF64Literal(lexer.read_float64()));
                    break;
                case OpCode_1.WASMOPCode.op_br:
                case OpCode_1.WASMOPCode.op_br_if:
                case OpCode_1.WASMOPCode.op_local_get:
                case OpCode_1.WASMOPCode.op_local_set:
                case OpCode_1.WASMOPCode.op_local_tee:
                case OpCode_1.WASMOPCode.op_global_get:
                case OpCode_1.WASMOPCode.op_global_set:
                    currInstr.immediates.push(Code_1.WASMValue.createU32Literal(lexer.read_uint32()));
                    break;
                default:
                    if (!(instr_op in OpCode_1.WASMOPDefs))
                        throw new Error("Invalid opcode ".concat(instr_op));
                    break;
            }
        }
        return instrArray;
    };
    return WASMParser;
}());
exports.default = WASMParser;
