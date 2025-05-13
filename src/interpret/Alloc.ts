import { WASMValue } from "../spec/Code";
import { WASMValueType } from "../spec/Types";

const VALUE_ARENA : Array<WASMValue> = [];

export function cloneValue(v : WASMValue) : WASMValue {
    const ret = new WASMValue();
    ret.type = v.type;
    ret.set(v);
    return ret;
}

export function newValue() : WASMValue {
    const v = VALUE_ARENA.pop();
    if (v === undefined)
        return new WASMValue();
    v.type = WASMValueType.nil;
    return v;
}

export function newI32(v : number) : WASMValue {
    const x = newValue();
    x.type = WASMValueType.i32;
    x.i32 = v;
    return x;
}

export function newF32(v : number) : WASMValue {
    const x = newValue();
    x.type = WASMValueType.f32;
    x.f32 = v;
    return x;
}

export function newI64(v : bigint) : WASMValue {
    const x = newValue();
    x.type = WASMValueType.i64;
    x.i64 = v;
    return x;
}

export function newF64(v : number) : WASMValue {
    const x = newValue();
    x.type = WASMValueType.f64;
    x.f64 = v;
    return x;
}

export function freeVal(v : WASMValue) : void {
    VALUE_ARENA.push(v);
}