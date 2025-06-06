import { Reader } from "../helpers/Lexer";
import { InstrNode, WASMValue } from "../spec/Code";
import { CompileError } from "../spec/Error";
import { WASMOPCode, WASMOPDef, WASMOPDefs } from "../spec/OpCode";
import { 
    WASMFuncType,
    WASMLimit,
    WASMLocalEnum,
    WASMSection2Content,
    WASMSection3Content,
    WASMSection4Content,
    WASMSection7Content,
    WASMSection10Content,
    WASMSection11Content,
    WASMSection9Content,
    WASMSection6Content,
} from "../spec/Sections";
import { WASMValueType, WASMDeclType, WASMGlobalType, WASMRefType, typeArrayToString, typeToString } from "../spec/Types";
import WASMRepr from "./Repr";
import { typeArrayEq, typeCheckArgs, typeCheckDef, typeCheckResults, typeStackPush } from "./TypeCheck";

export default class WASMParser {
    bin : Uint8Array;
    lexer : Reader;
    currErrStr : string = ""
    constructor(bin : Uint8Array) {
        this.bin = bin;
        this.lexer = new Reader(bin);
    }

    dumpErr(msg : string) : string {
        return `${this.currErrStr}${msg} (0x${this.lexer.at.toString(16)})`;
    }

    readValueType() : WASMValueType {
        const t = this.lexer.read_uint8();
        switch (t) {
            case WASMValueType.i32:
            case WASMValueType.f32:
            case WASMValueType.i64:
            case WASMValueType.f64:
            case WASMValueType.nil:
                return t;
        }
        throw new TypeError(this.dumpErr(`Invalid value type ${t}`));
    }

    readRefType() : WASMRefType {
        const t = this.lexer.read_uint8();
        switch (t) {
            case WASMRefType.funcref:
            case WASMRefType.externref:
                return t;
        }
        throw new TypeError(this.dumpErr(`Invalid ref type ${t}`));
    }

    readLimit() : WASMLimit {
        const lexer = this.lexer;
        const limit = new WASMLimit();
        const hasMax = lexer.read_uint8();
        limit.hasMax = hasMax !== 0;
        if (hasMax) {
            limit.min = lexer.read_uint32();
            limit.max = lexer.read_uint32();
            if (limit.min > limit.max)
                throw new RangeError(this.dumpErr(`Limit min ${limit.min} greater than max ${limit.max}`));
        }
        else
            limit.min = limit.max = lexer.read_uint32();
        return limit;
    }

    parse(repr : WASMRepr) : void {
        const lexer = this.lexer;
        lexer.read_float64(); //magic header
        while (lexer.has()) {
            const section = lexer.read_uint8();
            this.currErrStr = `Error while parsing section ${section}: `;
            if (section > 12) throw new CompileError(this.dumpErr(`Trying to parse invalid section ${section}`));
            if (section !== 0 && repr.has_section(section)) 
                throw new CompileError(this.dumpErr(`Section ${section} already exists`));

            repr.sectionLengths[section] = lexer.read_uint32();
            const anchor = lexer.at;
            switch (section) {
                case 0: this.parseSection0(repr); break;
                case 1: this.parseSection1(repr); break;
                case 2: this.parseSection2(repr); break;
                case 3: this.parseSection3(repr); break;
                case 4: this.parseSection4(repr); break;
                case 5: this.parseSection5(repr); break;
                case 6: this.parseSection6(repr); break;
                case 7: this.parseSection7(repr); break;
                case 8: this.parseSection8(repr); break;
                case 9: this.parseSection9(repr); break;
                case 10: this.parseSection10(repr); break;
                case 11: this.parseSection11(repr); break;
                case 12: this.parseSection12(repr); break;
                default: break;
            }
            if (lexer.at !== anchor + repr.sectionLengths[section]) 
                throw new RangeError(this.dumpErr(`Section ${section} has malformed length ${repr.sectionLengths[section]}`));
        }
        if (lexer.at !== lexer.buf.length)
            throw new CompileError(this.dumpErr(`Prematurely finished parsing the binary`));
        return;
    }
    parseSection0(repr : WASMRepr) : void {
        //skip it
        this.lexer.at += repr.sectionLengths[0];
    }

