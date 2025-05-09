"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Program = void 0;
var Lexer_1 = require("../helpers/Lexer");
var Code_1 = require("../spec/Code");
var OpCode_1 = require("../spec/OpCode");
var types_1 = require("../spec/types");
var Global_1 = require("../interface/Global");
var Memory_1 = require("../interface/Memory");
var Table_1 = require("../interface/Table");
//TODO: fix fragmentation with imports
//TODO: speed up with in-place allocation
var StackFrame = /** @class */ (function () {
    function StackFrame(locals, pc) {
        this.locals = locals;
        this.pc = pc;
    }
    return StackFrame;
}());
function toTruthy(b) {
    return b ? 1 : 0;
}
function popSafe(arr) {
    if (arr.length === 0)
        throw new Error("Stack empty, cannot pop");
    var v = arr.pop();
    if (v === undefined)
        throw new Error("Won't happen");
    return v;
}
var Program = /** @class */ (function () {
    function Program(code, funcPtrs) {
        this.code = new Uint8Array(0);
        this.memory = new Memory_1.default({});
        this.funcPtrs = new Uint32Array(0);
        this.funcTypes = [];
        this.globals = [];
        this.tables = [];
        this.importedFuncs = [];
        this.importFuncCount = 0;
        this.importGlobalCount = 0;
        this.start = -1;
        this.code = code;
        this.funcPtrs = funcPtrs;
    }
    Program.prototype.initializeMemory = function (start, end) {
        this.memory = new Memory_1.default({ initial: start, maximum: end });
    };
    Program.prototype.initializeImports = function (imports, importDesc) {
        var importGlobalCount = 0;
        for (var _i = 0, importDesc_1 = importDesc; _i < importDesc_1.length; _i++) {
            var desc = importDesc_1[_i];
            var module_1 = desc.module;
            var name_1 = desc.name;
            if (typeof imports[module_1] !== "object")
                throw new Error("Imported module [".concat(module_1, "] does not exist or is not an object"));
            switch (desc.kind) {
                case 0: {
                    //func
                    var func = imports[module_1][name_1];
                    if (!(func instanceof Function))
                        throw new Error("Invalid import ".concat(module_1, ".").concat(name_1, ": expected function"));
                    this.importedFuncs.push(func);
                    break;
                }
                case 1: {
                    var table = imports[module_1][name_1];
                    if (!(table instanceof Table_1.default))
                        throw new Error("Invalid import ".concat(module_1, ".").concat(name_1, ": expected WebAssembly.table"));
                    this.tables.push(table);
                    break;
                }
                case 2: {
                    //memory, we assume there is only 1
                    var mem = imports[module_1][name_1];
                    if (!(mem instanceof Memory_1.default))
                        throw new Error("Invalid import ".concat(module_1, ".").concat(name_1, ": expected WebAssembly.Memory"));
                    if (mem.init !== desc.limits.min)
                        throw new Error("Imported memory initial size wrong");
                    if (mem.max !== desc.limits.max)
                        throw new Error("Imported memory maximum size wrong");
                    this.memory = mem;
                    break;
                }
                case 3: {
                    //global
                    var glob = imports[module_1][name_1];
                    if (!(glob instanceof Global_1.WASMGlobalImport))
                        throw new Error("Invalid import ".concat(module_1, ".").concat(name_1, ": expected WebAssembly.Global"));
                    if (glob._value.type !== desc.type)
                        throw new Error("Imported global type mismatch");
                    ++importGlobalCount;
                    this.globals.unshift(glob._value);
                    break;
                }
                default:
                    throw new Error("Unexpected import type");
                    break;
            }
        }
        if (this.importFuncCount !== this.importedFuncs.length)
            throw new Error("Function import count mismatch: expected ".concat(this.importFuncCount, ", got ").concat(this.importedFuncs.length));
        if (this.importGlobalCount !== importGlobalCount)
            throw new Error("Global import count mismatch: expected ".concat(this.importGlobalCount, ", got ").concat(importGlobalCount));
    };
    Program.prototype.initializeTables = function (tableDesc) {
        for (var _i = 0, tableDesc_1 = tableDesc; _i < tableDesc_1.length; _i++) {
            var desc = tableDesc_1[_i];
            this.tables.push(new Table_1.default({ initial: desc.limit.min, maximum: desc.limit.max }));
        }
    };
    Program.prototype.run = function (entry, args) {
        var _a;
        if (entry < 0 || entry >= this.funcPtrs.length + this.importFuncCount)
            throw new Error("Invalid function index");
        if (entry < this.importFuncCount) {
            console.warn("Attempting to start with an imported function: returning 0 for now");
            return 0; //import function call?
        }
        var reader = new Lexer_1.FixedLengthReader(this.code);
        reader.at = this.funcPtrs[entry - this.importFuncCount];
        var valueStack = [];
        var callStack = [];
        var argC = reader.read_u32();
        var localC = reader.read_u32();
        var locals = new Array(argC + localC);
        if (argC !== args.length)
            throw new Error("Invalid number of arguments");
        for (var i = 0; i < argC; ++i) {
            if (this.funcTypes[entry].args[i] !== args[i].type)
                throw new Error("Invalid initial argument type");
            locals[i] = args[i];
            //check arg type
        }
        while (true) {
            var instr = reader.read_u8();
            switch (instr) {
                case OpCode_1.WASMOPCode.op_unreachable:
                    throw new Error("Unreachable");
                    break;
                case OpCode_1.WASMOPCode.op_drop:
                    popSafe(valueStack);
                    break;
                case OpCode_1.WASMOPCode.op_return: {
                    if (callStack.length === 0) {
                        if (this.funcTypes[entry].ret !== types_1.WASMValueType.nil) {
                            if (valueStack.length !== 1)
                                throw new Error("Stack size not exactly 1");
                            var retval = valueStack.pop();
                            return retval === null || retval === void 0 ? void 0 : retval.numeric;
                        }
                        if (valueStack.length !== 0)
                            throw new Error("Stack expected to be empty");
                        return;
                    }
                    else {
                        var frame = callStack.pop();
                        frame !== undefined &&
                            (locals = frame.locals) &&
                            (reader.at = frame.pc);
                    }
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_const:
                    valueStack.push(Code_1.WASMValue.createI32Literal(reader.read_i32()));
                    break;
                case OpCode_1.WASMOPCode.op_f32_const:
                    valueStack.push(Code_1.WASMValue.createF32Literal(reader.read_f32()));
                    break;
                case OpCode_1.WASMOPCode.op_i64_const:
                    valueStack.push(Code_1.WASMValue.createI64Literal(reader.read_i64()));
                    break;
                case OpCode_1.WASMOPCode.op_f64_const:
                    valueStack.push(Code_1.WASMValue.createF64Literal(reader.read_f64()));
                    break;
                case OpCode_1.WASMOPCode.op_i32_add: {
                    var y = popSafe(valueStack);
                    var x = popSafe(valueStack);
                    valueStack.push(Code_1.WASMValue.createI32Literal(x.i32 + y.i32));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_sub: {
                    var y = popSafe(valueStack);
                    var x = popSafe(valueStack);
                    valueStack.push(Code_1.WASMValue.createI32Literal(x.i32 - y.i32));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_mul: {
                    var y = popSafe(valueStack);
                    var x = popSafe(valueStack);
                    valueStack.push(Code_1.WASMValue.createI32Literal(x.i32 * y.i32));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_div_s: {
                    var y = popSafe(valueStack);
                    var x = popSafe(valueStack);
                    valueStack.push(Code_1.WASMValue.createI32Literal((x.i32 / y.i32) | 0));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_div_u: {
                    var y = popSafe(valueStack);
                    var x = popSafe(valueStack);
                    valueStack.push(Code_1.WASMValue.createI32Literal(Math.trunc(x.u32 / y.u32)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_add: {
                    var y = popSafe(valueStack);
                    var x = popSafe(valueStack);
                    valueStack.push(Code_1.WASMValue.createF64Literal(x.f64 + y.f64));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_sub: {
                    var y = popSafe(valueStack);
                    var x = popSafe(valueStack);
                    valueStack.push(Code_1.WASMValue.createF64Literal(x.f64 - y.f64));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_mul: {
                    var y = popSafe(valueStack);
                    var x = popSafe(valueStack);
                    valueStack.push(Code_1.WASMValue.createF64Literal(x.f64 * y.f64));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_div: {
                    var y = popSafe(valueStack);
                    var x = popSafe(valueStack);
                    valueStack.push(Code_1.WASMValue.createF64Literal(x.f64 / y.f64));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_lt: {
                    var y = popSafe(valueStack);
                    var x = popSafe(valueStack);
                    valueStack.push(Code_1.WASMValue.createI32Literal(toTruthy(x.f64 < y.f64)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_call: {
                    var funcIdx = reader.read_u32();
                    if (funcIdx < this.importFuncCount) {
                        //imported func call
                        var argArr = new Array(this.funcTypes[funcIdx].args.length);
                        for (var i = argArr.length; i > 0; --i)
                            argArr[i - 1] = popSafe(valueStack).numeric;
                        var ret = (_a = this.importedFuncs)[funcIdx].apply(_a, argArr);
                        switch (this.funcTypes[funcIdx].ret) {
                            case types_1.WASMValueType.i32:
                                valueStack.push(Code_1.WASMValue.createI32Literal(ret));
                                break;
                            case types_1.WASMValueType.f32:
                                valueStack.push(Code_1.WASMValue.createF32Literal(ret));
                                break;
                            case types_1.WASMValueType.i64:
                                valueStack.push(Code_1.WASMValue.createI64Literal(BigInt(ret)));
                                break;
                            case types_1.WASMValueType.f64:
                                valueStack.push(Code_1.WASMValue.createF64Literal(ret));
                                break;
                            case types_1.WASMValueType.nil:
                            default:
                                break;
                        }
                        break;
                    }
                    var frame = new StackFrame(locals, reader.at);
                    callStack.push(frame);
                    reader.at = this.funcPtrs[funcIdx - this.importFuncCount];
                    var argC_1 = reader.read_u32();
                    var localC_1 = reader.read_u32();
                    locals = new Array(argC_1 + localC_1);
                    for (var i = argC_1; i > 0; --i) {
                        locals[i - 1] = popSafe(valueStack);
                    }
                    break;
                }
                case OpCode_1.WASMOPCode.op_local_get: {
                    var idx = reader.read_u32();
                    if (idx >= locals.length)
                        throw new Error("Local index OOB");
                    valueStack.push(locals[idx]);
                    break;
                }
                case OpCode_1.WASMOPCode.op_local_set: {
                    var idx = reader.read_u32();
                    if (idx >= locals.length)
                        throw new Error("Local index OOB");
                    var x = popSafe(valueStack);
                    locals[idx] = x;
                    break;
                }
                case OpCode_1.WASMOPCode.op_global_get: {
                    var idx = reader.read_u32();
                    if (idx >= this.globals.length)
                        throw new Error("Global index OOB");
                    valueStack.push(this.globals[idx]);
                    break;
                }
                case OpCode_1.WASMOPCode.op_global_set: {
                    var idx = reader.read_u32();
                    if (idx >= this.globals.length)
                        throw new Error("Global index OOB");
                    var x = popSafe(valueStack);
                    this.globals[idx].set(x);
                    break;
                }
                case OpCode_1.WASMOPCode.op_br: {
                    var idx = reader.read_u32();
                    reader.at = idx;
                    break;
                }
                case OpCode_1.WASMOPCode.op_br_if: {
                    var idx = reader.read_u32();
                    var x = popSafe(valueStack);
                    if (x.i32 !== 0)
                        reader.at = idx;
                    break;
                }
                case OpCode_1.WASMOPCode.op_if: {
                    var idx = reader.read_u32();
                    var x = popSafe(valueStack);
                    if (x.i32 === 0)
                        reader.at = idx;
                    break;
                }
            }
        }
        return 0;
    };
    return Program;
}());
exports.Program = Program;
