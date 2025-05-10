"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var OpCode_1 = require("../spec/OpCode");
var sections_1 = require("../spec/sections");
var types_1 = require("../spec/types");
function __typeCheckArg(stack, check) {
    if (check === types_1.WASMValueType.nil) {
        if (stack.length === 0)
            return;
        throw new Error("Expected empty stack, got ".concat(stack.length));
    }
    var top = stack.pop();
    if (top === undefined)
        throw new Error("Impossible");
    if (top !== check)
        throw new Error("Type mismatch: expected ".concat((0, types_1.typeToString)(check), ", got ").concat((0, types_1.typeToString)(top)));
}
function __typeCheckResult(stack, check) {
    if (check === types_1.WASMValueType.nil) {
        if (stack.length === 0)
            return;
        throw new Error("Expected empty stack, got ".concat(stack.length));
    }
    else if (stack.length !== 1)
        throw new Error("Error on return, expected 1 argument on stack, got ".concat(stack.length));
    var top = stack[0];
    if (top === undefined)
        throw new Error("Impossible");
    if (top !== check)
        throw new Error("Type mismatch: expected ".concat((0, types_1.typeToString)(check), ", got ").concat((0, types_1.typeToString)(top)));
}
var WASMRepr = /** @class */ (function () {
    function WASMRepr() {
        this.funcTypes = [];
        this.globalTypes = [];
        this.importFunc = 0;
        this.importGlobal = 0;
        this.tableCount = 0;
        this.memoryCount = 0;
        this.section1 = new sections_1.WASMSection();
        this.section2 = new sections_1.WASMSection();
        this.section3 = new sections_1.WASMSection();
        this.section4 = new sections_1.WASMSection();
        this.section5 = new sections_1.WASMSection();
        this.section6 = new sections_1.WASMSection();
        this.section7 = new sections_1.WASMSection();
        this.section8 = new sections_1.WASMSection8Content();
        this.section9 = new sections_1.WASMSection();
        this.section10 = new sections_1.WASMSection();
        this.section11 = new sections_1.WASMSection();
        this.section12 = new sections_1.WASMSection12Content();
        this.sectionLengths = new Array(13).fill(0);
    }
    WASMRepr.prototype.has_section = function (sec) {
        return this.sectionLengths[sec] !== 0;
    };
    WASMRepr.prototype.validate = function () {
        if (this.has_section(12) && this.has_section(11)) {
            if (this.section12.dataCount !== this.section11.content.length) {
                throw new Error("Invalid data count, expected ".concat(this.section12.dataCount, ", got ").concat(this.section11.content.length));
            }
        }
        if (this.has_section(3)) {
            if (!this.has_section(1))
                throw new Error("Missing functype section");
            for (var i = 0; i < this.funcTypes.length; ++i) {
                if (this.funcTypes[i] >= this.section1.content.length)
                    throw new Error("Invalid functype ".concat(this.funcTypes[i], " for $func").concat(i));
            }
        }
        if (this.has_section(10)) {
            if (this.section10.content.length !== this.section3.content.length)
                throw new Error("Function count mismatch: ".concat(this.section3.content.length, " declared, ").concat(this.section10.content.length, " iniialized"));
            //typecheck and check for out-of-bound function, local, and global references
            for (var i = 0; i < this.section10.content.length; ++i) {
                var content = this.section10.content[i];
                var locals = [];
                var typeDef = this.section1.content[this.section3.content[i].index];
                for (var i_1 = 0; i_1 < typeDef.args.length; ++i_1)
                    locals.push(typeDef.args[i_1]);
                for (var i_2 = 0; i_2 < content.locals.length; ++i_2)
                    for (var j = 0; j < content.locals[i_2].count; ++j)
                        locals.push(content.locals[i_2].type);
                this.validateCodeBlock(content.code, locals, typeDef.ret);
            }
        }
        if (this.has_section(8)) {
            var idx = this.section8.index;
            if (idx < this.importFunc)
                throw new Error("Start function ".concat(idx, " is an import"));
            else if (idx >= this.funcTypes.length)
                throw new Error("Start function ".concat(idx, " out of bounds"));
            var funcType = this.section1.content[this.funcTypes[idx]];
            if (funcType.args.length !== 0 || funcType.ret !== types_1.WASMValueType.nil)
                throw new Error("Start function must not take or return values");
        }
        if (this.has_section(7)) {
            for (var _i = 0, _a = this.section7.content; _i < _a.length; _i++) {
                var exp = _a[_i];
                switch (exp.kind) {
                    case 0:
                        if (exp.index >= this.funcTypes.length)
                            throw new Error("Exported function ".concat(exp.index, " out of range"));
                        break;
                    case 1:
                        if (exp.index >= this.tableCount)
                            throw new Error("Exported table ".concat(exp.index, " out of range"));
                        break;
                    case 2:
                        if (exp.index >= this.memoryCount)
                            throw new Error("Exported memory ".concat(exp.index, " out of range"));
                        break;
                    case 3:
                        if (exp.index >= this.globalTypes.length)
                            throw new Error("Exported global ".concat(exp.index, " out of range"));
                        if (this.globalTypes[exp.index].mutable === false)
                            throw new Error("Exported global ".concat(exp.index, " immutable"));
                        break;
                    default:
                        throw new Error("Shouldn't happen");
                }
            }
        }
        //error need to check for constexprs
        if (this.memoryCount > 1)
            throw new Error("".concat(this.memoryCount, " memory declarations present, only at most one allowed"));
    };
    WASMRepr.prototype.__validateCodeBlockRecursive = function (code, locals, block_types, result_type, func_return) {
        var typeStack = [];
        var num_locals = locals.length;
        var num_globals = this.globalTypes.length;
        var num_funcs = this.funcTypes.length;
        for (var _i = 0, code_1 = code; _i < code_1.length; _i++) {
            var instr = code_1[_i];
            var args = instr.immediates;
            switch (instr.instr) {
                case OpCode_1.WASMOPCode.op_local_get:
                    if (args[0].u32 >= num_locals)
                        throw new Error("Local index ".concat(args[0].u32, " out of bounds"));
                    typeStack.push(locals[args[0].u32]);
                    break;
                case OpCode_1.WASMOPCode.op_local_set:
                    if (args[0].u32 >= num_locals)
                        throw new Error("Local index ".concat(args[0].u32, " out of bounds"));
                    __typeCheckArg(typeStack, locals[args[0].u32]);
                    break;
                case OpCode_1.WASMOPCode.op_local_tee:
                    if (args[0].u32 >= num_locals)
                        throw new Error("Local index ".concat(args[0].u32, " out of bounds"));
                    __typeCheckArg(typeStack, locals[args[0].u32]);
                    typeStack.push(locals[args[0].u32]);
                    break;
                case OpCode_1.WASMOPCode.op_global_get:
                    if (args[0].u32 >= num_globals)
                        throw new Error("Global index ".concat(args[0].u32, " out of bounds"));
                    typeStack.push(this.globalTypes[args[0].u32].type);
                    break;
                case OpCode_1.WASMOPCode.op_global_set:
                    if (args[0].u32 >= num_globals)
                        throw new Error("Global index ".concat(args[0].u32, " out of bounds"));
                    if (!this.globalTypes[args[0].u32].mutable)
                        throw new Error("Attempt to mutate immutable global ".concat(args[0].u32));
                    __typeCheckArg(typeStack, this.globalTypes[args[0].u32].type);
                    break;
                case OpCode_1.WASMOPCode.op_call: {
                    var idx = args[0].u32;
                    if (idx >= num_funcs)
                        throw new Error("Function index ".concat(idx, " out of bounds"));
                    var funcType = this.section1.content[this.funcTypes[idx]];
                    for (var i = funcType.args.length; i > 0; --i)
                        __typeCheckArg(typeStack, funcType.args[i - 1]);
                    if (funcType.ret !== types_1.WASMValueType.nil)
                        typeStack.push(funcType.ret);
                    break;
                }
                case OpCode_1.WASMOPCode.op_call_indirect: {
                    if (this.tableCount === 0)
                        throw new Error("No vtables to access");
                    var typeidx = args[0].u32;
                    if (typeidx >= this.section1.content.length)
                        throw new Error("Type index ".concat(typeidx, " out of bounds"));
                    __typeCheckArg(typeStack, types_1.WASMValueType.i32);
                    var funcType = this.section1.content[typeidx];
                    for (var i = funcType.args.length; i > 0; --i)
                        __typeCheckArg(typeStack, funcType.args[i - 1]);
                    if (funcType.ret !== types_1.WASMValueType.nil)
                        typeStack.push(funcType.ret);
                    break;
                }
                case OpCode_1.WASMOPCode.op_br_if:
                    __typeCheckArg(typeStack, types_1.WASMValueType.i32);
                case OpCode_1.WASMOPCode.op_br:
                    if (args[0].u32 >= block_types.length)
                        throw new Error("Invalid block depth ".concat(args[0].u32));
                    __typeCheckResult(typeStack, block_types[block_types.length - 1 - args[0].u32]);
                    if (instr.instr === OpCode_1.WASMOPCode.op_br)
                        return;
                    break;
                case OpCode_1.WASMOPCode.op_br_table:
                    //error need to check for each individual
                    __typeCheckArg(typeStack, types_1.WASMValueType.i32);
                    __typeCheckResult(typeStack, result_type);
                    for (var i = 1; i < args.length; ++i)
                        __typeCheckResult(typeStack, block_types[block_types.length - 1 - args[i].u32]);
                    break;
                case OpCode_1.WASMOPCode.op_if:
                    block_types.push(args[0].u32);
                    __typeCheckArg(typeStack, types_1.WASMValueType.i32);
                    this.__validateCodeBlockRecursive(instr.child, locals, block_types, args[0].u32, func_return);
                    if (instr.hasElse)
                        this.__validateCodeBlockRecursive(instr.child2, locals, block_types, args[0].u32, func_return);
                    if (args[0].u32 !== types_1.WASMValueType.nil)
                        typeStack.push(args[0].u32);
                    block_types.pop();
                    break;
                case OpCode_1.WASMOPCode.op_drop:
                    if (typeStack.length === 0)
                        throw new Error("Expected at least 1 value on stack for drop, got 0");
                    typeStack.pop();
                    break;
                case OpCode_1.WASMOPCode.op_loop:
                    block_types.push(types_1.WASMValueType.nil);
                    this.__validateCodeBlockRecursive(instr.child, locals, block_types, args[0].u32, func_return);
                    if (args[0].u32 !== types_1.WASMValueType.nil)
                        typeStack.push(args[0].u32);
                    block_types.pop();
                    break;
                case OpCode_1.WASMOPCode.op_block:
                    block_types.push(args[0].u32);
                    this.__validateCodeBlockRecursive(instr.child, locals, block_types, args[0].u32, func_return);
                    if (args[0].u32 !== types_1.WASMValueType.nil)
                        typeStack.push(args[0].u32);
                    block_types.pop();
                    break;
                case OpCode_1.WASMOPCode.op_unreachable:
                    //silent return on unreachable, no need to deal with anything past
                    //ignores typechecking in block past the unreachable
                    return;
                case OpCode_1.WASMOPCode.op_return:
                    __typeCheckResult(typeStack, func_return);
                    return;
                case OpCode_1.WASMOPCode.op_select: {
                    __typeCheckArg(typeStack, types_1.WASMValueType.i32);
                    if (typeStack.length < 2)
                        throw new Error("Expected at least 2 values on stack for select, got ".concat(typeStack.length));
                    var t1 = typeStack.pop();
                    var t2 = typeStack.pop();
                    if (t1 !== t2 || t1 == undefined)
                        throw new Error("Select operands ".concat(t1, " and ").concat(t2, " do not match"));
                    typeStack.push(t1);
                    break;
                }
                default: {
                    var instrDef = OpCode_1.WASMOPDefs[instr.instr];
                    if (typeStack.length < instrDef.args.length)
                        throw new Error("Expected at least ".concat(instrDef.args.length, " values for ").concat(instr.instr, ", got ").concat(typeStack.length));
                    for (var i = instrDef.args.length; i > 0; --i)
                        __typeCheckArg(typeStack, instrDef.args[i - 1]);
                    if (instrDef.ret !== types_1.WASMValueType.nil)
                        typeStack.push(instrDef.ret);
                    break;
                }
            }
        }
        __typeCheckResult(typeStack, result_type);
    };
    WASMRepr.prototype.validateCodeBlock = function (code, locals, result_type) {
        var block_types = [];
        this.__validateCodeBlockRecursive(code, locals, block_types, result_type, result_type);
    };
    return WASMRepr;
}());
exports.default = WASMRepr;
