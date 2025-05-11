import { WASMValue } from "../spec/Code";
import { WASMValueType } from "../spec/Types";

const VALUE_ARENA : Array<WASMValue> = [];

let allocs : number = 0;
export function __debug_val_length() : number {
    return VALUE_ARENA.length;
}

export function cloneValue(v : WASMValue) : WASMValue {
    const ret = new WASMValue();
    ret.type = v.type;
    ret.value = v.value;
    ret.bigval = v.bigval;
    return ret;
}

export function newValue() : WASMValue {
    return new WASMValue();
}
export function newI32(v : number) : WASMValue {
    return WASMValue.createI32Literal(v);
}

export function newF32(v : number) : WASMValue {
    return WASMValue.createF32Literal(v);
}

export function newI64(v : bigint) : WASMValue {
    return WASMValue.createI64Literal(v);
}

export function newF64(v : number) : WASMValue {
    return WASMValue.createF64Literal(v);
}

export function freeVal(v : WASMValue) : void {
    VALUE_ARENA.push(v);
}