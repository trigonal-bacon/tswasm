import { InstrNode } from "./Code";
import { WASMOPDef } from "./OpCode";
import { WASMValueType, WASMDeclType, WASMRefType, WASMGlobalType } from "./Types";

export class WASMSection<SectionContent> {
    content : Array<SectionContent> = [];
}

export class WASMFuncType extends WASMOPDef {};

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
    type : WASMValueType | WASMRefType = WASMValueType.nil;
    limits : WASMLimit = new WASMLimit();
}

export class WASMSection3Content {
    index : number = 0;
}

export class WASMSection4Content {
    refKind : WASMRefType = WASMRefType.funcref;
    limit : WASMLimit = new WASMLimit();
}

export class WASMSection6Content {
    type : WASMGlobalType = new WASMGlobalType(); 
    expr : Array<InstrNode> = [];
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

export class WASMSection9Content {
    kind : number = 0;
    offset : Array<InstrNode> = [];
    funcrefs : Array<number> = [];
}

export class WASMSection10Content {
    byteLen : number = 0;
    locals : Array<WASMLocalEnum> = [];
    code : Array<InstrNode> = [];
}

export class WASMSection11Content {
    kind : number = 0;
    memidx : number = 0;
    offset : Array<InstrNode> = [];
    data : Uint8Array = new Uint8Array(0);
};

export class WASMSection12Content {
    byteLen : number = 0;
    dataCount : number = 0;
}