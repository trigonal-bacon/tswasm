import { WASMOPCode } from "./OpCode";
import { typeToString, WASMValueType } from "./Types";

//nil represents an uninitialized wasmvalue
//implements typechecking under the hood just in case

export class WASMValue {
    type : WASMValueType = WASMValueType.nil;
    __value : number = 0;
    __bigval : bigint = BigInt(0);
    set(v : WASMValue) {
        if (this.type !== v.type && this.type !== WASMValueType.nil && v.type !== WASMValueType.nil)
            throw new TypeError(`Internal type mismatch: expected ${typeToString(this.type)}, got ${typeToString(v.type)}`);
        this.__value = v.__value;
        this.__bigval = v.__bigval;
    }
    get u32() : number {
        return this.__value;
    }
    get i32() : number {
        return this.__value;
    }
    get f32() : number {
        return this.__value;
    }
    get i64() : bigint {
        return this.__bigval;
    }
    get f64() : number {
        return this.__value;
    }
    set u32(v : number) {
        this.__value = v >>> 0;
    }
    set i32(v : number) {
        this.__value = v >> 0;
    }
    set f32(v : number) {
        this.__value = Math.fround(v);
    }
    set i64(v : bigint) {
        this.__bigval = v;
    }
    set f64(v : number) {
        this.__value = v;
    }
    get numeric() : number | bigint {
        switch (this.type) {
            case WASMValueType.i64:
                return this.__bigval;
            default:
                return this.__value;
        }
    }
    static createU32Literal(u32 : number) : WASMValue {
        const ret = new WASMValue();
        ret.type = WASMValueType.u32;
        ret.__value = u32 >>> 0;
        return ret;
    }
    static createI32Literal(i32 : number) : WASMValue {
        const ret = new WASMValue();
        ret.type = WASMValueType.i32;
        ret.__value = i32|0;
        return ret;
    }
    static createF32Literal(f32 : number) : WASMValue {
        const ret = new WASMValue();
        ret.type = WASMValueType.f32;
        ret.__value = Math.fround(f32);
        return ret;
    }
    static createI64Literal(i64 : bigint) : WASMValue {
        const ret = new WASMValue();
        ret.type = WASMValueType.i64;
        ret.__bigval = BigInt.asIntN(64, i64);
        return ret;
    }
    static createF64Literal(f64 : number) : WASMValue {
        const ret = new WASMValue();
        ret.type = WASMValueType.f64;
        ret.__value = f64;
        return ret;
    }
}

export class InstrNode {
    instr : WASMOPCode = WASMOPCode.op_nop;
    hasElse : boolean = false;
    numKeep : number = 0;
    numDrop : number = 0;
    returnType : WASMValueType = WASMValueType.nil;
    immediates : Array<WASMValue> = [];
    child : Array<InstrNode> = [];
    child2 : Array<InstrNode> = [];
}