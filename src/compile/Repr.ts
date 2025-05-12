import { InstrNode, WASMValue } from "../spec/Code";
import { CompileError } from "../spec/Error";
import { WASMOPCode, WASMOPDefs } from "../spec/OpCode";
import { 
    WASMSection, WASMFuncType,
    WASMLimit,
    WASMSection2Content,
    WASMSection3Content,
    WASMSection4Content,
    WASMSection7Content,
    WASMSection8Content,
    WASMSection10Content,
    WASMSection11Content,
    WASMSection12Content,
    WASMSection9Content,
    WASMSection6Content, 
} from "../spec/Sections";
import { typeToString, WASMGlobalType, WASMValueType } from "../spec/Types";

function pushSafe(stack : Array<WASMValueType>, t : WASMValueType) : void {
    if (t === undefined)
        throw new Error(`Impossible push`);
    if (t === WASMValueType.nil)
        return;
    stack.push(t);
}

function __typeCheckArg(stack : Array<WASMValueType>, check : WASMValueType) : void {
    if (check === WASMValueType.nil) {
        //do nothing
        return;
    }
    const top = stack.pop();
    if (top === undefined)
        throw new CompileError(`Expected 1 value on stack, got 0`);
    if (top !== check)
        throw new TypeError(`Type mismatch: expected ${typeToString(check)} on stack, got ${typeToString(top)}`);
}

function __typeCheckResult(stack : Array<WASMValueType>, check : WASMValueType) : void {
    if (check === WASMValueType.nil) {
        if (stack.length === 0) return;
        throw new RangeError(`Expected empty stack, got ${stack.length}`);
    }
    else if (stack.length !== 1)
        throw new RangeError(`Error on return, expected 1 argument on stack, got ${stack.length}`);
    const top = stack[0];
    if (top === undefined)
        throw new CompileError(`Impossible`);
    if (top !== check)
        throw new TypeError(`Type mismatch: expected ${typeToString(check)} values on stack, got ${typeToString(top)}`);
}

export default class WASMRepr {
    funcTypes : Array<number> = [];
    globalTypes : Array<WASMGlobalType> = [];
    importFunc : number = 0;
    importGlobal : number = 0;
    tableCount : number = 0;
    memoryCount : number = 0;
    section1 : WASMSection<WASMFuncType> = new WASMSection();
    section2 : WASMSection<WASMSection2Content> = new WASMSection();
    section3 : WASMSection<WASMSection3Content> = new WASMSection();
    section4 : WASMSection<WASMSection4Content> = new WASMSection();
    section5 : WASMSection<WASMLimit> = new WASMSection();
    section6 : WASMSection<WASMSection6Content> = new WASMSection();
    section7 : WASMSection<WASMSection7Content> = new WASMSection();
    section8 : WASMSection8Content = new WASMSection8Content();
    section9 : WASMSection<WASMSection9Content> = new WASMSection();
    section10 : WASMSection<WASMSection10Content> = new WASMSection();
    section11 : WASMSection<WASMSection11Content> = new WASMSection();
    section12 : WASMSection12Content = new WASMSection12Content();
    sectionLengths : Array<number> = new Array(13).fill(0);


    has_section(sec : number) : boolean {
        return this.sectionLengths[sec] !== 0;
    }

