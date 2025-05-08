import { InstrNode } from "./Code";
import { WASMValueType, WASMDeclType, WASMRefType } from "./types";

export class WASMSection<SectionContent> {
    byteLen : number = 0;
    content : Array<SectionContent> = [];
}

export class WASMFuncType {
    args : Array<WASMValueType> = [];
    ret : WASMValueType = WASMValueType.nil;
}

export class WASMLimit {
    hasMax : boolean = false;
    min : number = 0;
    max : number = 0;
}

export class WASMSection2Content {
    module : string = "";
    name : string = "";
    kind : WASMDeclType = WASMDeclType.func;
    index : number = 0;
    type : WASMValueType = WASMValueType.nil;
}

export class WASMSection3Content {
    index : number = 0;
}

export class WASMSection4Content {
    refKind : WASMRefType = WASMRefType.funcref;
    limit : WASMLimit = new WASMLimit();
}

export class WASMSection7Content {
    name : string = "";
    kind : number = 0;
    index : number = 0;
}

export class WASMSection8Content {
    byteLen : number = 0;
    index : number = 0;
}

export class WASMLocalEnum {
    type : WASMValueType = WASMValueType.i32;
    count : number = 0;
}

export class WASMSection10Content {
    byteLen : number = 0;
    funcSig : number = 0;
    locals : Array<WASMLocalEnum> = [];
    localTypes : Array<WASMValueType> = [];
    code : Array<InstrNode> = [];
}

export class WASMSection11Content {
    kind : number = 0;
    memidx : number = 0;
    offset : InstrNode = new InstrNode();
    data : Uint8Array = new Uint8Array(0);
};

export class WASMSection12Content {
    byteLen : number = 0;
    dataCount : number = 0;
}