import { WASMOPDef } from "../spec/OpCode";
import { 
    WASMSection, WASMFuncType,
    WASMLimit,
    WASMSection2Content,
    WASMSection3Content,
    WASMSection4Content,
    WASMSection7Content,
    WASMSection8Content,
    WASMSection10Content,
    WASMSection11Content,
    WASMSection12Content,
    WASMSection9Content,
    WASMSection6Content, 
} from "../spec/Sections";
import { WASMGlobalType, WASMValueType } from "../spec/Types";


export default class WASMRepr {
    funcTypes : Array<number> = [];
    globalTypes : Array<WASMGlobalType> = [];
    importFunc : number = 0;
    importGlobal : number = 0;
    tableCount : number = 0;
    memoryCount : number = 0;
    section1 : WASMSection<WASMFuncType> = new WASMSection();
    section2 : WASMSection<WASMSection2Content> = new WASMSection();
    section3 : WASMSection<WASMSection3Content> = new WASMSection();
    section4 : WASMSection<WASMSection4Content> = new WASMSection();
    section5 : WASMSection<WASMLimit> = new WASMSection();
    section6 : WASMSection<WASMSection6Content> = new WASMSection();
    section7 : WASMSection<WASMSection7Content> = new WASMSection();
    section8 : WASMSection8Content = new WASMSection8Content();
    section9 : WASMSection<WASMSection9Content> = new WASMSection();
    section10 : WASMSection<WASMSection10Content> = new WASMSection();
    section11 : WASMSection<WASMSection11Content> = new WASMSection();
    section12 : WASMSection12Content = new WASMSection12Content();
    sectionLengths : Array<number> = new Array(13).fill(0);

    has_section(sec : number) : boolean {
        return this.sectionLengths[sec] !== 0;
    }
}