    validate() {
        if (this.has_section(12) && this.has_section(11)) {
            if (this.section12.dataCount !== this.section11.content.length) {
                throw new RangeError(`Invalid data count, expected ${this.section12.dataCount}, got ${this.section11.content.length}`);
            }
        }
        if (this.has_section(3)) {
            if (!this.has_section(1)) 
                throw new Error("Missing functype section");
            for (let i = 0; i < this.funcTypes.length; ++i) {
                if (this.funcTypes[i] >= this.section1.content.length)
                    throw new RangeError(`Invalid functype ${this.funcTypes[i]} for $func${i}`);
            }
        }
        if (this.has_section(10)) {
            if (this.section10.content.length !== this.section3.content.length)
                throw new RangeError(`Function count mismatch: ${this.section3.content.length} declared, ${this.section10.content.length} iniialized`);
            //typecheck and check for out-of-bound function, local, and global references
            for (let i = 0; i < this.section10.content.length; ++i) {
                const content = this.section10.content[i];
                const locals : Array<WASMValueType> = [];
                const typeDef = this.section1.content[this.section3.content[i].index];
                for (let i = 0; i < typeDef.args.length; ++i)
                    locals.push(typeDef.args[i]);
                for (let i = 0; i < content.locals.length; ++i)
                    for (let j = 0; j < content.locals[i].count; ++j) 
                        locals.push(content.locals[i].type)

                this.validateCodeBlock(content.code, locals, typeDef.ret);
            }
        }
        if (this.has_section(8)) {
            const idx = this.section8.index;
            if (idx < this.importFunc)
                throw new Error(`Start function ${idx} is an import`);
            else if (idx >= this.funcTypes.length)
                throw new RangeError(`Start function ${idx} out of bounds`);
            const funcType = this.section1.content[this.funcTypes[idx]];
            if (funcType.args.length !== 0 || funcType.ret !== WASMValueType.nil)
                throw new Error(`Start function must not take or return values`);
        }
        if (this.has_section(7)) {
            for (const exp of this.section7.content) {
                switch (exp.kind) {
                    case 0:
                        if (exp.index >= this.funcTypes.length)
                            throw new Error(`Exported function ${exp.index} out of range`);
                        break;
                    case 1:
                        if (exp.index >= this.tableCount)
                            throw new Error(`Exported table ${exp.index} out of range`);
                        break;
                    case 2:
                        if (exp.index >= this.memoryCount)
                            throw new Error(`Exported memory ${exp.index} out of range`);
                        break;
                    case 3:
                        if (exp.index >= this.globalTypes.length)
                            throw new Error(`Exported global ${exp.index} out of range`);
                        //if (this.globalTypes[exp.index].mutable === false)
                            //throw new Error(`Exported global ${exp.index} immutable`);
                        break;
                    default:
                        throw new Error(`Shouldn't happen`);
                }
            }
        }
        //error need to check for constexprs
        if (this.memoryCount > 1)
            throw new RangeError(`${this.memoryCount} memory declarations present, only at most one allowed`);
    }

