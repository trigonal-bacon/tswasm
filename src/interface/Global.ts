import { WASMValue } from "../spec/Code";
import { WASMValueType } from "../spec/Types";

export class WASMExternalGlobal {
    _value : WASMValue = new WASMValue();
    mutable : boolean = false;
    constructor(options : any) {
        if (typeof options.mutable === "boolean")
            this.mutable = options.mutable;
        if (typeof options.value === "string") {
            switch (options.value) {
                case "i32":
                    this._value = WASMValue.createI32Literal(0);
                    break;
                case "f32":
                    this._value = WASMValue.createF32Literal(0);
                    break;
                case "i64":
                    this._value = WASMValue.createI64Literal(BigInt(0));
                    break;
                case "f64":
                    this._value = WASMValue.createF64Literal(0);
                    break;
                default:
                    break;
            }
        }
    }

    get type() : string {
        switch (this._value.type) {
            case WASMValueType.i32: return "i32";
            case WASMValueType.f32: return "f32";
            case WASMValueType.i64: return "i64";
            case WASMValueType.f64: return "f64";
        }
        return "nil";
    }

    get value() : number | bigint {
        return this._value.numeric;
    }
}