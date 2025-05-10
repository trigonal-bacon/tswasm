"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstrNode = exports.WASMValue = void 0;
var OpCode_1 = require("./OpCode");
var types_1 = require("./types");
var Conversion_1 = require("../helpers/Conversion");
//nil represents an uninitialized wasmvalue
//maybe implement typechecking under the hood just in case
var WASMValue = /** @class */ (function () {
    function WASMValue() {
        this.type = types_1.WASMValueType.nil;
        this.value = 0;
        this.bigval = BigInt(0);
    }
    WASMValue.prototype.set = function (v) {
        if (this.type !== v.type)
            throw new Error("Internal type mismatch: expected ".concat((0, types_1.typeToString)(this.type), ", got ").concat((0, types_1.typeToString)(v.type)));
        this.value = v.value;
        this.bigval = v.bigval;
    };
    Object.defineProperty(WASMValue.prototype, "u32", {
        get: function () {
            return this.value >>> 0;
        },
        set: function (v) {
            this.value = v >>> 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WASMValue.prototype, "i32", {
        get: function () {
            return this.value >> 0;
        },
        set: function (v) {
            this.value = v >> 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WASMValue.prototype, "f32", {
        get: function () {
            return Math.fround(this.value);
        },
        set: function (v) {
            this.value = Math.fround(v);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WASMValue.prototype, "i64", {
        get: function () {
            return this.bigval;
        },
        set: function (v) {
            this.bigval = v;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WASMValue.prototype, "f64", {
        get: function () {
            return this.value;
        },
        set: function (v) {
            this.value = v;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WASMValue.prototype, "numeric", {
        get: function () {
            switch (this.type) {
                case types_1.WASMValueType.i64:
                    return this.bigval;
                default:
                    return this.value;
            }
        },
        enumerable: false,
        configurable: true
    });
    WASMValue.createU32Literal = function (u32) {
        var ret = new WASMValue();
        ret.type = types_1.WASMValueType.u32;
        ret.value = u32 >>> 0;
        return ret;
    };
    WASMValue.createI32Literal = function (i32) {
        var ret = new WASMValue();
        ret.type = types_1.WASMValueType.i32;
        ret.value = i32 | 0;
        return ret;
    };
    WASMValue.createF32Literal = function (f32) {
        var ret = new WASMValue();
        ret.type = types_1.WASMValueType.f32;
        ret.value = Math.fround(f32);
        return ret;
    };
    WASMValue.createI64Literal = function (i64) {
        var ret = new WASMValue();
        Conversion_1.CONVERSION_INT64[0] = i64;
        ret.type = types_1.WASMValueType.i64;
        ret.bigval = Conversion_1.CONVERSION_INT64[0];
        return ret;
    };
    WASMValue.createF64Literal = function (f64) {
        var ret = new WASMValue();
        ret.type = types_1.WASMValueType.f64;
        ret.value = f64;
        return ret;
    };
    return WASMValue;
}());
exports.WASMValue = WASMValue;
var InstrNode = /** @class */ (function () {
    function InstrNode() {
        this.instr = OpCode_1.WASMOPCode.op_nop; //fix
        this.hasElse = false;
        this.returnType = types_1.WASMValueType.nil;
        this.immediates = [];
        this.child = [];
        this.child2 = [];
    }
    return InstrNode;
}());
exports.InstrNode = InstrNode;