    parseSection1(repr : WASMRepr) : void {
        const lexer = this.lexer;
        const sectionLen = lexer.read_uint32();
        for (let i = 0; i < sectionLen; ++i) {
            this.currErrStr = `Error while parsing (sec 1, functype ${i}): `;
            const content = new WASMFuncType();
            const validate = lexer.read_uint8();
            if (validate !== 0x60)
                throw new CompileError(this.dumpErr(`Expected 0x60 for functype, got ${validate}`));
            const paramLen = lexer.read_uint32();
            for (let j = 0; j < paramLen; ++j) 
                content.args.push(this.readValueType());

            const retLen = lexer.read_uint32();
            for (let j = 0; j < retLen; ++j) 
                content.rets.push(this.readValueType());
            repr.section1.content.push(content);
        }
    }

    parseSection2(repr : WASMRepr) : void {
        if (repr.has_section(3))
            throw new CompileError(this.dumpErr(`Function section declared before import section`));
        if (repr.has_section(4))
            throw new CompileError(this.dumpErr(`Table section declared before import section`));
        if (repr.has_section(5))
            throw new CompileError(this.dumpErr(`Memory section declared before import section`));
        if (repr.has_section(6))
            throw new CompileError(this.dumpErr(`Global section declared before import section`));
        const lexer = this.lexer;
        const sectionLen = lexer.read_uint32();
        for (let i = 0; i < sectionLen; ++i) {
            this.currErrStr = `Error while parsing (sec 2, import ${i}): `;
            const content = new WASMSection2Content();
            content.module = lexer.read_string();
            content.name = lexer.read_string();
            const kind = content.kind = lexer.read_uint8();
            switch (kind) {
                case WASMDeclType.func:
                    content.index = lexer.read_uint32();
                    repr.funcTypes.push(content.index); 
                    if (content.index >= repr.section1.content.length)
                        throw new RangeError(this.dumpErr(`Functype index ${content.index} out of range`));
                    ++repr.importFunc;
                    break;
                case WASMDeclType.global: {
                    const globType = new WASMGlobalType();
                    globType.type = this.readValueType();
                    globType.mutable = (lexer.read_uint8() !== 0);
                    content.type = globType.type;
                    repr.globalTypes.push(globType);
                    ++repr.importGlobal;
                    break;
                }
                case WASMDeclType.table: {
                    content.type = lexer.read_uint8();
                    content.limits = this.readLimit();
                    ++repr.tableCount;
                    break;
                }
                case WASMDeclType.mem: {
                    content.limits = this.readLimit();
                    ++repr.memoryCount;
                    break;
                }
                default:
                    throw new CompileError(this.dumpErr(`Invalid import type ${kind}`));
            }
            repr.section2.content.push(content);
        }
    }

    parseSection3(repr : WASMRepr) : void {
        if (!repr.has_section(1))
            throw new CompileError(this.dumpErr(`Missing functype section`));
        const lexer = this.lexer;
        const sectionLen = lexer.read_uint32();
        for (let i = 0; i < sectionLen; ++i) {
            this.currErrStr = `Error while parsing (sec 3, function ${i}): `;
            const content = new WASMSection3Content();
            content.index = lexer.read_uint32();
            if (content.index >= repr.section1.content.length)
                throw new RangeError(this.dumpErr(`Functype index ${content.index} out of range`));
            repr.funcTypes.push(content.index);
            repr.section3.content.push(content);
        }
    }

    parseSection4(repr : WASMRepr) : void {
        const lexer = this.lexer;
        const sectionLen = lexer.read_uint32();
        for (let i = 0; i < sectionLen; ++i) {
            this.currErrStr = `Error while parsing (sec 4, table ${i}): `;
            const content = new WASMSection4Content();
            const kind = this.readRefType();
            content.refKind = kind;
            content.limit = this.readLimit();
            repr.section4.content.push(content);
        }
        repr.tableCount += sectionLen;
    }

