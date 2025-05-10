import { WASMOPCode } from "./OpCode";
import { WASMValueType } from "./types";

import {
    CONVERSION_UINT8, CONVERSION_INT8, 
    CONVERSION_UINT16, CONVERSION_INT16,
    CONVERSION_UINT32, CONVERSION_INT32, CONVERSION_FLOAT32,
    CONVERSION_UINT64, CONVERSION_INT64, CONVERSION_FLOAT64
} from "../helpers/Conversion";

export class WASMValue {
    type : WASMValueType = WASMValueType.i32;
    value : number = 0;
    bigval : bigint = BigInt(0);
    set(v : WASMValue) {
        if (this.type !== v.type)
            throw new Error(`Internal type mismatch: expected ${this.type}, got ${v.type}`);
        this.value = v.value;
        this.bigval = v.bigval;
    }
    get u32() : number {
        return this.value >>> 0;
    }
    get i32() : number {
        return this.value >> 0;
    }
    get f32() : number {
        return Math.fround(this.value);
    }
    get i64() : bigint {
        return this.bigval;
    }
    get f64() : number {
        return this.value;
    }
    get numeric() : number | bigint {
        switch (this.type) {
            case WASMValueType.i64:
                return this.bigval;
            default:
                return this.value;
        }
    }
    static createU32Literal(u32 : number) : WASMValue {
        const ret = new WASMValue();
        ret.type = WASMValueType.u32;
        ret.value = u32 >>> 0;
        return ret;
    }
    static createI32Literal(i32 : number) : WASMValue {
        const ret = new WASMValue();
        ret.type = WASMValueType.i32;
        ret.value = i32|0;
        return ret;
    }
    static createF32Literal(f32 : number) : WASMValue {
        const ret = new WASMValue();
        ret.type = WASMValueType.f32;
        ret.value = Math.fround(f32);
        return ret;
    }
    static createI64Literal(i64 : bigint) : WASMValue {
        const ret = new WASMValue();
        CONVERSION_INT64[0] = i64;
        ret.type = WASMValueType.i64;
        ret.bigval = CONVERSION_INT64[0];
        return ret;
    }
    static createF64Literal(f64 : number) : WASMValue {
        const ret = new WASMValue();
        ret.type = WASMValueType.f64;
        ret.value = f64;
        return ret;
    }
}

export class InstrNode {
    instr : WASMOPCode = WASMOPCode.op_nop; //fix
    hasElse : boolean = false;
    returnType : WASMValueType = WASMValueType.nil;
    immediates : Array<WASMValue> = [];
    child : Array<InstrNode> = [];
    child2 : Array<InstrNode> = [];
}