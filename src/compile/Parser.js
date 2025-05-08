"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Lexer_1 = require("../helpers/Lexer");
var Code_1 = require("../spec/Code");
var OpCode_1 = require("../spec/OpCode");
var sections_1 = require("../spec/sections");
var types_1 = require("../spec/types");
var WASMRepr = /** @class */ (function () {
    function WASMRepr(bin) {
        this.funcTypes = [];
        this.globalTypes = [];
        this.importFunc = 0;
        this.importGlobal = 0;
        this.section1 = new sections_1.WASMSection();
        this.section2 = new sections_1.WASMSection();
        this.section3 = new sections_1.WASMSection();
        this.section4 = new sections_1.WASMSection();
        this.section5 = new sections_1.WASMSection();
        this.section7 = new sections_1.WASMSection();
        this.section8 = new sections_1.WASMSection8Content();
        this.section10 = new sections_1.WASMSection();
        this.section11 = new sections_1.WASMSection();
        this.section12 = new sections_1.WASMSection12Content();
        this.sections = new Array(13).fill(false);
        this.bin = bin;
        this.lexer = new Lexer_1.Reader(bin);
        this.parse();
    }
    WASMRepr.prototype.parse = function () {
        var lexer = this.lexer;
        lexer.read_float64(); //magic header
        while (lexer.has()) {
            var section = lexer.read_uint8();
            console.log("Parsing section " + section);
            if (section > 12)
                break; //error
            if (this.sections[section]) {
                console.log("Section already exists"); //error
            }
            this.sections[section] = true;
            switch (section) {
                case 1:
                    this.parseSection1();
                    break;
                case 2:
                    this.parseSection2();
                    break;
                case 3:
                    this.parseSection3();
                    break;
                case 4:
                    this.parseSection4();
                    break;
                case 5:
                    this.parseSection5();
                    break;
                case 6:
                    this.parseSection6();
                    break;
                case 7:
                    this.parseSection7();
                    break;
                case 8:
                    this.parseSection8();
                    break;
                case 9:
                    this.parseSection9();
                    break;
                case 10:
                    this.parseSection10();
                    break;
                case 11:
                    this.parseSection11();
                    break;
                case 12:
                    this.parseSection12();
                    break;
                default: break;
            }
        }
        console.log("Parse finished");
    };
    WASMRepr.prototype.parseSection1 = function () {
        var lexer = this.lexer;
        this.section1.byteLen = lexer.read_uint32();
        var sectionLen = lexer.read_uint32();
        for (var i = 0; i < sectionLen; ++i) {
            var content = new sections_1.WASMFuncType();
            if (lexer.read_uint8() != 0x60)
                break; //error?
            var paramLen = lexer.read_uint32();
            for (var j = 0; j < paramLen; ++j) {
                var valtype = lexer.read_uint8();
                //error need to validate
                content.args.push(valtype);
            }
            var retLen = lexer.read_uint32();
            if (retLen === 0)
                content.ret = types_1.WASMValueType.nil;
            else if (retLen === 1) {
                var valtype = lexer.read_uint8();
                //error need to validate
                content.ret = valtype;
            }
            else {
                //console.log("Error more than 1 retval");
                //error more than 1 retval
            }
            this.section1.content.push(content);
        }
    };
    WASMRepr.prototype.parseSection2 = function () {
        var lexer = this.lexer;
        this.section2.byteLen = lexer.read_uint32();
        var sectionLen = lexer.read_uint32();
        for (var i = 0; i < sectionLen; ++i) {
            var content = new sections_1.WASMSection2Content();
            content.module = lexer.read_string();
            content.name = lexer.read_string();
            var kind = content.kind = lexer.read_uint8();
            switch (kind) {
                case types_1.WASMDeclType.func:
                    ++this.importFunc;
                    content.index = lexer.read_uint32();
                    //error on bad index
                    this.funcTypes.push(content.index); //index to the functypes
                    break;
                case types_1.WASMDeclType.global:
                    ++this.importGlobal;
                case types_1.WASMDeclType.table:
                case types_1.WASMDeclType.mem: {
                    //error;
                    content.type = lexer.read_uint8();
                    this.globalTypes.push(content.type);
                    break;
                }
                default:
                    break; //error
            }
            this.section2.content.push(content);
        }
    };
    WASMRepr.prototype.parseSection3 = function () {
        var lexer = this.lexer;
        this.section3.byteLen = lexer.read_uint32();
        var sectionLen = lexer.read_uint32();
        for (var i = 0; i < sectionLen; ++i) {
            var content = new sections_1.WASMSection3Content();
            content.index = lexer.read_uint32();
            this.funcTypes.push(content.index);
            this.section3.content.push(content);
        }
    };
    WASMRepr.prototype.parseSection4 = function () {
        var lexer = this.lexer;
        this.section4.byteLen = lexer.read_uint32();
        var sectionLen = lexer.read_uint32();
        for (var i = 0; i < sectionLen; ++i) {
            var content = new sections_1.WASMSection4Content();
            var kind = lexer.read_uint8();
            //error need to validate
            content.refKind = kind;
            var hasMax = lexer.read_uint8();
            content.limit.hasMax = hasMax !== 0;
            if (hasMax) {
                content.limit.min = lexer.read_uint32();
                content.limit.max = lexer.read_uint32();
            }
            else {
                content.limit.min = content.limit.max = lexer.read_uint32();
            }
        }
    };
    WASMRepr.prototype.parseSection5 = function () {
        var lexer = this.lexer;
        this.section5.byteLen = lexer.read_uint32();
        var sectionLen = lexer.read_uint32();
        for (var i = 0; i < sectionLen; ++i) {
            var content = new sections_1.WASMLimit();
            var hasMax = lexer.read_uint8();
            content.hasMax = hasMax !== 0;
            if (hasMax) {
                content.min = lexer.read_uint32();
                content.max = lexer.read_uint32();
            }
            else {
                content.min = content.max = lexer.read_uint32();
            }
        }
    };
    WASMRepr.prototype.parseSection6 = function () {
        var len = this.lexer.read_uint32();
        this.lexer.at += len; //error skip
    };
    WASMRepr.prototype.parseSection7 = function () {
        var lexer = this.lexer;
        this.section7.byteLen = lexer.read_uint32();
        var sectionLen = lexer.read_uint32();
        for (var i = 0; i < sectionLen; ++i) {
            var content = new sections_1.WASMSection7Content();
            content.name = lexer.read_string();
            var kind = lexer.read_uint8();
            //error need to validate
            content.kind = kind;
            content.index = lexer.read_uint32();
            this.section7.content.push(content);
        }
    };
    WASMRepr.prototype.parseSection8 = function () {
        var lexer = this.lexer;
        this.section8.byteLen = lexer.read_uint32();
        this.section8.index = lexer.read_uint32();
    };
    WASMRepr.prototype.parseSection9 = function () {
        var len = this.lexer.read_uint32();
        this.lexer.at += len; //error skip
    };
    WASMRepr.prototype.parseSection10 = function () {
        var lexer = this.lexer;
        this.section10.byteLen = lexer.read_uint32();
        var sectionLen = lexer.read_uint32();
        for (var i = 0; i < sectionLen; ++i) {
            var section = new sections_1.WASMSection10Content();
            section.byteLen = lexer.read_uint32();
            var localChunks = lexer.read_uint32();
            for (var j = 0; j < localChunks; ++j) {
                var count = lexer.read_uint32();
                var type = lexer.read_uint8();
                //error validate
                var en = new sections_1.WASMLocalEnum();
                en.count = count;
                en.type = type;
                section.locals.push(en);
            }
            section.code = this.parseCodeBlock();
            this.section10.content.push(section);
        }
    };
    WASMRepr.prototype.parseSection11 = function () {
        var lexer = this.lexer;
        this.section11.byteLen = lexer.read_uint32();
        var sectionLen = lexer.read_uint32();
        for (var i = 0; i < sectionLen; ++i) {
            var content = new sections_1.WASMSection11Content();
            var kind = lexer.read_uint8();
            content.kind = kind;
            switch (kind) {
                case 2:
                    content.memidx = lexer.read_uint32();
                case 0: {
                    var instrArr = this.parseCodeBlock();
                    if (instrArr.length !== 0) {
                        //error;
                    }
                    content.offset = instrArr[0];
                }
                case 1:
                    break;
                default:
                    break; //error
            }
            var len = lexer.read_uint32();
            content.data = this.bin.slice(lexer.at, lexer.at += len);
            this.section11.content.push(content);
        }
    };
    WASMRepr.prototype.parseSection12 = function () {
        var lexer = this.lexer;
        this.section12.byteLen = lexer.read_uint32();
        this.section12.dataCount = lexer.read_uint32();
    };
    WASMRepr.prototype.parseCodeBlock = function () {
        //console.log(this.recursionDepth, this.lexer.at);
        var lexer = this.lexer;
        var instrArray = [];
        while (true) {
            var instr_op = lexer.read_uint8();
            if (instr_op === OpCode_1.WASMOPCode.op_end || instr_op === OpCode_1.WASMOPCode.op_else)
                break;
            var currInstr = new Code_1.InstrNode();
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
                    if (lexer.read_uint8() != 0x00) {
                        //error typeuse not supported
                    }
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
                    //error on invalid opcodes
                    break;
            }
        }
        return instrArray;
    };
    return WASMRepr;
}());
exports.default = WASMRepr;