    parseSection5(repr : WASMRepr) : void {
        const lexer = this.lexer;
        const sectionLen = lexer.read_uint32();
        if (sectionLen + repr.memoryCount > 1)
            throw new CompileError(this.dumpErr(`Attempted to declare ${sectionLen + repr.memoryCount} > 1 memory section`));
        for (let i = 0; i < sectionLen; ++i) {
            this.currErrStr = `Error while parsing (sec 5, memory ${i}): `;
            const content = this.readLimit();
            repr.section5.content.push(content);
        }
        repr.memoryCount += sectionLen;
    }

    parseSection6(repr : WASMRepr) : void {
        const lexer = this.lexer;
        const sectionLen = lexer.read_uint32();
        for (let i = 0; i < sectionLen; ++i) {
            this.currErrStr = `Error while parsing (sec 6, global ${i + repr.importGlobal}): `;
            const content = new WASMSection6Content();
            const type = lexer.read_uint8();
            content.type.mutable = (lexer.read_uint8() !== 0);
            content.type.type = type;
            repr.globalTypes.push(content.type);
            content.expr = this.parseConstExpr();
            repr.section6.content.push(content);
        }
    }

    parseSection7(repr : WASMRepr) : void {
        const lexer = this.lexer;
        const sectionLen = lexer.read_uint32();
        for (let i = 0; i < sectionLen; ++i) {
            this.currErrStr = `Error while parsing (sec 7, export ${i}): `;
            const content = new WASMSection7Content();
            content.name = lexer.read_string();
            const kind = content.kind = lexer.read_uint8();
            const index = content.index = lexer.read_uint32();
            switch (kind) {
                case 0:
                    if (!repr.has_section(3))
                        throw new CompileError(this.dumpErr(`Function section missing for exports`));
                    if (index >= repr.funcTypes.length)
                        throw new RangeError(this.dumpErr(`Exported function ${index} out of range`));
                    break;
                case 1:
                    if (!repr.has_section(4))
                        throw new CompileError(this.dumpErr(`Table section missing for exports`));
                    if (index >= repr.tableCount)
                        throw new RangeError(this.dumpErr(`Exported table ${index} out of range`));
                    break;
                case 2:
                    if (!repr.has_section(5))
                        throw new CompileError(this.dumpErr(`Memory section missing for exports`));
                    if (index >= repr.memoryCount)
                        throw new RangeError(this.dumpErr(`Exported memory ${index} out of range`));
                    break;
                case 3:
                    if (!repr.has_section(6))
                        throw new CompileError(this.dumpErr(`Global section missing for exports`));
                    if (index >= repr.globalTypes.length)
                        throw new RangeError(this.dumpErr(`Exported global ${index} out of range`));
                    //if (this.globalTypes[exp.index].mutable === false)
                        //throw new Error(`Exported global ${exp.index} immutable`));
                    break;
                default:
                    throw new CompileError(this.dumpErr(`Invalid export type ${kind}`));
            }
            repr.section7.content.push(content);
        }
    }

    parseSection8(repr : WASMRepr) : void {
        if (!repr.has_section(3))
            throw new CompileError(this.dumpErr(`Missing func declaration section`));
        const lexer = this.lexer;
        repr.section8.index = lexer.read_uint32();
        if (repr.section8.index < repr.importFunc)
            throw new RangeError(this.dumpErr(`Start index $func${repr.section8.index} is an import`));
        if (repr.section8.index - repr.importFunc >= repr.section3.content.length)
            throw new RangeError(this.dumpErr(`Start index $func${repr.section8.index} out of range`));
        const funcType = repr.section1.content[repr.funcTypes[repr.section8.index]];
        if (funcType.args.length !== 0 || funcType.rets.length !== 0)
            throw new TypeError(this.dumpErr(`Expected start function type to be [] -> [], got [${typeArrayToString(funcType.args)}] -> [${typeArrayToString(funcType.rets)}]`));
    }

