import { Reader } from "../helpers/Lexer";
import { InstrNode, WASMValue } from "../spec/Code";
import { WASMOPCode } from "../spec/OpCode";
import { 
    WASMSection, WASMFuncType,
    WASMLimit, WASMLocalEnum,
    WASMSection2Content,
    WASMSection3Content,
    WASMSection4Content,
    WASMSection7Content,
    WASMSection8Content,
    WASMSection10Content,
    WASMSection11Content,
    WASMSection12Content, 
} from "../spec/sections";
import { WASMValueType, WASMDeclType } from "../spec/types";

export default class WASMRepr {
    bin : Uint8Array;
    lexer : Reader;
    funcTypes : Array<Number> = [];
    globalTypes : Array<WASMValueType> = [];
    importFunc : number = 0;
    importGlobal : number = 0;
    section1 : WASMSection<WASMFuncType> = new WASMSection();
    section2 : WASMSection<WASMSection2Content> = new WASMSection();
    section3 : WASMSection<WASMSection3Content> = new WASMSection();
    section4 : WASMSection<WASMSection4Content> = new WASMSection();
    section5 : WASMSection<WASMLimit> = new WASMSection();
    section7 : WASMSection<WASMSection7Content> = new WASMSection();
    section8 : WASMSection8Content = new WASMSection8Content();
    section10 : WASMSection<WASMSection10Content> = new WASMSection();
    section11 : WASMSection<WASMSection11Content> = new WASMSection();
    section12 : WASMSection12Content = new WASMSection12Content();
    sections : Array<boolean> = new Array(13).fill(false);
    constructor(bin : Uint8Array) {
        this.bin = bin;
        this.lexer = new Reader(bin);
        this.parse();
    }
    parse() : void {
        const lexer = this.lexer;
        lexer.read_float64(); //magic header
        while (lexer.has()) {
            const section = lexer.read_uint8();
            console.log("Parsing section " + section);
            if (section > 12) break; //error
            if (this.sections[section]) {
                console.log("Section already exists"); //error
            }
            this.sections[section] = true;
            switch (section) {
                case 1: this.parseSection1(); break;
                case 2: this.parseSection2(); break;
                case 3: this.parseSection3(); break;
                case 4: this.parseSection4(); break;
                case 5: this.parseSection5(); break;
                case 6: this.parseSection6(); break;
                case 7: this.parseSection7(); break;
                case 8: this.parseSection8(); break;
                case 9: this.parseSection9(); break;
                case 10: this.parseSection10(); break;
                case 11: this.parseSection11(); break;
                case 12: this.parseSection12(); break;
                default: break;
            }
        }
        console.log("Parse finished");
    }

    parseSection1() : void {
        const lexer = this.lexer;
        this.section1.byteLen = lexer.read_uint32();
        const sectionLen = lexer.read_uint32();
        for (let i = 0; i < sectionLen; ++i) {
            const content = new WASMFuncType();
            if (lexer.read_uint8() != 0x60) break; //error?
            const paramLen = lexer.read_uint32();
            for (let j = 0; j < paramLen; ++j) {
                const valtype = lexer.read_uint8();
                //error need to validate
                content.args.push(valtype);
            }
            const retLen = lexer.read_uint32();
            if (retLen === 0) content.ret = WASMValueType.nil;
            else if (retLen === 1) {
                const valtype = lexer.read_uint8();
                //error need to validate
                content.ret = valtype;
            }
            else {
                //console.log("Error more than 1 retval");
                //error more than 1 retval
            }
            this.section1.content.push(content);
        }
    }

