import { InstrNode, WASMValue } from "../spec/Code";
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
} from "../spec/sections";
import { WASMGlobalType, WASMValueType } from "../spec/types";

function __typeCheckArg(stack : Array<WASMValueType>, check : WASMValueType) : void {
    if (check === WASMValueType.nil) {
        if (stack.length === 0) return;
        throw new Error(`Expected empty stack, got ${stack.length}`);
    }
    const top = stack.pop();
    if (top === undefined)
        throw new Error(`Impossible`);
    if (top !== check)
        throw new Error(`Type mismatch: expected ${check}, got ${top}`);
}

function __typeCheckResult(stack : Array<WASMValueType>, check : WASMValueType) : void {
    if (check === WASMValueType.nil) {
        if (stack.length === 0) return;
        throw new Error(`Expected empty stack, got ${stack.length}`);
    }
    else if (stack.length !== 1)
        throw new Error(`Error on return, expected 1 argument on stack, got ${stack.length}`);
    const top = stack[0];
    if (top === undefined)
        throw new Error(`Impossible`);
    if (top !== check)
        throw new Error(`Type mismatch: expected ${check}, got ${top}`);
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
                throw new Error("Invalid data count " + this.section12.dataCount + " | " + this.section11.content.length);
            }
        }
        if (this.has_section(3)) {
            if (!this.has_section(1)) 
                throw new Error("Missing functype section");
            for (let i = 0; i < this.funcTypes.length; ++i) {
                if (this.funcTypes[i] >= this.section1.content.length)
                    throw new Error("Invalid functype for $func" + i + " of " + this.funcTypes[i]);
            }
        }
        if (this.has_section(10)) {
            if (this.section10.content.length !== this.section3.content.length)
                throw new Error(`Function count mismatch: ${this.section3.content.length} declared, ${this.section10.content.length} iniialized`);
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
                throw new Error(`Start function ${idx} out of bounds`);
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
                        if (this.globalTypes[exp.index].mutable === false)
                            throw new Error(`Exported global ${exp.index} immutable`);
                        break;
                    default:
                        throw new Error(`Shouldn't happen`);
                }
            }
        }
        //error need to check for constexprs
        if (this.memoryCount > 1)
            throw new Error(`${this.memoryCount} memory declarations present, only at most one allowed`);
    }

    __validateCodeBlockRecursive(
        code : Array<InstrNode>, 
        locals : Array<WASMValueType>,
        block_types : Array<WASMValueType>,
        result_type : WASMValueType,
        func_return : WASMValueType
    ) : void {
        const type_stack : Array<WASMValueType> = [];
        const num_locals = locals.length;
        const num_globals = this.globalTypes.length;
        const num_funcs = this.funcTypes.length;
        for (const instr of code) {
            const args = instr.immediates;
            switch (instr.instr) {
                case WASMOPCode.op_local_get:
                    if (args[0].u32 >= num_locals)
                        throw new Error(`Local index ${args[0].u32} out of bounds`);
                    type_stack.push(locals[args[0].u32]);
                    break;
                case WASMOPCode.op_local_set:
                    if (args[0].u32 >= num_locals)
                        throw new Error(`Local index ${args[0].u32} out of bounds`);
                    __typeCheckArg(type_stack, locals[args[0].u32]);
                    break;
                case WASMOPCode.op_local_tee:
                    if (args[0].u32 >= num_locals)
                        throw new Error(`Local index ${args[0].u32} out of bounds`);
                    __typeCheckArg(type_stack, locals[args[0].u32]);
                    type_stack.push(locals[args[0].u32]);
                    break;
                case WASMOPCode.op_global_get:
                    if (args[0].u32 >= num_globals) 
                        throw new Error(`Global index ${args[0].u32} out of bounds`);
                    type_stack.push(this.globalTypes[args[0].u32].type);
                    break;
                case WASMOPCode.op_global_set:
                    if (args[0].u32 >= num_globals) 
                        throw new Error(`Global index ${args[0].u32} out of bounds`);
                    if (!this.globalTypes[args[0].u32].mutable)
                        throw new Error(`Attempt to mutate immutable global ${args[0].u32}`);
                    __typeCheckArg(type_stack, this.globalTypes[args[0].u32].type);
                    break;
                case WASMOPCode.op_call: {
                    const idx = args[0].u32;
                    if (idx >= num_funcs)
                        throw new Error(`Function index ${idx} out of bounds`);
                    const funcType = this.section1.content[this.funcTypes[idx]];
                    for (let i = funcType.args.length; i > 0; --i)
                        __typeCheckArg(type_stack, funcType.args[i - 1]);
                    if (funcType.ret !== WASMValueType.nil)
                        type_stack.push(funcType.ret);
                    break;
                }
                case WASMOPCode.op_call_indirect: {
                    if (this.tableCount === 0)
                        throw new Error(`No vtables to access`);
                    const typeidx = args[0].u32;
                    if (typeidx >= this.section1.content.length)
                        throw new Error(`Type index ${typeidx} out of bounds`);
                    __typeCheckArg(type_stack, WASMValueType.i32);
                    const funcType = this.section1.content[typeidx];
                    for (let i = funcType.args.length; i > 0; --i)
                        __typeCheckArg(type_stack, funcType.args[i - 1]);
                    if (funcType.ret !== WASMValueType.nil)
                        type_stack.push(funcType.ret);
                    break;
                }
                case WASMOPCode.op_br_if:
                    __typeCheckArg(type_stack, WASMValueType.i32);
                case WASMOPCode.op_br:
                    if (args[0].u32 >= block_types.length)
                        throw new Error(`Invalid block depth ${args[0].u32}`);
                    __typeCheckResult(type_stack, block_types[block_types.length - 1 - args[0].u32]);
                    if (instr.instr === WASMOPCode.op_br) return;
                    break;
                case WASMOPCode.op_br_table:
                    //error need to check for each individual
                    __typeCheckArg(type_stack, WASMValueType.i32);
                    __typeCheckResult(type_stack, result_type);
                    break;
                case WASMOPCode.op_if:
                    block_types.push(args[0].u32);
                    __typeCheckArg(type_stack, WASMValueType.i32);
                    this.__validateCodeBlockRecursive(instr.child, locals, block_types, args[0].u32, func_return);
                    if (instr.hasElse)
                        this.__validateCodeBlockRecursive(instr.child2, locals, block_types, args[0].u32, func_return);
                    if (args[0].u32 !== WASMValueType.nil)
                        type_stack.push(args[0].u32);
                    block_types.pop();
                    break;
                case WASMOPCode.op_drop:
                    if (type_stack.length === 0)
                        throw new Error(`Expected at least 1 value on stack for drop, got 0`);
                    type_stack.pop();
                    break;
                case WASMOPCode.op_loop:
                    block_types.push(WASMValueType.nil);
                    this.__validateCodeBlockRecursive(instr.child, locals, block_types, args[0].u32, func_return);
                    if (args[0].u32 !== WASMValueType.nil) type_stack.push(args[0].u32);
                    block_types.pop();
                    break;
                case WASMOPCode.op_block:
                    block_types.push(args[0].u32);
                    this.__validateCodeBlockRecursive(instr.child, locals, block_types, args[0].u32, func_return);
                    if (args[0].u32 !== WASMValueType.nil) type_stack.push(args[0].u32);
                    block_types.pop();
                    break;
                case WASMOPCode.op_unreachable:
                    //silent return on unreachable, no need to deal with anything past
                    return;
                case WASMOPCode.op_return:
                    __typeCheckResult(type_stack, func_return);
                    return;
                case WASMOPCode.op_select: {
                    __typeCheckArg(type_stack, WASMValueType.i32);
                    if (type_stack.length < 2)
                        throw new Error(`Expected at least 2 values on stack for select, got ${type_stack.length}`);
                    const t1 = type_stack.pop();
                    const t2 = type_stack.pop();
                    if (t1 !== t2 || t1 == undefined)
                        throw new Error(`Select operands ${t1} and ${t2} do not match`);
                    type_stack.push(t1);
                    break;
                }
                default: {
                    const instrDef = WASMOPDefs[instr.instr];
                    if (type_stack.length < instrDef.args.length)
                        throw new Error(`Expected at least ${instrDef.args.length} values for ${instr.instr}, got ${type_stack.length}`);
                    for (let i = instrDef.args.length; i > 0; --i)
                        __typeCheckArg(type_stack, instrDef.args[i - 1])

                    if (instrDef.ret !== WASMValueType.nil)
                        type_stack.push(instrDef.ret);
                    break;
                }

            }
        }
        return;
    }
    
    validateCodeBlock(code : Array<InstrNode>, locals : Array<WASMValueType>, result_type : WASMValueType) : void {
        const block_types : Array<WASMValueType> = [];
        this.__validateCodeBlockRecursive(code, locals, block_types, result_type, result_type);
    }
}