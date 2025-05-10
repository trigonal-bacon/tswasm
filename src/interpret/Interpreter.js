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
var Convert_1 = require("./Convert");
var ConstEval_1 = require("./ConstEval");
var Math_1 = require("../helpers/Math");
var Conversion_1 = require("../helpers/Conversion");
//TODO: speed up with in-place allocation
//TODO: speed up memory instructions
function toConvert(src, ptr, size) {
    Conversion_1.CONVERSION_UINT8.set(src.subarray(ptr, ptr + size), 0);
}
function fromConvert(src, ptr, size) {
    src.set(Conversion_1.CONVERSION_UINT8.subarray(0, size), ptr);
}
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
function pushSafe(arr, v) {
    if (v === undefined)
        throw new Error("Won't happen ".concat(v, ", ").concat(arr));
    arr.push(v);
}
function popSafe(arr) {
    if (arr.length === 0)
        throw new Error("Stack empty, cannot pop");
    var v = arr.pop();
    if (v === undefined)
        throw new Error("Won't happen ".concat(v, ", ").concat(arr));
    return v;
}
function readFuncPtr(reader, idx) {
    reader.at = idx * 4;
    return reader.read_u32();
}
var Program = /** @class */ (function () {
    function Program(repr, imports) {
        var _this = this;
        this.code = new Uint8Array(0);
        this.memory = new Memory_1.default({});
        this.funcTypes = [];
        this.globals = [];
        this.tables = [];
        this.importedFuncs = [];
        this.importFuncCount = 0;
        this.importGlobalCount = 0;
        this.funcCount = 0;
        this.exports = {};
        this.code = (0, Convert_1.convertToExecForm)(repr);
        this.importFuncCount = repr.importFunc;
        this.importGlobalCount = repr.importGlobal;
        if (repr.has_section(1))
            //functypes
            this.funcTypes = repr.funcTypes.map(function (idx) { return repr.section1.content[idx]; });
        if (repr.has_section(2))
            //imports
            this.initializeImports(imports, repr.section2.content);
        if (repr.has_section(3))
            //functions
            this.funcCount = repr.section3.content.length;
        if (repr.has_section(4))
            //tables
            this.initializeTables(repr.section4.content);
        if (repr.has_section(5)) {
            //memory
            var minPages = 0;
            var maxPages = 0;
            for (var _i = 0, _a = repr.section5.content; _i < _a.length; _i++) {
                var memory = _a[_i];
                minPages = memory.min;
                maxPages = Math.max(memory.max, memory.min);
            }
            this.initializeMemory(minPages, maxPages);
        }
        if (repr.has_section(6)) {
            //globals
            for (var _b = 0, _c = repr.section6.content; _b < _c.length; _b++) {
                var glob = _c[_b];
                this.globals.push((0, ConstEval_1.default)(glob.expr));
            }
        }
        if (repr.has_section(9)) {
            //elems
            if (this.tables.length === 0)
                throw new Error("Expected a table initialization");
            for (var _d = 0, _e = repr.section9.content; _d < _e.length; _d++) {
                var elem = _e[_d];
                //using passive tables
                var offset = (0, ConstEval_1.default)(elem.offset).u32;
                if (offset + elem.funcrefs.length > this.tables[0].length)
                    throw new Error("Out of Bounds element initialization");
                for (var i = 0; i < elem.funcrefs.length; ++i)
                    this.tables[0].elements[i + offset] = elem.funcrefs[i];
            }
        }
        if (repr.has_section(11)) {
            //data
            for (var _f = 0, _g = repr.section11.content; _f < _g.length; _f++) {
                var data = _g[_f];
                var offset = (0, ConstEval_1.default)(data.offset).u32;
                if (offset + data.data.length > this.memory.length)
                    throw new Error("Out of bounds data initialization");
                this.memory._buffer.set(data.data, offset);
            }
        }
        if (repr.has_section(7)) {
            var _loop_1 = function (exp) {
                switch (exp.kind) {
                    case 0: {
                        var funcType_1 = this_1.funcTypes[exp.index];
                        var numIters_1 = funcType_1.args.length;
                        var exportFuncWrapper = function () {
                            var args = [];
                            for (var _i = 0; _i < arguments.length; _i++) {
                                args[_i] = arguments[_i];
                            }
                            var passedOn = [];
                            for (var i = 0; i < numIters_1; ++i) {
                                switch (funcType_1.args[i]) {
                                    case types_1.WASMValueType.i32:
                                        passedOn.push(Code_1.WASMValue.createI32Literal(args[i]));
                                        break;
                                    case types_1.WASMValueType.f32:
                                        passedOn.push(Code_1.WASMValue.createF32Literal(args[i]));
                                        break;
                                    case types_1.WASMValueType.i64:
                                        passedOn.push(Code_1.WASMValue.createI64Literal(BigInt(args[i])));
                                        break;
                                    case types_1.WASMValueType.f64:
                                        passedOn.push(Code_1.WASMValue.createF64Literal(args[i]));
                                        break;
                                }
                            }
                            return _this.run(exp.index, passedOn);
                        };
                        this_1.exports[exp.name] = exportFuncWrapper;
                        break;
                    }
                    case 1:
                        this_1.exports[exp.name] = this_1.tables[exp.index];
                        break;
                    case 2:
                        this_1.exports[exp.name] = this_1.memory;
                        break;
                    case 3:
                        this_1.exports[exp.name] = new Global_1.WASMExternalGlobal({});
                        this_1.exports[exp.name]._value = this_1.globals[exp.index];
                        break;
                    default:
                        break;
                }
            };
            var this_1 = this;
            //exports
            for (var _h = 0, _j = repr.section7.content; _h < _j.length; _h++) {
                var exp = _j[_h];
                _loop_1(exp);
            }
        }
        if (repr.has_section(8)) {
            //start
            this.run(repr.section8.index, []);
        }
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
                    if (!(glob instanceof Global_1.WASMExternalGlobal))
                        throw new Error("Invalid import ".concat(module_1, ".").concat(name_1, ": expected WebAssembly.Global"));
                    if (glob._value.type !== desc.type)
                        throw new Error("Imported global type mismatch");
                    ++importGlobalCount;
                    this.globals.push(glob._value);
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
        var _a, _b;
        if (entry < 0 || entry >= this.funcCount + this.importFuncCount)
            throw new Error("Invalid function index");
        if (entry < this.importFuncCount) {
            console.warn("Attempting to start with an imported function: returning 0 for now");
            return 0; //import function call?
        }
        var reader = new Lexer_1.FixedLengthReader(this.code);
        reader.at = readFuncPtr(reader, entry - this.importFuncCount);
        var valueStack = [];
        var callStack = [];
        var memBuf = this.memory._buffer;
        var argC = reader.read_u32();
        var localC = reader.read_u32();
        var locals = new Array(argC + localC);
        if (argC !== args.length)
            throw new Error("Expected ".concat(argC, " arguments to function call, got ").concat(args.length));
        for (var i = 0; i < argC; ++i) {
            if (this.funcTypes[entry].args[i] !== args[i].type)
                throw new Error("Function expected [".concat((0, types_1.typeArrayToString)(this.funcTypes[entry].args), "], got [").concat((0, types_1.typeArrayToString)(args.map(function (x) { return x.type; })), "]"));
            locals[i] = args[i];
        }
        for (var i = 0; i < localC; ++i)
            locals[argC + i] = new Code_1.WASMValue(); //error typecheck, won't matter
        while (true) {
            var instr = reader.read_instr();
            switch (instr) {
                case OpCode_1.WASMOPCode.op_unreachable:
                    throw new Error("Unreachable");
                case OpCode_1.WASMOPCode.op_nop:
                case OpCode_1.WASMOPCode.op_block:
                case OpCode_1.WASMOPCode.op_loop:
                    break;
                case OpCode_1.WASMOPCode.op_if: {
                    var idx = reader.read_u32();
                    var x = popSafe(valueStack).i32;
                    if (x === 0)
                        reader.at = idx;
                    break;
                }
                case OpCode_1.WASMOPCode.op_br: {
                    var idx = reader.read_u32();
                    reader.at = idx;
                    break;
                }
                case OpCode_1.WASMOPCode.op_br_if: {
                    var idx = reader.read_u32();
                    var x = popSafe(valueStack).i32;
                    if (x !== 0)
                        reader.at = idx;
                    break;
                }
                case OpCode_1.WASMOPCode.op_br_table: {
                    var x = popSafe(valueStack).i32;
                    var size = reader.read_u32();
                    var anchor = reader.at;
                    if (x >= 0 && x < size)
                        reader.at = anchor + x * 4;
                    else
                        reader.at = anchor + size * 4;
                    reader.at = reader.read_u32();
                    break;
                }
                case OpCode_1.WASMOPCode.op_return: {
                    if (callStack.length === 0) {
                        if (this.funcTypes[entry].ret !== types_1.WASMValueType.nil) {
                            if (valueStack.length !== 1)
                                throw new Error("Stack size ".concat(valueStack.length, " not exactly 1"));
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
                                pushSafe(valueStack, Code_1.WASMValue.createI32Literal(ret));
                                break;
                            case types_1.WASMValueType.f32:
                                pushSafe(valueStack, Code_1.WASMValue.createF32Literal(ret));
                                break;
                            case types_1.WASMValueType.i64:
                                pushSafe(valueStack, Code_1.WASMValue.createI64Literal(BigInt(ret)));
                                break;
                            case types_1.WASMValueType.f64:
                                pushSafe(valueStack, Code_1.WASMValue.createF64Literal(ret));
                                break;
                            case types_1.WASMValueType.nil:
                            default:
                                break;
                        }
                        break;
                    }
                    var frame = new StackFrame(locals, reader.at);
                    callStack.push(frame);
                    reader.at = readFuncPtr(reader, funcIdx - this.importFuncCount);
                    var argC_1 = reader.read_u32();
                    var localC_1 = reader.read_u32();
                    locals = new Array(argC_1 + localC_1);
                    for (var i = argC_1; i > 0; --i)
                        locals[i - 1] = popSafe(valueStack);
                    for (var i = 0; i < localC_1; ++i)
                        locals[i + argC_1] = new Code_1.WASMValue(); //error typecheck, won't matter
                    break;
                }
                case OpCode_1.WASMOPCode.op_call_indirect: {
                    var functype = reader.read_u32();
                    var tableidx = popSafe(valueStack).i32;
                    if (this.tables.length === 0)
                        throw new Error("No table to index into for call_indirect");
                    if (tableidx < 0 || tableidx >= this.tables[0].length)
                        throw new Error("Table index ".concat(tableidx, " out of bounds"));
                    var funcIdx = this.tables[0].get(tableidx);
                    if (funcIdx < this.importFuncCount) {
                        //imported func call
                        var argArr = new Array(this.funcTypes[funcIdx].args.length);
                        for (var i = argArr.length; i > 0; --i)
                            argArr[i - 1] = popSafe(valueStack).numeric;
                        var ret = (_b = this.importedFuncs)[funcIdx].apply(_b, argArr);
                        switch (this.funcTypes[funcIdx].ret) {
                            case types_1.WASMValueType.i32:
                                pushSafe(valueStack, Code_1.WASMValue.createI32Literal(ret));
                                break;
                            case types_1.WASMValueType.f32:
                                pushSafe(valueStack, Code_1.WASMValue.createF32Literal(ret));
                                break;
                            case types_1.WASMValueType.i64:
                                pushSafe(valueStack, Code_1.WASMValue.createI64Literal(BigInt(ret)));
                                break;
                            case types_1.WASMValueType.f64:
                                pushSafe(valueStack, Code_1.WASMValue.createF64Literal(ret));
                                break;
                            case types_1.WASMValueType.nil:
                            default:
                                break;
                        }
                        break;
                    }
                    var frame = new StackFrame(locals, reader.at);
                    callStack.push(frame);
                    reader.at = readFuncPtr(reader, funcIdx - this.importFuncCount);
                    var argC_2 = reader.read_u32();
                    var localC_2 = reader.read_u32();
                    locals = new Array(argC_2 + localC_2);
                    for (var i = argC_2; i > 0; --i)
                        locals[i - 1] = popSafe(valueStack);
                    for (var i = 0; i < localC_2; ++i)
                        locals[i + argC_2] = new Code_1.WASMValue(); //error typecheck, won't matter
                    break;
                }
                case OpCode_1.WASMOPCode.op_drop:
                    popSafe(valueStack);
                    break;
                case OpCode_1.WASMOPCode.op_select: {
                    var choose = popSafe(valueStack).i32;
                    var y = popSafe(valueStack);
                    var x = popSafe(valueStack);
                    if (choose !== 0)
                        pushSafe(valueStack, x);
                    else
                        pushSafe(valueStack, y);
                    break;
                }
                case OpCode_1.WASMOPCode.op_local_get: {
                    var idx = reader.read_u32();
                    if (idx >= locals.length)
                        throw new Error("Local index ".concat(idx, " OOB"));
                    pushSafe(valueStack, locals[idx]);
                    break;
                }
                case OpCode_1.WASMOPCode.op_local_set: {
                    var idx = reader.read_u32();
                    if (idx >= locals.length)
                        throw new Error("Local index ".concat(idx, " OOB"));
                    var x = popSafe(valueStack);
                    locals[idx] = x;
                    break;
                }
                case OpCode_1.WASMOPCode.op_local_tee: {
                    var idx = reader.read_u32();
                    if (idx >= locals.length)
                        throw new Error("Local index ".concat(idx, " OOB"));
                    var x = popSafe(valueStack);
                    locals[idx] = x;
                    pushSafe(valueStack, x);
                    break;
                }
                case OpCode_1.WASMOPCode.op_global_get: {
                    var idx = reader.read_u32();
                    if (idx >= this.globals.length)
                        throw new Error("Global index ".concat(idx, " OOB"));
                    pushSafe(valueStack, this.globals[idx]);
                    break;
                }
                case OpCode_1.WASMOPCode.op_global_set: {
                    var idx = reader.read_u32();
                    if (idx >= this.globals.length)
                        throw new Error("Global index ".concat(idx, " OOB"));
                    var x = popSafe(valueStack);
                    this.globals[idx].set(x);
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_load: {
                    var offset = reader.read_u32();
                    var ptr = popSafe(valueStack).i32;
                    toConvert(memBuf, ptr + offset, 4);
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(Conversion_1.CONVERSION_INT32[0]));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_load: {
                    var offset = reader.read_u32();
                    var ptr = popSafe(valueStack).i32;
                    toConvert(memBuf, ptr + offset, 8);
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(Conversion_1.CONVERSION_INT64[0]));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f32_load: {
                    var offset = reader.read_u32();
                    var ptr = popSafe(valueStack).i32;
                    toConvert(memBuf, ptr + offset, 4);
                    pushSafe(valueStack, Code_1.WASMValue.createF32Literal(Conversion_1.CONVERSION_FLOAT32[0]));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_load: {
                    var offset = reader.read_u32();
                    var ptr = popSafe(valueStack).i32;
                    toConvert(memBuf, ptr + offset, 8);
                    pushSafe(valueStack, Code_1.WASMValue.createF64Literal(Conversion_1.CONVERSION_FLOAT64[0]));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_load8_s: {
                    var offset = reader.read_u32();
                    var ptr = popSafe(valueStack).i32;
                    toConvert(memBuf, ptr + offset, 1);
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(Conversion_1.CONVERSION_INT8[0]));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_load8_u: {
                    var offset = reader.read_u32();
                    var ptr = popSafe(valueStack).i32;
                    toConvert(memBuf, ptr + offset, 1);
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(Conversion_1.CONVERSION_UINT8[0]));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_load16_s: {
                    var offset = reader.read_u32();
                    var ptr = popSafe(valueStack).i32;
                    toConvert(memBuf, ptr + offset, 2);
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(Conversion_1.CONVERSION_INT16[0]));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_load16_u: {
                    var offset = reader.read_u32();
                    var ptr = popSafe(valueStack).i32;
                    toConvert(memBuf, ptr + offset, 2);
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(Conversion_1.CONVERSION_UINT16[0]));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_load8_s: {
                    var offset = reader.read_u32();
                    var ptr = popSafe(valueStack).i32;
                    toConvert(memBuf, ptr + offset, 1);
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(BigInt(Conversion_1.CONVERSION_INT8[0])));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_load8_u: {
                    var offset = reader.read_u32();
                    var ptr = popSafe(valueStack).i32;
                    toConvert(memBuf, ptr + offset, 1);
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(BigInt(Conversion_1.CONVERSION_UINT8[0])));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_load16_s: {
                    var offset = reader.read_u32();
                    var ptr = popSafe(valueStack).i32;
                    toConvert(memBuf, ptr + offset, 2);
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(BigInt(Conversion_1.CONVERSION_INT16[0])));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_load16_u: {
                    var offset = reader.read_u32();
                    var ptr = popSafe(valueStack).i32;
                    toConvert(memBuf, ptr + offset, 2);
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(BigInt(Conversion_1.CONVERSION_UINT16[0])));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_load32_s: {
                    var offset = reader.read_u32();
                    var ptr = popSafe(valueStack).i32;
                    toConvert(memBuf, ptr + offset, 4);
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(BigInt(Conversion_1.CONVERSION_INT32[0])));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_load32_u: {
                    var offset = reader.read_u32();
                    var ptr = popSafe(valueStack).i32;
                    toConvert(memBuf, ptr + offset, 4);
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(BigInt(Conversion_1.CONVERSION_UINT32[0])));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_store: {
                    var offset = reader.read_u32();
                    var val = popSafe(valueStack).i32;
                    var ptr = popSafe(valueStack).i32;
                    Conversion_1.CONVERSION_INT32[0] = val;
                    fromConvert(memBuf, ptr + offset, 4);
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_store: {
                    var offset = reader.read_u32();
                    var val = popSafe(valueStack).i64;
                    var ptr = popSafe(valueStack).i32;
                    Conversion_1.CONVERSION_INT64[0] = val;
                    fromConvert(memBuf, ptr + offset, 8);
                    break;
                }
                case OpCode_1.WASMOPCode.op_f32_store: {
                    var offset = reader.read_u32();
                    var val = popSafe(valueStack).f32;
                    var ptr = popSafe(valueStack).i32;
                    Conversion_1.CONVERSION_FLOAT32[0] = val;
                    fromConvert(memBuf, ptr + offset, 4);
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_store: {
                    var offset = reader.read_u32();
                    var val = popSafe(valueStack).f64;
                    var ptr = popSafe(valueStack).i32;
                    Conversion_1.CONVERSION_FLOAT64[0] = val;
                    fromConvert(memBuf, ptr + offset, 8);
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_store8: {
                    var offset = reader.read_u32();
                    var val = popSafe(valueStack).i32;
                    var ptr = popSafe(valueStack).i32;
                    Conversion_1.CONVERSION_INT32[0] = val;
                    fromConvert(memBuf, ptr + offset, 1);
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_store16: {
                    var offset = reader.read_u32();
                    var val = popSafe(valueStack).i32;
                    var ptr = popSafe(valueStack).i32;
                    Conversion_1.CONVERSION_INT32[0] = val;
                    fromConvert(memBuf, ptr + offset, 2);
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_store8: {
                    var offset = reader.read_u32();
                    var val = popSafe(valueStack).i64;
                    var ptr = popSafe(valueStack).i32;
                    Conversion_1.CONVERSION_INT64[0] = val;
                    fromConvert(memBuf, ptr + offset, 1);
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_store16: {
                    var offset = reader.read_u32();
                    var val = popSafe(valueStack).i64;
                    var ptr = popSafe(valueStack).i32;
                    Conversion_1.CONVERSION_INT64[0] = val;
                    fromConvert(memBuf, ptr + offset, 2);
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_store32: {
                    var offset = reader.read_u32();
                    var val = popSafe(valueStack).i64;
                    var ptr = popSafe(valueStack).i32;
                    Conversion_1.CONVERSION_INT64[0] = val;
                    fromConvert(memBuf, ptr + offset, 4);
                    break;
                }
                case OpCode_1.WASMOPCode.op_memory_size:
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(this.memory.init));
                    break;
                case OpCode_1.WASMOPCode.op_memory_grow:
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(this.memory.init));
                    console.warn("Memory grow not implemented");
                    break;
                case OpCode_1.WASMOPCode.op_i32_const:
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(reader.read_i32()));
                    break;
                case OpCode_1.WASMOPCode.op_i64_const:
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(reader.read_i64()));
                    break;
                case OpCode_1.WASMOPCode.op_f32_const:
                    pushSafe(valueStack, Code_1.WASMValue.createF32Literal(reader.read_f32()));
                    break;
                case OpCode_1.WASMOPCode.op_f64_const:
                    pushSafe(valueStack, Code_1.WASMValue.createF64Literal(reader.read_f64()));
                    break;
                case OpCode_1.WASMOPCode.op_i32_eqz: {
                    var x = popSafe(valueStack).i32;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x === 0)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_eq: {
                    var y = popSafe(valueStack).i32;
                    var x = popSafe(valueStack).i32;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x === y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_ne: {
                    var y = popSafe(valueStack).i32;
                    var x = popSafe(valueStack).i32;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x !== y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_lt_s: {
                    var y = popSafe(valueStack).i32;
                    var x = popSafe(valueStack).i32;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x < y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_lt_u: {
                    Conversion_1.CONVERSION_INT32[0] = popSafe(valueStack).i32;
                    var y = Conversion_1.CONVERSION_UINT32[0];
                    Conversion_1.CONVERSION_INT32[0] = popSafe(valueStack).i32;
                    var x = Conversion_1.CONVERSION_UINT32[0];
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x < y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_gt_s: {
                    var y = popSafe(valueStack).i32;
                    var x = popSafe(valueStack).i32;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x > y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_gt_u: {
                    Conversion_1.CONVERSION_INT32[0] = popSafe(valueStack).i32;
                    var y = Conversion_1.CONVERSION_UINT32[0];
                    Conversion_1.CONVERSION_INT32[0] = popSafe(valueStack).i32;
                    var x = Conversion_1.CONVERSION_UINT32[0];
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x > y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_le_s: {
                    var y = popSafe(valueStack).i32;
                    var x = popSafe(valueStack).i32;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x <= y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_le_u: {
                    Conversion_1.CONVERSION_INT32[0] = popSafe(valueStack).i32;
                    var y = Conversion_1.CONVERSION_UINT32[0];
                    Conversion_1.CONVERSION_INT32[0] = popSafe(valueStack).i32;
                    var x = Conversion_1.CONVERSION_UINT32[0];
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x <= y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_ge_s: {
                    var y = popSafe(valueStack).i32;
                    var x = popSafe(valueStack).i32;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x >= y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_ge_u: {
                    Conversion_1.CONVERSION_INT32[0] = popSafe(valueStack).i32;
                    var y = Conversion_1.CONVERSION_UINT32[0];
                    Conversion_1.CONVERSION_INT32[0] = popSafe(valueStack).i32;
                    var x = Conversion_1.CONVERSION_UINT32[0];
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x >= y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_eqz: {
                    var x = popSafe(valueStack).i64;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x === BigInt(0))));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_eq: {
                    var y = popSafe(valueStack).i64;
                    var x = popSafe(valueStack).i64;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x === y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_ne: {
                    var y = popSafe(valueStack).i64;
                    var x = popSafe(valueStack).i64;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x !== y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_lt_s: {
                    var y = popSafe(valueStack).i64;
                    var x = popSafe(valueStack).i64;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x < y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_lt_u: {
                    Conversion_1.CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    var y = Conversion_1.CONVERSION_UINT64[0];
                    Conversion_1.CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    var x = Conversion_1.CONVERSION_UINT64[0];
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x < y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_gt_s: {
                    var y = popSafe(valueStack).i64;
                    var x = popSafe(valueStack).i64;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x > y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_gt_u: {
                    Conversion_1.CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    var y = Conversion_1.CONVERSION_UINT64[0];
                    Conversion_1.CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    var x = Conversion_1.CONVERSION_UINT64[0];
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x > y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_le_s: {
                    var y = popSafe(valueStack).i64;
                    var x = popSafe(valueStack).i64;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x <= y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_le_u: {
                    Conversion_1.CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    var y = Conversion_1.CONVERSION_UINT64[0];
                    Conversion_1.CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    var x = Conversion_1.CONVERSION_UINT64[0];
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x <= y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_ge_s: {
                    var y = popSafe(valueStack).i64;
                    var x = popSafe(valueStack).i64;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x >= y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_ge_u: {
                    Conversion_1.CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    var y = Conversion_1.CONVERSION_UINT64[0];
                    Conversion_1.CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    var x = Conversion_1.CONVERSION_UINT64[0];
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x >= y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f32_eq: {
                    var y = popSafe(valueStack).f32;
                    var x = popSafe(valueStack).f32;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x === y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f32_ne: {
                    var y = popSafe(valueStack).f32;
                    var x = popSafe(valueStack).f32;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x !== y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f32_lt: {
                    var y = popSafe(valueStack).f32;
                    var x = popSafe(valueStack).f32;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x < y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f32_le: {
                    var y = popSafe(valueStack).f32;
                    var x = popSafe(valueStack).f32;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x <= y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f32_gt: {
                    var y = popSafe(valueStack).f32;
                    var x = popSafe(valueStack).f32;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x > y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f32_ge: {
                    var y = popSafe(valueStack).f32;
                    var x = popSafe(valueStack).f32;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x >= y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_eq: {
                    var y = popSafe(valueStack).f64;
                    var x = popSafe(valueStack).f64;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x === y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_ne: {
                    var y = popSafe(valueStack).f64;
                    var x = popSafe(valueStack).f64;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x !== y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_lt: {
                    var y = popSafe(valueStack).f64;
                    var x = popSafe(valueStack).f64;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x < y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_le: {
                    var y = popSafe(valueStack).f64;
                    var x = popSafe(valueStack).f64;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x <= y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_gt: {
                    var y = popSafe(valueStack).f64;
                    var x = popSafe(valueStack).f64;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x > y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_ge: {
                    var y = popSafe(valueStack).f64;
                    var x = popSafe(valueStack).f64;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(toTruthy(x >= y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_clz: {
                    var x = popSafe(valueStack).i32;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(Math.clz32(x)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_ctz: {
                    var x = popSafe(valueStack).i32 >>> 0;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal((0, Math_1.ctz32)(x)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_popcnt: {
                    var x = popSafe(valueStack).i32 >>> 0;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal((0, Math_1.popcnt32)(x)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_add: {
                    var y = popSafe(valueStack).i32;
                    var x = popSafe(valueStack).i32;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(x + y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_sub: {
                    var y = popSafe(valueStack).i32;
                    var x = popSafe(valueStack).i32;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(x - y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_mul: {
                    var y = popSafe(valueStack).i32;
                    var x = popSafe(valueStack).i32;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(x * y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_div_s: {
                    var y = popSafe(valueStack).i32;
                    var x = popSafe(valueStack).i32;
                    if (y === 0)
                        throw new Error('Division by 0');
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(x / y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_div_u: {
                    var y = popSafe(valueStack).i32 >>> 0;
                    var x = popSafe(valueStack).i32 >>> 0;
                    if (y === 0)
                        throw new Error('Division by 0');
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(x / y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_rem_s: {
                    var y = popSafe(valueStack).i32;
                    var x = popSafe(valueStack).i32;
                    if (y === 0)
                        throw new Error('Remainder by 0');
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(x % y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_rem_u: {
                    var y = popSafe(valueStack).i32 >>> 0;
                    var x = popSafe(valueStack).i32 >>> 0;
                    if (y === 0)
                        throw new Error('Remainder by 0');
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(x % y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_and: {
                    var y = popSafe(valueStack).i32;
                    var x = popSafe(valueStack).i32;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(x & y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_or: {
                    var y = popSafe(valueStack).i32;
                    var x = popSafe(valueStack).i32;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(x | y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_xor: {
                    var y = popSafe(valueStack).i32;
                    var x = popSafe(valueStack).i32;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(x ^ y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_shl: {
                    var y = popSafe(valueStack).i32;
                    var x = popSafe(valueStack).i32;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(x << y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_shr_s: {
                    var y = popSafe(valueStack).i32;
                    var x = popSafe(valueStack).i32;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(x >> y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_shr_u: {
                    var y = popSafe(valueStack).i32;
                    var x = popSafe(valueStack).i32;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(x >>> y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_rotl: {
                    var y = popSafe(valueStack).i32;
                    var x = popSafe(valueStack).i32;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal((0, Math_1.rotl32)(x, y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_rotr: {
                    var y = popSafe(valueStack).i32;
                    var x = popSafe(valueStack).i32;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal((0, Math_1.rotr32)(x, y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_clz: {
                    Conversion_1.CONVERSION_UINT64[0] = popSafe(valueStack).i64;
                    if (Conversion_1.CONVERSION_UINT32[1] === 0)
                        pushSafe(valueStack, Code_1.WASMValue.createI64Literal(BigInt(32 + Math.clz32(Conversion_1.CONVERSION_UINT32[0]))));
                    else
                        pushSafe(valueStack, Code_1.WASMValue.createI64Literal(BigInt(Math.clz32(Conversion_1.CONVERSION_UINT32[1]))));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_ctz: {
                    Conversion_1.CONVERSION_UINT64[0] = popSafe(valueStack).i64;
                    if (Conversion_1.CONVERSION_UINT32[0] === 0)
                        pushSafe(valueStack, Code_1.WASMValue.createI64Literal(BigInt(32 + (0, Math_1.ctz32)(Conversion_1.CONVERSION_UINT32[1]))));
                    else
                        pushSafe(valueStack, Code_1.WASMValue.createI64Literal(BigInt((0, Math_1.ctz32)(Conversion_1.CONVERSION_UINT32[0]))));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_popcnt: {
                    Conversion_1.CONVERSION_UINT64[0] = popSafe(valueStack).i64;
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(BigInt((0, Math_1.popcnt32)(Conversion_1.CONVERSION_UINT32[0]) + (0, Math_1.popcnt32)(Conversion_1.CONVERSION_UINT32[1]))));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_add: {
                    var y = popSafe(valueStack).i64;
                    var x = popSafe(valueStack).i64;
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(x + y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_sub: {
                    var y = popSafe(valueStack).i64;
                    var x = popSafe(valueStack).i64;
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(x - y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_mul: {
                    var y = popSafe(valueStack).i64;
                    var x = popSafe(valueStack).i64;
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(x * y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_div_s: {
                    var y = popSafe(valueStack).i64;
                    var x = popSafe(valueStack).i64;
                    if (y === BigInt(0))
                        throw new Error("Division by 0");
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(x / y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_div_u: {
                    Conversion_1.CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    var y = Conversion_1.CONVERSION_UINT64[0];
                    Conversion_1.CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    var x = Conversion_1.CONVERSION_UINT64[0];
                    if (y === BigInt(0))
                        throw new Error("Division by 0");
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(x / y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_rem_s: {
                    var y = popSafe(valueStack).i64;
                    var x = popSafe(valueStack).i64;
                    if (y === BigInt(0))
                        throw new Error("Remainder by 0");
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(x % y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_rem_u: {
                    Conversion_1.CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    var y = Conversion_1.CONVERSION_UINT64[0];
                    Conversion_1.CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    var x = Conversion_1.CONVERSION_UINT64[0];
                    if (y === BigInt(0))
                        throw new Error("Remainder by 0");
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(x % y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_and: {
                    var y = popSafe(valueStack).i64;
                    var x = popSafe(valueStack).i64;
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(x & y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_or: {
                    var y = popSafe(valueStack).i64;
                    var x = popSafe(valueStack).i64;
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(x | y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_xor: {
                    var y = popSafe(valueStack).i64;
                    var x = popSafe(valueStack).i64;
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(x ^ y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_shl: {
                    var y = popSafe(valueStack).i64;
                    var x = popSafe(valueStack).i64;
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(x << y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_shr_s: {
                    var y = popSafe(valueStack).i64;
                    var x = popSafe(valueStack).i64;
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(x >> y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_shr_u: {
                    var y = popSafe(valueStack).i64;
                    Conversion_1.CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    var x = Conversion_1.CONVERSION_UINT64[0];
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(x >> y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_rotl: {
                    var y = popSafe(valueStack).i64;
                    Conversion_1.CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    var x = Conversion_1.CONVERSION_UINT64[0];
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal((0, Math_1.rotl64)(x, y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_rotr: {
                    var y = popSafe(valueStack).i64;
                    Conversion_1.CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    var x = Conversion_1.CONVERSION_UINT64[0];
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal((0, Math_1.rotr64)(x, y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f32_abs: {
                    var x = popSafe(valueStack).f32;
                    pushSafe(valueStack, Code_1.WASMValue.createF32Literal(Math.abs(x)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f32_neg: {
                    var x = popSafe(valueStack).f32;
                    pushSafe(valueStack, Code_1.WASMValue.createF32Literal(-Math.abs(x)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f32_ceil: {
                    var x = popSafe(valueStack).f32;
                    pushSafe(valueStack, Code_1.WASMValue.createF32Literal(Math.ceil(x)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f32_floor: {
                    var x = popSafe(valueStack).f32;
                    pushSafe(valueStack, Code_1.WASMValue.createF32Literal(Math.floor(x)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f32_trunc: {
                    var x = popSafe(valueStack).f32;
                    pushSafe(valueStack, Code_1.WASMValue.createF32Literal(Math.trunc(x)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f32_nearest: {
                    var x = popSafe(valueStack).f32;
                    pushSafe(valueStack, Code_1.WASMValue.createF32Literal(Math.round(x)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f32_sqrt: {
                    var x = popSafe(valueStack).f32;
                    pushSafe(valueStack, Code_1.WASMValue.createF32Literal(Math.sqrt(x)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f32_add: {
                    var y = popSafe(valueStack).f32;
                    var x = popSafe(valueStack).f32;
                    pushSafe(valueStack, Code_1.WASMValue.createF32Literal(x + y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f32_sub: {
                    var y = popSafe(valueStack).f32;
                    var x = popSafe(valueStack).f32;
                    pushSafe(valueStack, Code_1.WASMValue.createF32Literal(x - y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f32_mul: {
                    var y = popSafe(valueStack).f32;
                    var x = popSafe(valueStack).f32;
                    pushSafe(valueStack, Code_1.WASMValue.createF32Literal(x * y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f32_div: {
                    var y = popSafe(valueStack).f32;
                    var x = popSafe(valueStack).f32;
                    pushSafe(valueStack, Code_1.WASMValue.createF32Literal(x / y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f32_min: {
                    var y = popSafe(valueStack).f32;
                    var x = popSafe(valueStack).f32;
                    pushSafe(valueStack, Code_1.WASMValue.createF32Literal(Math.min(x, y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f32_max: {
                    var y = popSafe(valueStack).f32;
                    var x = popSafe(valueStack).f32;
                    pushSafe(valueStack, Code_1.WASMValue.createF32Literal(Math.max(x, y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f32_copysign: {
                    var y = popSafe(valueStack).f32;
                    var x = popSafe(valueStack).f32;
                    if (Math.sign(y) === Math.sign(x))
                        pushSafe(valueStack, Code_1.WASMValue.createF32Literal(x));
                    else
                        pushSafe(valueStack, Code_1.WASMValue.createF32Literal(-x));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_abs: {
                    var x = popSafe(valueStack).f64;
                    pushSafe(valueStack, Code_1.WASMValue.createF64Literal(Math.abs(x)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_neg: {
                    var x = popSafe(valueStack).f64;
                    pushSafe(valueStack, Code_1.WASMValue.createF64Literal(-Math.abs(x)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_ceil: {
                    var x = popSafe(valueStack).f64;
                    pushSafe(valueStack, Code_1.WASMValue.createF64Literal(Math.ceil(x)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_floor: {
                    var x = popSafe(valueStack).f64;
                    pushSafe(valueStack, Code_1.WASMValue.createF64Literal(Math.floor(x)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_trunc: {
                    var x = popSafe(valueStack).f64;
                    pushSafe(valueStack, Code_1.WASMValue.createF64Literal(Math.trunc(x)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_nearest: {
                    var x = popSafe(valueStack).f64;
                    pushSafe(valueStack, Code_1.WASMValue.createF64Literal(Math.round(x)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_sqrt: {
                    var x = popSafe(valueStack).f64;
                    pushSafe(valueStack, Code_1.WASMValue.createF64Literal(Math.sqrt(x)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_add: {
                    var y = popSafe(valueStack).f64;
                    var x = popSafe(valueStack).f64;
                    pushSafe(valueStack, Code_1.WASMValue.createF64Literal(x + y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_sub: {
                    var y = popSafe(valueStack).f64;
                    var x = popSafe(valueStack).f64;
                    pushSafe(valueStack, Code_1.WASMValue.createF64Literal(x - y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_mul: {
                    var y = popSafe(valueStack).f64;
                    var x = popSafe(valueStack).f64;
                    pushSafe(valueStack, Code_1.WASMValue.createF64Literal(x * y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_div: {
                    var y = popSafe(valueStack).f64;
                    var x = popSafe(valueStack).f64;
                    pushSafe(valueStack, Code_1.WASMValue.createF64Literal(x / y));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_min: {
                    var y = popSafe(valueStack).f64;
                    var x = popSafe(valueStack).f64;
                    pushSafe(valueStack, Code_1.WASMValue.createF64Literal(Math.min(x, y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_max: {
                    var y = popSafe(valueStack).f64;
                    var x = popSafe(valueStack).f64;
                    pushSafe(valueStack, Code_1.WASMValue.createF64Literal(Math.max(x, y)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_copysign: {
                    var y = popSafe(valueStack).f64;
                    var x = popSafe(valueStack).f64;
                    if (Math.sign(y) === Math.sign(x))
                        pushSafe(valueStack, Code_1.WASMValue.createF64Literal(x));
                    else
                        pushSafe(valueStack, Code_1.WASMValue.createF64Literal(-x));
                    break;
                }
                //bit twiddler operations
                case OpCode_1.WASMOPCode.op_i32_wrap_i64: {
                    var x = popSafe(valueStack).i64;
                    Conversion_1.CONVERSION_UINT64[0] = x;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(Conversion_1.CONVERSION_INT32[0]));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_trunc_f32_s: {
                    var x = Math.fround(Math.trunc(popSafe(valueStack).f32));
                    if (x < -0x80000000 || x > 0x7FFFFFFF)
                        throw new Error('Float unrepresentable as a signed int32');
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(x >> 0));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_trunc_f32_u: {
                    var x = Math.fround(Math.trunc(popSafe(valueStack).f32));
                    if (x < 0 || x > 0xFFFFFFFF)
                        throw new Error('Float unrepresentable as an unsigned int32');
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(x >> 0));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_trunc_f64_s: {
                    var x = Math.trunc(popSafe(valueStack).f64);
                    if (x < -0x80000000 || x > 0x7FFFFFFF)
                        throw new Error('Float unrepresentable as a signed int32');
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(x >> 0));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_trunc_f64_u: {
                    var x = Math.trunc(popSafe(valueStack).f64);
                    if (x < 0 || x > 0xFFFFFFFF)
                        throw new Error('Float unrepresentable as an unsigned int32');
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(x >> 0));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_extend_i32_s: {
                    var x = popSafe(valueStack).i32;
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(BigInt(x)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_extend_i32_u: {
                    var x = popSafe(valueStack).i32;
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(BigInt(x >> 0)));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_trunc_f32_s: {
                    var x = BigInt(Math.fround(Math.trunc(popSafe(valueStack).f32)));
                    if (x < -BigInt("0x8000000000000000") || x > BigInt("0x7FFFFFFFFFFFFFFF"))
                        throw new Error('Float unrepresentable as a signed int64');
                    Conversion_1.CONVERSION_INT64[0] = x;
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(Conversion_1.CONVERSION_INT64[0]));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_trunc_f32_u: {
                    var x = BigInt(Math.fround(Math.trunc(popSafe(valueStack).f32)));
                    if (x < BigInt(0) || x > BigInt("0xFFFFFFFFFFFFFFFF"))
                        throw new Error('Float unrepresentable as a signed int64');
                    Conversion_1.CONVERSION_UINT64[0] = x;
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(Conversion_1.CONVERSION_INT64[0]));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_trunc_f64_s: {
                    var x = BigInt(Math.trunc(popSafe(valueStack).f64));
                    if (x < -BigInt("0x8000000000000000") || x > BigInt("0x7FFFFFFFFFFFFFFF"))
                        throw new Error('Float unrepresentable as a signed int64');
                    Conversion_1.CONVERSION_INT64[0] = x;
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(Conversion_1.CONVERSION_INT64[0]));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_trunc_f64_u: {
                    var x = BigInt(Math.trunc(popSafe(valueStack).f64));
                    if (x < BigInt(0) || x > BigInt("0xFFFFFFFFFFFFFFFF"))
                        throw new Error('Float unrepresentable as a signed int64');
                    Conversion_1.CONVERSION_UINT64[0] = x;
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(Conversion_1.CONVERSION_INT64[0]));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f32_convert_i32_s: {
                    var x = Math.fround(popSafe(valueStack).i32 >> 0);
                    pushSafe(valueStack, Code_1.WASMValue.createF32Literal(x));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f32_convert_i32_u: {
                    var x = Math.fround(popSafe(valueStack).i32 >>> 0);
                    pushSafe(valueStack, Code_1.WASMValue.createF32Literal(x));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f32_convert_i64_s: {
                    var x = Math.fround(Number(popSafe(valueStack).i64) >> 0);
                    pushSafe(valueStack, Code_1.WASMValue.createF32Literal(x));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f32_convert_i64_u: {
                    var x = Math.fround(Number(popSafe(valueStack).i64) >>> 0);
                    pushSafe(valueStack, Code_1.WASMValue.createF32Literal(x));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f32_demote_f64: {
                    var x = Math.fround(popSafe(valueStack).f64);
                    pushSafe(valueStack, Code_1.WASMValue.createF32Literal(x));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_convert_i32_s: {
                    var x = popSafe(valueStack).i32;
                    pushSafe(valueStack, Code_1.WASMValue.createF64Literal(x));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_convert_i32_u: {
                    var x = popSafe(valueStack).i32 >>> 0;
                    pushSafe(valueStack, Code_1.WASMValue.createF64Literal(x));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_convert_i64_s: {
                    var x = Number(popSafe(valueStack).i64);
                    pushSafe(valueStack, Code_1.WASMValue.createF64Literal(x));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_convert_i64_u: {
                    Conversion_1.CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    var x = Number(Conversion_1.CONVERSION_UINT64[0]);
                    pushSafe(valueStack, Code_1.WASMValue.createF64Literal(x));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f64_promote_f32: {
                    var x = popSafe(valueStack).f32;
                    pushSafe(valueStack, Code_1.WASMValue.createF64Literal(x));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_reinterpret_f32: {
                    Conversion_1.CONVERSION_FLOAT32[0] = popSafe(valueStack).f32;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(Conversion_1.CONVERSION_INT32[0]));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_reinterpret_f64: {
                    Conversion_1.CONVERSION_FLOAT64[0] = popSafe(valueStack).f64;
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(Conversion_1.CONVERSION_INT64[0]));
                    break;
                }
                case OpCode_1.WASMOPCode.op_f32_reinterpret_i32: {
                    Conversion_1.CONVERSION_INT32[0] = popSafe(valueStack).i32;
                    pushSafe(valueStack, Code_1.WASMValue.createF32Literal(Conversion_1.CONVERSION_FLOAT32[0]));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_reinterpret_f64: {
                    Conversion_1.CONVERSION_INT64[0] = popSafe(valueStack).i64;
                    pushSafe(valueStack, Code_1.WASMValue.createF64Literal(Conversion_1.CONVERSION_FLOAT64[0]));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_extend8_s: {
                    var x = popSafe(valueStack).i32;
                    Conversion_1.CONVERSION_UINT8[0] = x;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(Conversion_1.CONVERSION_INT32[0]));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i32_extend16_s: {
                    var x = popSafe(valueStack).i32;
                    Conversion_1.CONVERSION_UINT16[0] = x;
                    pushSafe(valueStack, Code_1.WASMValue.createI32Literal(Conversion_1.CONVERSION_INT32[0]));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_extend8_s: {
                    var x = popSafe(valueStack).i64;
                    Conversion_1.CONVERSION_UINT8[0] = Number(x);
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(Conversion_1.CONVERSION_INT64[0]));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_extend16_s: {
                    var x = popSafe(valueStack).i64;
                    Conversion_1.CONVERSION_UINT8[0] = Number(x);
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(Conversion_1.CONVERSION_INT64[0]));
                    break;
                }
                case OpCode_1.WASMOPCode.op_i64_extend32_s: {
                    var x = popSafe(valueStack).i64;
                    Conversion_1.CONVERSION_UINT8[0] = Number(x);
                    pushSafe(valueStack, Code_1.WASMValue.createI64Literal(Conversion_1.CONVERSION_INT64[0]));
                    break;
                }
                case OpCode_1.WASMOPCode.op_memory_fill: {
                    var n = popSafe(valueStack).i32;
                    var val = popSafe(valueStack).i32;
                    var d = popSafe(valueStack).i32;
                    for (var i = 0; i < n; ++i)
                        this.memory._buffer[d + i] = val;
                    break;
                }
                case OpCode_1.WASMOPCode.op_else:
                case OpCode_1.WASMOPCode.op_end:
                //these instructions are removed in the resulting code
                default:
                    throw new Error("Invalid opcode ".concat(instr));
            }
        }
        //throw new Error(`Unreachable`);
    };
    return Program;
}());
exports.Program = Program;
