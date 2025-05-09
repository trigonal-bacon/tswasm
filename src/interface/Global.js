"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WASMGlobalImport = void 0;
var Code_1 = require("../spec/Code");
var types_1 = require("../spec/types");
var WASMGlobalImport = /** @class */ (function () {
    function WASMGlobalImport(options) {
        this._value = new Code_1.WASMValue();
        this.mutable = false;
        if (typeof options.mutable === "boolean")
            this.mutable = options.mutable;
        if (typeof options.value === "string") {
            switch (options.value) {
                case "i32":
                    this._value = Code_1.WASMValue.createI32Literal(0);
                    break;
                case "f32":
                    this._value = Code_1.WASMValue.createF32Literal(0);
                    break;
                case "i64":
                    this._value = Code_1.WASMValue.createI64Literal(BigInt(0));
                    break;
                case "f64":
                    this._value = Code_1.WASMValue.createF64Literal(0);
                    break;
                default:
                    break;
            }
        }
    }
    Object.defineProperty(WASMGlobalImport.prototype, "type", {
        get: function () {
            switch (this._value.type) {
                case types_1.WASMValueType.i32: return "i32";
                case types_1.WASMValueType.f32: return "f32";
                case types_1.WASMValueType.i64: return "i64";
                case types_1.WASMValueType.f64: return "f64";
            }
            return "nil";
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WASMGlobalImport.prototype, "value", {
        get: function () {
            return this._value.toNumeric();
        },
        enumerable: false,
        configurable: true
    });
    return WASMGlobalImport;
}());
exports.WASMGlobalImport = WASMGlobalImport;