    parseSection9(repr : WASMRepr) : void {
        const lexer = this.lexer;
        const sectionLen = lexer.read_uint32();
        for (let i = 0; i < sectionLen; ++i) {
            this.currErrStr = `Error while parsing (sec 9, elem ${i}): `;
            const content = new WASMSection9Content();
            content.kind = lexer.read_uint32();
            content.offset = this.parseConstExpr();
            const numRefs = lexer.read_uint32();
            for (let j = 0; j < numRefs; ++j)
                content.funcrefs.push(lexer.read_uint32());
            repr.section9.content.push(content);
        }
    }

    parseSection10(repr : WASMRepr) : void {
        if (!repr.has_section(3))
            throw new CompileError(this.dumpErr(`Missing func declaration section`));
        const lexer = this.lexer;
        const sectionLen = lexer.read_uint32();
        if (sectionLen !== repr.section3.content.length)
            throw new RangeError(this.dumpErr(`Function count mismatch: declared ${repr.section3.content.length}, initializing ${sectionLen}`));
        for (let i = 0; i < sectionLen; ++i) {
            this.currErrStr = `Error while parsing (sec 10, $func${i + repr.importFunc}): `;
            const section = new WASMSection10Content();
            section.byteLen = lexer.read_uint32();
            const localChunks = lexer.read_uint32();
            const locals : Array<WASMValueType> = [];
            //push args
            const typeDef = repr.section1.content[repr.section3.content[i].index];
            for (let j = 0; j < typeDef.args.length; ++j)
                locals.push(typeDef.args[j]);
            for (let j = 0; j < localChunks; ++j) {
                const count = lexer.read_uint32();
                const type = this.readValueType();
                const en = new WASMLocalEnum();
                en.count = count;
                en.type = type;
                section.locals.push(en);
                for (let j = 0; j < count; ++j)
                    locals.push(type);
            }
            section.code = this.parseCodeBlock(
                locals,
                [],
                [],
                typeDef.rets,
                typeDef.rets,
                repr
            );
            repr.section10.content.push(section);
        } 
    }

    parseSection11(repr : WASMRepr) : void {
        const lexer = this.lexer;
        const sectionLen = lexer.read_uint32();
        if (repr.has_section(12) && repr.section12.dataCount !== sectionLen)
            throw new RangeError(this.dumpErr(`Data count mismatch: declared ${repr.section12.dataCount}, initializing ${sectionLen}`));
        for (let i = 0; i < sectionLen; ++i) {
            this.currErrStr = `Error while parsing (sec 11, data ${i}): `;
            const content = new WASMSection11Content();
            const kind = lexer.read_uint8();
            content.kind = kind;
            switch (kind) {
                case 2:
                    content.memidx = lexer.read_uint32();
                case 0: 
                    content.offset = this.parseConstExpr();
                case 1:
                    break;
                default:
                    throw new CompileError(this.dumpErr(`Invalid data flag ${kind}`));
            }
            const len = lexer.read_uint32();
            content.data = this.bin.slice(lexer.at, lexer.at += len);
            repr.section11.content.push(content);
        }
    }

    parseSection12(repr : WASMRepr) : void {
        const lexer = this.lexer;
        repr.section12.dataCount = lexer.read_uint32();
    }

