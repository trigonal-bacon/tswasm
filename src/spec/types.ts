export enum WASMValueType {
    nil = 0x40,
    f64 = 0x7C,
    f32 = 0x7D,
    i64 = 0x7E,
    i32 = 0x7F,
    u32 = 0x80 //NOT IN SPEC
}

export enum WASMDeclType {
    func = 0x00,
    table = 0x01,
    mem = 0x02,
    global = 0x03
}

export enum WASMRefType {
    funcref = 0x70,
    externref = 0x6F
}

export class WASMGlobalType {
    mutable : boolean = false;
    type : WASMValueType = WASMValueType.i32;
}