    parseSection2() : void {
        const lexer = this.lexer;
        this.section2.byteLen = lexer.read_uint32();
        const sectionLen = lexer.read_uint32();
        for (let i = 0; i < sectionLen; ++i) {
            const content = new WASMSection2Content();
            content.module = lexer.read_string();
            content.name = lexer.read_string();
            const kind = content.kind = lexer.read_uint8();
            switch (kind) {
                case WASMDeclType.func:
                    ++this.importFunc;
                    content.index = lexer.read_uint32();
                    //error on bad index
                    this.funcTypes.push(content.index); //index to the functypes
                    break;
                case WASMDeclType.global:
                    ++this.importGlobal;
                case WASMDeclType.table:
                case WASMDeclType.mem: {
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
    }

    parseSection3() : void {
        const lexer = this.lexer;
        this.section3.byteLen = lexer.read_uint32();
        const sectionLen = lexer.read_uint32();
        for (let i = 0; i < sectionLen; ++i) {
            const content = new WASMSection3Content();
            content.index = lexer.read_uint32();
            this.funcTypes.push(content.index);
            this.section3.content.push(content);
        }
    }

    parseSection4() : void {
        const lexer = this.lexer;
        this.section4.byteLen = lexer.read_uint32();
        const sectionLen = lexer.read_uint32();
        for (let i = 0; i < sectionLen; ++i) {
            const content = new WASMSection4Content();
            const kind = lexer.read_uint8();
            //error need to validate
            content.refKind = kind;
            const hasMax = lexer.read_uint8();
            content.limit.hasMax = hasMax !== 0;
            if (hasMax) {
                content.limit.min = lexer.read_uint32();
                content.limit.max = lexer.read_uint32();
            }
            else {
                content.limit.min = content.limit.max = lexer.read_uint32();
            }
        }
    }

    parseSection5() : void {
        const lexer = this.lexer;
        this.section5.byteLen = lexer.read_uint32();
        const sectionLen = lexer.read_uint32();
        for (let i = 0; i < sectionLen; ++i) {
            const content = new WASMLimit();
            const hasMax = lexer.read_uint8();
            content.hasMax = hasMax !== 0;
            if (hasMax) {
                content.min = lexer.read_uint32();
                content.max = lexer.read_uint32();
            }
            else {
                content.min = content.max = lexer.read_uint32();
            }
        }
    }

    parseSection6() : void {
        const len = this.lexer.read_uint32();
        this.lexer.at += len; //error skip
    }

    parseSection7() : void {
        const lexer = this.lexer;
        this.section7.byteLen = lexer.read_uint32();
        const sectionLen = lexer.read_uint32();
        for (let i = 0; i < sectionLen; ++i) {
            const content = new WASMSection7Content();
            content.name = lexer.read_string();
            const kind = lexer.read_uint8();
            //error need to validate
            content.kind = kind;
            content.index = lexer.read_uint32();
            this.section7.content.push(content);
        }
    }

    parseSection8() : void {
        const lexer = this.lexer;
        this.section8.byteLen = lexer.read_uint32();
        this.section8.index = lexer.read_uint32();
    }

    parseSection9() : void {
        const len = this.lexer.read_uint32();
        this.lexer.at += len; //error skip
    }

    parseSection10() : void {
        const lexer = this.lexer;
        this.section10.byteLen = lexer.read_uint32();
        const sectionLen = lexer.read_uint32();
        for (let i = 0; i < sectionLen; ++i) {
            const section = new WASMSection10Content();
            section.byteLen = lexer.read_uint32();
            const localChunks = lexer.read_uint32();
            for (let j = 0; j < localChunks; ++j) {
                const count = lexer.read_uint32();
                const type = lexer.read_uint8();
                //error validate
                const en = new WASMLocalEnum();
                en.count = count;
                en.type = type;
                section.locals.push(en);
            }
            section.code = this.parseCodeBlock();
            this.section10.content.push(section);
        } 
    }

    parseSection11() : void {
        const lexer = this.lexer;
        this.section11.byteLen = lexer.read_uint32();
        const sectionLen = lexer.read_uint32();
        for (let i = 0; i < sectionLen; ++i) {
            const content = new WASMSection11Content();
            const kind = lexer.read_uint8();
            content.kind = kind;
            switch (kind) {
                case 2:
                    content.memidx = lexer.read_uint32();
                case 0: {
                    const instrArr = this.parseCodeBlock();
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
            const len = lexer.read_uint32();
            content.data = this.bin.slice(lexer.at, lexer.at += len);
            this.section11.content.push(content);
        }
    }

    parseSection12() : void {
        const lexer = this.lexer;
        this.section12.byteLen = lexer.read_uint32();
        this.section12.dataCount = lexer.read_uint32();
    }

    parseCodeBlock() : Array<InstrNode> {
        //console.log(this.recursionDepth, this.lexer.at);
        const lexer = this.lexer;
        const instrArray : Array<InstrNode> = [];
        while (true) {
            const instr_op = lexer.read_uint8();
            if (instr_op === WASMOPCode.op_end || instr_op === WASMOPCode.op_else) break;
            const currInstr = new InstrNode();
            currInstr.instr = instr_op;
            switch (instr_op) {
                case WASMOPCode.op_block:
                case WASMOPCode.op_loop:
                case WASMOPCode.op_if: {
                    const result_type = lexer.read_uint8();
                    currInstr.immediates.push(WASMValue.createU32Literal(result_type));
                    currInstr.child = this.parseCodeBlock();
                    lexer.back();
                    if (lexer.read_uint8() === WASMOPCode.op_else) {
                        currInstr.hasElse = true;
                        currInstr.child2 = this.parseCodeBlock();
                    }                
                    break;
                }
                case WASMOPCode.op_call: {
                    const index = lexer.read_uint32();
                    currInstr.immediates.push(WASMValue.createU32Literal(index));
                    break;
                }
                case WASMOPCode.op_call_indirect: {
                    const index = lexer.read_uint32();
                    currInstr.immediates.push(WASMValue.createU32Literal(index));
                    if (lexer.read_uint8() != 0x00) {
                        //error typeuse not supported
                    }
                    break;
                }
                case WASMOPCode.op_br_table: {
                    const indCount = lexer.read_uint32();
                    currInstr.immediates.push(WASMValue.createU32Literal(indCount));
                    for (let i = 0; i < indCount; ++i) 
                        currInstr.immediates.push(WASMValue.createU32Literal(lexer.read_uint32()));
                    const label = lexer.read_uint32();
                    currInstr.immediates.push(WASMValue.createU32Literal(label));
                    break;
                }
                case WASMOPCode.op_memory_size: case WASMOPCode.op_memory_grow:
                    currInstr.immediates.push(WASMValue.createU32Literal(lexer.read_uint8()));
                    break;
                case WASMOPCode.op_i32_load: case WASMOPCode.op_i32_load8_s: case WASMOPCode.op_i32_load8_u: case WASMOPCode.op_i32_load16_s: case WASMOPCode.op_i32_load16_u:
                case WASMOPCode.op_i64_load: case WASMOPCode.op_i64_load8_s: case WASMOPCode.op_i64_load8_u: case WASMOPCode.op_i64_load16_s: case WASMOPCode.op_i64_load16_u: case WASMOPCode.op_i64_load32_s: case WASMOPCode.op_i64_load32_u:
                case WASMOPCode.op_f32_load:
                case WASMOPCode.op_f64_load:
                case WASMOPCode.op_i32_store: case WASMOPCode.op_i32_store8: case WASMOPCode.op_i32_store16:
                case WASMOPCode.op_i64_store: case WASMOPCode.op_i64_store8: case WASMOPCode.op_i64_store16: case WASMOPCode.op_i64_store32:
                case WASMOPCode.op_f32_store:
                case WASMOPCode.op_f64_store:
                    currInstr.immediates.push(WASMValue.createU32Literal(lexer.read_uint32()));
                    currInstr.immediates.push(WASMValue.createU32Literal(lexer.read_uint32()));
                    break;
                case WASMOPCode.op_i32_const:
                    currInstr.immediates.push(WASMValue.createI32Literal(lexer.read_int32()));
                    break;
                case WASMOPCode.op_i64_const:
                    currInstr.immediates.push(WASMValue.createI64Literal(lexer.read_int64()));
                    break;
                case WASMOPCode.op_f32_const:
                    currInstr.immediates.push(WASMValue.createF32Literal(lexer.read_float32()));
                    break;
                case WASMOPCode.op_f64_const:
                    currInstr.immediates.push(WASMValue.createF64Literal(lexer.read_float64()));
                    break;
                case WASMOPCode.op_br: case WASMOPCode.op_br_if:
                case WASMOPCode.op_local_get: case WASMOPCode.op_local_set: case WASMOPCode.op_local_tee:
                case WASMOPCode.op_global_get: case WASMOPCode.op_global_set:
                    currInstr.immediates.push(WASMValue.createU32Literal(lexer.read_uint32()));
                    break;
                default:
                    //error on invalid opcodes
                    break;
            }
        }
        return instrArray;
    }
}