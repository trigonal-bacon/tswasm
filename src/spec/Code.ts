import { WASMValueType } from "./types";

const CONVERSION_BUFFER = new ArrayBuffer(8);
const CONVERSION_UINT8 = new Uint8Array(CONVERSION_BUFFER);
const CONVERSION_UINT32 = new Uint32Array(CONVERSION_BUFFER);
const CONVERSION_INT32 = new Int32Array(CONVERSION_BUFFER);
const CONVERSION_FLOAT32 = new Float32Array(CONVERSION_BUFFER);
const CONVERSION_UINT64 = new BigUint64Array(CONVERSION_BUFFER);
const CONVERSION_INT64 = new BigInt64Array(CONVERSION_BUFFER);
const CONVERSION_FLOAT64 = new Float64Array(CONVERSION_BUFFER);

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
    toU32() : number {
        return this.value;
    }
    toI32() : number {
        return this.value;
    }
    toF32() : number {
        return this.value;
    }
    toI64() : bigint {
        return this.bigval;
    }
    toF64() : number {
        return this.value;
    }
    toNumeric() : number | bigint {
        switch (this.type) {
            case WASMValueType.i64:
                return this.bigval;
            default:
                return this.value;
        }
    }
    static createU32Literal(u32 : number) : WASMValue {
        const ret = new WASMValue();
        CONVERSION_UINT32[0] = u32;
        ret.type = WASMValueType.u32;
        ret.value = CONVERSION_UINT32[0];
        return ret;
    }
    static createI32Literal(i32 : number) : WASMValue {
        const ret = new WASMValue();
        CONVERSION_INT32[0] = i32;
        ret.type = WASMValueType.i32;
        ret.value = CONVERSION_INT32[0];
        return ret;
    }
    static createF32Literal(f32 : number) : WASMValue {
        const ret = new WASMValue();
        CONVERSION_FLOAT32[0] = f32;
        ret.type = WASMValueType.f32;
        ret.value = CONVERSION_FLOAT32[0];
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
        CONVERSION_FLOAT64[0] = f64;
        ret.type = WASMValueType.f64;
        ret.value = CONVERSION_FLOAT64[0];
        return ret;
    }
}

export class InstrNode {
    instr : number = 0; //fix
    hasElse : boolean = false;
    returnType : WASMValueType = WASMValueType.nil;
    immediates : Array<WASMValue> = [];
    child : Array<InstrNode> = [];
    child2 : Array<InstrNode> = [];
}