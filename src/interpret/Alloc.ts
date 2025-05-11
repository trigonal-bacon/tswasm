import { WASMValue } from "../spec/Code";
import { WASMValueType } from "../spec/types";

const VALUE_ARENA : Array<WASMValue> = [];

let allocs : number = 0;
export function __debug_val_length() : number {
    return allocs;
}

export function cloneValue(v : WASMValue) : WASMValue {
    if (VALUE_ARENA.length === 0) {
        const ret = new WASMValue();
        ret.type = v.type;
        ret.value = v.value;
        ret.bigval = v.bigval;
        return ret;
    }
    const ret = VALUE_ARENA[VALUE_ARENA.length - 1];
    VALUE_ARENA.length -= 1;
    ret.type = v.type;
    ret.value = v.value;
    ret.bigval = v.bigval;
    return ret;
}

export function newI32(v : number) : WASMValue {
    ++allocs;
    if (VALUE_ARENA.length === 0) return WASMValue.createI32Literal(v);
    const val = VALUE_ARENA[VALUE_ARENA.length - 1];
    VALUE_ARENA.length -= 1;
    val.type = WASMValueType.i32;
    val.i32 = v;
    return val;
}

export function newF32(v : number) : WASMValue {
    ++allocs;
    if (VALUE_ARENA.length === 0) return WASMValue.createF32Literal(v);
    const val = VALUE_ARENA[VALUE_ARENA.length - 1];
    VALUE_ARENA.length -= 1;
    val.type = WASMValueType.f32;
    val.f32 = v;
    return val;
}

export function newI64(v : bigint) : WASMValue {
    ++allocs;
    if (VALUE_ARENA.length === 0) return WASMValue.createI64Literal(v);
    const val = VALUE_ARENA[VALUE_ARENA.length - 1];
    VALUE_ARENA.length -= 1;
    val.type = WASMValueType.i64;
    val.i64 = v;
    return val;
}

export function newF64(v : number) : WASMValue {
    ++allocs;
    if (VALUE_ARENA.length === 0) return WASMValue.createF64Literal(v);
    const val = VALUE_ARENA[VALUE_ARENA.length - 1];
    VALUE_ARENA.length -= 1;
    val.type = WASMValueType.f64;
    val.f64 = v;
    return val;
}

export function freeVal(v : WASMValue) : void {
    VALUE_ARENA.push(v);
}