    createResultType(t : number, repr : WASMRepr) : WASMOPDef {
        if (t < 0) {
            switch (t + 0x80) {
                case WASMValueType.i32:
                case WASMValueType.i64:
                case WASMValueType.f32:
                case WASMValueType.f64:
                    return new WASMOPDef([], [t + 0x80]);
                case WASMValueType.nil:
                    return new WASMOPDef([], []);
                default:
                    throw new TypeError(`Invalid type ${t}`);
            }
        }
        else {
            if (t >= repr.section1.content.length)
                throw new RangeError(`Functype ${t} out of range`)
            return repr.section1.content[t];
        }
    }
    parseCodeBlock(
        locals : Array<WASMValueType>,
        typeStack : Array<WASMValueType>,
        blockTypes : Array<Array<WASMValueType>>,
        blockReturnType : Array<WASMValueType>,
        funcReturn : Array<WASMValueType>,
        repr : WASMRepr
    ) : Array<InstrNode> {
        const numLocals = locals.length;
        const numGlobals = repr.globalTypes.length;
        const numFuncs = repr.funcTypes.length;
        const lexer = this.lexer;
        const instrArray : Array<InstrNode> = [];
        while (true) {
            let instrOp : WASMOPCode = lexer.read_instr();
            if (instrOp === WASMOPCode.op_end || instrOp === WASMOPCode.op_else) break;
            const currInstr = new InstrNode();
            instrArray.push(currInstr);
            currInstr.instr = instrOp;
            switch (instrOp) {
                case WASMOPCode.op_if:
                    typeCheckArgs(typeStack, [WASMValueType.i32]);
                case WASMOPCode.op_loop:
                case WASMOPCode.op_block: {
                    //error 33bit signed
                    const result = lexer.read_int32();
                    const retType = this.createResultType(result, repr);
                    typeCheckArgs(typeStack, retType.args);
                    if (instrOp === WASMOPCode.op_loop)
                        blockTypes.push(retType.args);
                    else
                        blockTypes.push(retType.rets);
                    currInstr.immediates.push(WASMValue.createU32Literal(result));
                    currInstr.child = this.parseCodeBlock(locals, retType.args.slice(0), blockTypes, retType.rets, funcReturn, repr);
                    lexer.back();
                    if (lexer.read_uint8() === WASMOPCode.op_else) {
                        currInstr.hasElse = true;
                        currInstr.child2 = this.parseCodeBlock(locals, retType.args.slice(0), blockTypes, retType.rets, funcReturn, repr);
                    }
                    else if (instrOp === WASMOPCode.op_if && !typeArrayEq(retType.args, retType.rets))
                        throw new TypeError(this.dumpErr(`if true clause returns [${typeArrayToString(retType.rets)}], if false returns [${typeArrayToString(retType.args)}]`))
                    for (const ret of retType.rets)
                        typeStackPush(typeStack, ret);
                    //fix for multireturn
                    currInstr.numKeep = retType.rets.length;
                    currInstr.numDrop = retType.args.length;
                    blockTypes.pop();
                    break;
                }
                case WASMOPCode.op_call: {
                    const index = lexer.read_uint32();
                    currInstr.immediates.push(WASMValue.createU32Literal(index));
                    if (index >= numFuncs)
                        throw new RangeError(this.dumpErr(`Function index ${index} out of range`));
                    const funcType = repr.section1.content[repr.funcTypes[index]];
                    typeCheckArgs(typeStack, funcType.args);
                    //for (let i = funcType.args.length; i > 0; --i)
                        //typeCheckArg(typeStack, funcType.args[i - 1]);
                    for (const ret of funcType.rets)
                        typeStackPush(typeStack, ret);
                    break;
                }
                case WASMOPCode.op_call_indirect: {
                    const index = lexer.read_uint32();
                    currInstr.immediates.push(WASMValue.createU32Literal(index));
                    if (lexer.read_uint32() !== 0x00) 
                        console.error(`Warning: call_indirect typeuse not supported and is ignored`);
                    typeCheckArgs(typeStack, [WASMValueType.i32]);
                    const funcType = repr.section1.content[index];
                    typeCheckArgs(typeStack, funcType.args);
                    for (const ret of funcType.rets)
                        typeStackPush(typeStack, ret);
                    break;
                }
                case WASMOPCode.op_br_table: {
                    typeCheckArgs(typeStack, [WASMValueType.i32]);
                    const indCount = lexer.read_uint32();
                    currInstr.immediates.push(WASMValue.createU32Literal(indCount));
                    const depth = lexer.read_uint32();
                    currInstr.immediates.push(WASMValue.createU32Literal(depth));
                    if (depth >= blockTypes.length)
                        throw new RangeError(this.dumpErr(`Branch depth ${depth} invalid`));
                    const retType = blockTypes[blockTypes.length - 1 - depth];
                    for (let i = 0; i < indCount; ++i) {
                        const depth = lexer.read_uint32();
                        currInstr.immediates.push(WASMValue.createU32Literal(depth));
                        if (depth >= blockTypes.length)
                            throw new RangeError(this.dumpErr(`Branch depth ${depth} invalid`));
                        if (!typeArrayEq(retType, blockTypes[blockTypes.length - 1 - depth]))
                            throw new TypeError(this.dumpErr(`br_table block type mismatch`));
                    }
                    //fix
                    currInstr.numKeep = retType.length;
                    typeCheckArgs(typeStack, retType);
                    typeStack.push(WASMValueType.nil);
                    break
                }
                case WASMOPCode.op_memory_copy:
                    currInstr.immediates.push(WASMValue.createU32Literal(lexer.read_uint32()));
                case WASMOPCode.op_memory_fill:
                case WASMOPCode.op_memory_size: case WASMOPCode.op_memory_grow: {
                    //idk why
                    currInstr.immediates.push(WASMValue.createU32Literal(lexer.read_uint32()));
                    typeCheckDef(typeStack, instrOp);
                    break;          
                }      
                case WASMOPCode.op_i32_load8_s: case WASMOPCode.op_i32_load8_u:
                case WASMOPCode.op_i64_load8_s: case WASMOPCode.op_i64_load8_u:
                case WASMOPCode.op_i32_store8: case WASMOPCode.op_i32_store16:
                case WASMOPCode.op_i64_store8:
                case WASMOPCode.op_i32_load16_s: case WASMOPCode.op_i32_load16_u:
                case WASMOPCode.op_i64_load16_s: case WASMOPCode.op_i64_load16_u:
                case WASMOPCode.op_i64_store16:
                case WASMOPCode.op_i32_load:
                case WASMOPCode.op_i64_load32_s: case WASMOPCode.op_i64_load32_u:
                case WASMOPCode.op_f32_load:
                case WASMOPCode.op_i32_store: 
                case WASMOPCode.op_i64_store32:
                case WASMOPCode.op_f32_store:
                case WASMOPCode.op_i64_load:   
                case WASMOPCode.op_f64_load:
                case WASMOPCode.op_i64_store:   
                case WASMOPCode.op_f64_store: {
                    typeCheckDef(typeStack, instrOp);
                    const align = lexer.read_uint32();
                    currInstr.immediates.push(WASMValue.createU32Literal(align));
                    currInstr.immediates.push(WASMValue.createU32Literal(lexer.read_uint32()));
                    break;
                }
                case WASMOPCode.op_i32_const:
                    typeStackPush(typeStack, WASMValueType.i32);
                    currInstr.immediates.push(WASMValue.createI32Literal(lexer.read_int32()));
                    break;
                case WASMOPCode.op_i64_const:
                    typeStackPush(typeStack, WASMValueType.i64);
                    currInstr.immediates.push(WASMValue.createI64Literal(lexer.read_int64()));
                    break;
                case WASMOPCode.op_f32_const:
                    typeStackPush(typeStack, WASMValueType.f32);
                    currInstr.immediates.push(WASMValue.createF32Literal(lexer.read_float32()));
                    break;
                case WASMOPCode.op_f64_const:
                    typeStackPush(typeStack, WASMValueType.f64);
                    currInstr.immediates.push(WASMValue.createF64Literal(lexer.read_float64()));
                    break;
                case WASMOPCode.op_br_if:
                    typeCheckArgs(typeStack, [WASMValueType.i32]);
                case WASMOPCode.op_br: {
                    const depth = lexer.read_uint32();
                    if (depth >= blockTypes.length)
                        throw new RangeError(this.dumpErr(`Invalid branch depth ${depth}`));
                    const blockType = blockTypes[blockTypes.length - 1 - depth];
                    //fix
                    typeCheckArgs(typeStack, blockType);
                    currInstr.immediates.push(WASMValue.createU32Literal(depth));
                    currInstr.numKeep = blockType.length;
                    //uhhhh lmao this may not work
                    for (const ret of blockType)
                        typeStackPush(typeStack, ret);
                    if (currInstr.instr === WASMOPCode.op_br) 
                        typeStack.push(WASMValueType.nil);
                    break;
                }
                case WASMOPCode.op_local_get: {
                    const index = lexer.read_uint32();
                    if (index >= numLocals)
                        throw new RangeError(this.dumpErr(`Local index ${index} out of range`));
                    typeStackPush(typeStack, locals[index]);
                    currInstr.immediates.push(WASMValue.createU32Literal(index));
                    break;
                }
                case WASMOPCode.op_local_set: {
                    const index = lexer.read_uint32();
                    if (index >= numLocals)
                        throw new RangeError(this.dumpErr(`Local index ${index} out of range`));
                    typeCheckArgs(typeStack, [locals[index]]);
                    currInstr.immediates.push(WASMValue.createU32Literal(index));
                    break;
                }
                case WASMOPCode.op_local_tee: {
                    const index = lexer.read_uint32();
                    if (index >= numLocals)
                        throw new RangeError(this.dumpErr(`Local index ${index} out of range`));
                    typeCheckArgs(typeStack, [locals[index]]);
                    typeStackPush(typeStack, locals[index]);
                    currInstr.immediates.push(WASMValue.createU32Literal(index));
                    break;
                }
                case WASMOPCode.op_global_get: {
                    const index = lexer.read_uint32();
                    if (index >= numGlobals)
                        throw new RangeError(this.dumpErr(`Global index ${index} out of range`));
                    typeStackPush(typeStack, repr.globalTypes[index].type);
                    currInstr.immediates.push(WASMValue.createU32Literal(index));
                    break;
                }
                case WASMOPCode.op_global_set: {
                    const index = lexer.read_uint32();
                    if (index >= numGlobals)
                        throw new RangeError(this.dumpErr(`Global index ${index} out of range`));
                    typeCheckArgs(typeStack, [repr.globalTypes[index].type]);
                    currInstr.immediates.push(WASMValue.createU32Literal(index));
                    break;
                }
                case WASMOPCode.op_drop: {
                    if (typeStack.length === 0)
                        throw new RangeError(this.dumpErr(`Expected at least 1 value on stack for drop, got 0`));
                    typeStack.pop();
                    break;
                }
                case WASMOPCode.op_unreachable: {
                    typeStack.push(WASMValueType.nil);
                    break;
                }
                case WASMOPCode.op_return: {
                    typeCheckResults(typeStack, funcReturn);
                    //used to store number of branch ups
                    currInstr.immediates.push(WASMValue.createU32Literal(blockTypes.length));
                    currInstr.numKeep = funcReturn.length;
                    //polymorphic
                    typeStack.push(WASMValueType.nil);
                    break;
                }
                case WASMOPCode.op_select: {
                    typeCheckArgs(typeStack, [WASMValueType.i32]);
                    if (typeStack.length < 2)
                        throw new RangeError(this.dumpErr(`Expected at least 2 values on stack for select, got ${typeStack.length}`));
                    const t1 = typeStack.pop();
                    const t2 = typeStack.pop();
                    if (t1 === undefined || t2 === undefined)
                        throw new CompileError(this.dumpErr(`assert(true)`));
                    if (t1 !== t2)
                        throw new RangeError(this.dumpErr(`Select operands ${typeToString(t1)} and ${typeToString(t2)} do not match`));
                    typeStackPush(typeStack, t1);
                    break;
                }
                default:
                    if (!(instrOp in WASMOPDefs))
                        throw new CompileError(this.dumpErr(`Invalid opcode ${instrOp}`));
                    typeCheckDef(typeStack, instrOp);
                    break;
            }
        }
        typeCheckResults(typeStack, blockReturnType);
        return instrArray;
    }

    parseConstExpr() : Array<InstrNode> {
        const lexer = this.lexer;
        const instrArray : Array<InstrNode> = [];
        while (true) {
            const instrOp = lexer.read_instr();
            if (instrOp === WASMOPCode.op_end)
                break;
            const currInstr = new InstrNode();
            instrArray.push(currInstr);
            currInstr.instr = instrOp;
            switch (instrOp) {
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
                case WASMOPCode.op_global_get:
                    throw new CompileError(this.dumpErr(`Globals in constexpr not yet supported`));
                default:
                    throw new CompileError(this.dumpErr(`Opcode ${instrOp} not allowed in constexpr`));
            }
        }
        if (instrArray.length !== 1)
                throw new CompileError(this.dumpErr(`Constexprs must contain exactly one instruction`));
        return instrArray;
    }
}