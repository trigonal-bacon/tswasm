"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.__debug_val_length = __debug_val_length;
exports.cloneValue = cloneValue;
exports.newI32 = newI32;
exports.newF32 = newF32;
exports.newI64 = newI64;
exports.newF64 = newF64;
exports.freeVal = freeVal;
var Code_1 = require("../spec/Code");
var types_1 = require("../spec/types");
var VALUE_ARENA = [];
var allocs = 0;
function __debug_val_length() {
    return allocs;
}
function cloneValue(v) {
    if (VALUE_ARENA.length === 0) {
        var ret_1 = new Code_1.WASMValue();
        ret_1.type = v.type;
        ret_1.value = v.value;
        ret_1.bigval = v.bigval;
        return ret_1;
    }
    var ret = VALUE_ARENA[VALUE_ARENA.length - 1];
    VALUE_ARENA.length -= 1;
    ret.type = v.type;
    ret.value = v.value;
    ret.bigval = v.bigval;
    return ret;
}
function newI32(v) {
    ++allocs;
    if (VALUE_ARENA.length === 0)
        return Code_1.WASMValue.createI32Literal(v);
    var val = VALUE_ARENA[VALUE_ARENA.length - 1];
    VALUE_ARENA.length -= 1;
    val.type = types_1.WASMValueType.i32;
    val.i32 = v;
    return val;
}
function newF32(v) {
    ++allocs;
    if (VALUE_ARENA.length === 0)
        return Code_1.WASMValue.createF32Literal(v);
    var val = VALUE_ARENA[VALUE_ARENA.length - 1];
    VALUE_ARENA.length -= 1;
    val.type = types_1.WASMValueType.f32;
    val.f32 = v;
    return val;
}
function newI64(v) {
    ++allocs;
    if (VALUE_ARENA.length === 0)
        return Code_1.WASMValue.createI64Literal(v);
    var val = VALUE_ARENA[VALUE_ARENA.length - 1];
    VALUE_ARENA.length -= 1;
    val.type = types_1.WASMValueType.i64;
    val.i64 = v;
    return val;
}
function newF64(v) {
    ++allocs;
    if (VALUE_ARENA.length === 0)
        return Code_1.WASMValue.createF64Literal(v);
    var val = VALUE_ARENA[VALUE_ARENA.length - 1];
    VALUE_ARENA.length -= 1;
    val.type = types_1.WASMValueType.f64;
    val.f64 = v;
    return val;
}
function freeVal(v) {
    VALUE_ARENA.push(v);
}