    __validateCodeBlockRecursive(
        code : Array<InstrNode>, 
        locals : Array<WASMValueType>,
        block_types : Array<WASMValueType>,
        result_type : WASMValueType,
        func_return : WASMValueType
    ) : void {
        const typeStack : Array<WASMValueType> = [];
        const num_locals = locals.length;
        const num_globals = this.globalTypes.length;
        const num_funcs = this.funcTypes.length;
        for (const instr of code) {
            const args = instr.immediates;
            switch (instr.instr) {
                case WASMOPCode.op_local_get:
                    if (args[0].u32 >= num_locals)
                        throw new RangeError(`Local index ${args[0].u32} out of bounds`);
                    pushSafe(typeStack, locals[args[0].u32]);
                    break;
                case WASMOPCode.op_local_set:
                    if (args[0].u32 >= num_locals)
                        throw new RangeError(`Local index ${args[0].u32} out of bounds`);
                    __typeCheckArg(typeStack, locals[args[0].u32]);
                    break;
                case WASMOPCode.op_local_tee:
                    if (args[0].u32 >= num_locals)
                        throw new RangeError(`Local index ${args[0].u32} out of bounds`);
                    __typeCheckArg(typeStack, locals[args[0].u32]);
                    pushSafe(typeStack, locals[args[0].u32]);
                    break;
                case WASMOPCode.op_global_get:
                    if (args[0].u32 >= num_globals) 
                        throw new RangeError(`Global index ${args[0].u32} out of bounds`);
                    pushSafe(typeStack, this.globalTypes[args[0].u32].type);
                    break;
                case WASMOPCode.op_global_set:
                    if (args[0].u32 >= num_globals) 
                        throw new RangeError(`Global index ${args[0].u32} out of bounds`);
                    if (!this.globalTypes[args[0].u32].mutable)
                        throw new RangeError(`Attempt to mutate immutable global ${args[0].u32}`);
                    __typeCheckArg(typeStack, this.globalTypes[args[0].u32].type);
                    break;
                case WASMOPCode.op_call: {
                    const idx = args[0].u32;
                    if (idx >= num_funcs)
                        throw new RangeError(`Function index ${idx} out of bounds`);
                    const funcType = this.section1.content[this.funcTypes[idx]];
                    for (let i = funcType.args.length; i > 0; --i)
                        __typeCheckArg(typeStack, funcType.args[i - 1]);
                    pushSafe(typeStack, funcType.ret);
                    break;
                }
                case WASMOPCode.op_call_indirect: {
                    if (this.tableCount === 0)
                        throw new RangeError(`No vtables to access`);
                    const typeidx = args[0].u32;
                    if (typeidx >= this.section1.content.length)
                        throw new RangeError(`Type index ${typeidx} out of bounds`);
                    __typeCheckArg(typeStack, WASMValueType.i32);
                    const funcType = this.section1.content[typeidx];
                    for (let i = funcType.args.length; i > 0; --i)
                        __typeCheckArg(typeStack, funcType.args[i - 1]);
                    pushSafe(typeStack, funcType.ret);
                    break;
                }
                case WASMOPCode.op_br_if:
                    __typeCheckArg(typeStack, WASMValueType.i32);
                case WASMOPCode.op_br: {
                    if (args[0].u32 >= block_types.length)
                        throw new RangeError(`Invalid block depth ${args[0].u32}`); 
                    const blockType = block_types[block_types.length - 1 - args[0].u32];
                    __typeCheckArg(typeStack, blockType);
                    if (instr.instr === WASMOPCode.op_br) return;
                    pushSafe(typeStack, blockType);
                    break;
                }
                case WASMOPCode.op_br_table: {
                    //error need to check for each individual
                    __typeCheckArg(typeStack, WASMValueType.i32);
                    const blockType = block_types[block_types.length - 1 - args[1].u32];
                    for (let i = 1; i < args.length; ++i) 
                        if (blockType !== block_types[block_types.length - 1 - args[i].u32])
                            throw new TypeError(`Block type mismatch`);

                    __typeCheckArg(typeStack, blockType);
                    return;
                }
                case WASMOPCode.op_if:
                    block_types.push(args[0].u32);
                    __typeCheckArg(typeStack, WASMValueType.i32);
                    this.__validateCodeBlockRecursive(instr.child, locals, block_types, args[0].u32, func_return);
                    if (instr.hasElse)
                        this.__validateCodeBlockRecursive(instr.child2, locals, block_types, args[0].u32, func_return);
                    pushSafe(typeStack, args[0].u32);
                    block_types.pop();
                    break;
                case WASMOPCode.op_drop:
                    if (typeStack.length === 0)
                        throw new RangeError(`Expected at least 1 value on stack for drop, got 0`);
                    typeStack.pop();
                    break;
                case WASMOPCode.op_loop:
                    //the block type itself should be nil because all branches go back to it
                    block_types.push(WASMValueType.nil);
                    this.__validateCodeBlockRecursive(instr.child, locals, block_types, args[0].u32, func_return);
                    pushSafe(typeStack, args[0].u32);
                    block_types.pop();
                    break;
                case WASMOPCode.op_block:
                    block_types.push(args[0].u32);
                    this.__validateCodeBlockRecursive(instr.child, locals, block_types, args[0].u32, func_return);
                    pushSafe(typeStack, args[0].u32);
                    block_types.pop();
                    break;
                case WASMOPCode.op_unreachable:
                    //silent return on unreachable, no need to deal with anything past
                    //ignores typechecking in block past the unreachable
                    return;
                case WASMOPCode.op_return:
                    __typeCheckResult(typeStack, func_return);
                    return;
                case WASMOPCode.op_select: {
                    __typeCheckArg(typeStack, WASMValueType.i32);
                    if (typeStack.length < 2)
                        throw new RangeError(`Expected at least 2 values on stack for select, got ${typeStack.length}`);
                    const t1 = typeStack.pop();
                    const t2 = typeStack.pop();
                    if (t1 !== t2 || t1 == undefined)
                        throw new RangeError(`Select operands ${t1} and ${t2} do not match`);
                    pushSafe(typeStack, t1);
                    break;
                }
                default: {
                    const instrDef = WASMOPDefs[instr.instr];
                    if (typeStack.length < instrDef.args.length)
                        throw new RangeError(`Expected at least ${instrDef.args.length} values on stack for ${instr.instr}, got ${typeStack.length}`);
                    for (let i = instrDef.args.length; i > 0; --i)
                        __typeCheckArg(typeStack, instrDef.args[i - 1])

                    pushSafe(typeStack, instrDef.ret);
                    break;
                }

            }
        }
        __typeCheckResult(typeStack, result_type);
    }
    
    validateCodeBlock(code : Array<InstrNode>, locals : Array<WASMValueType>, result_type : WASMValueType) : void {
        const block_types : Array<WASMValueType> = [];
        this.__validateCodeBlockRecursive(code, locals, block_types, result_type, result_type);
    }
}