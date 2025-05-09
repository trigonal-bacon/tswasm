"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstrNode = exports.WASMValue = void 0;
var types_1 = require("./types");
var CONVERSION_BUFFER = new ArrayBuffer(8);
var CONVERSION_UINT8 = new Uint8Array(CONVERSION_BUFFER);
var CONVERSION_UINT32 = new Uint32Array(CONVERSION_BUFFER);
var CONVERSION_INT32 = new Int32Array(CONVERSION_BUFFER);
var CONVERSION_FLOAT32 = new Float32Array(CONVERSION_BUFFER);
var CONVERSION_UINT64 = new BigUint64Array(CONVERSION_BUFFER);
var CONVERSION_INT64 = new BigInt64Array(CONVERSION_BUFFER);
var CONVERSION_FLOAT64 = new Float64Array(CONVERSION_BUFFER);
var WASMValue = /** @class */ (function () {
    function WASMValue() {
        this.type = types_1.WASMValueType.i32;
        this.value = 0;
        this.bigval = BigInt(0);
    }
    WASMValue.prototype.set = function (v) {
        if (this.type !== v.type)
            throw new Error("Internal type mismatch: expected ".concat(this.type, ", got ").concat(v.type));
        this.value = v.value;
        this.bigval = v.bigval;
    };
    WASMValue.prototype.toU32 = function () {
        return this.value;
    };
    WASMValue.prototype.toI32 = function () {
        return this.value;
    };
    WASMValue.prototype.toF32 = function () {
        return this.value;
    };
    WASMValue.prototype.toI64 = function () {
        return this.bigval;
    };
    WASMValue.prototype.toF64 = function () {
        return this.value;
    };
    WASMValue.prototype.toNumeric = function () {
        switch (this.type) {
            case types_1.WASMValueType.i64:
                return this.bigval;
            default:
                return this.value;
        }
    };
    WASMValue.createU32Literal = function (u32) {
        var ret = new WASMValue();
        CONVERSION_UINT32[0] = u32;
        ret.type = types_1.WASMValueType.u32;
        ret.value = CONVERSION_UINT32[0];
        return ret;
    };
    WASMValue.createI32Literal = function (i32) {
        var ret = new WASMValue();
        CONVERSION_INT32[0] = i32;
        ret.type = types_1.WASMValueType.i32;
        ret.value = CONVERSION_INT32[0];
        return ret;
    };
    WASMValue.createF32Literal = function (f32) {
        var ret = new WASMValue();
        CONVERSION_FLOAT32[0] = f32;
        ret.type = types_1.WASMValueType.f32;
        ret.value = CONVERSION_FLOAT32[0];
        return ret;
    };
    WASMValue.createI64Literal = function (i64) {
        var ret = new WASMValue();
        CONVERSION_INT64[0] = i64;
        ret.type = types_1.WASMValueType.i64;
        ret.bigval = CONVERSION_INT64[0];
        return ret;
    };
    WASMValue.createF64Literal = function (f64) {
        var ret = new WASMValue();
        CONVERSION_FLOAT64[0] = f64;
        ret.type = types_1.WASMValueType.f64;
        ret.value = CONVERSION_FLOAT64[0];
        return ret;
    };
    return WASMValue;
}());
exports.WASMValue = WASMValue;
var InstrNode = /** @class */ (function () {
    function InstrNode() {
        this.instr = 0; //fix
        this.hasElse = false;
        this.returnType = types_1.WASMValueType.nil;
        this.immediates = [];
        this.child = [];
        this.child2 = [];
    }
    return InstrNode;
}());
exports.InstrNode = InstrNode;
