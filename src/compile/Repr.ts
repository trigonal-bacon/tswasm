import { 
    WASMSection, WASMFuncType,
    WASMLimit, WASMLocalEnum,
    WASMSection2Content,
    WASMSection3Content,
    WASMSection4Content,
    WASMSection7Content,
    WASMSection8Content,
    WASMSection10Content,
    WASMSection11Content,
    WASMSection12Content, 
} from "../spec/sections";
import { WASMValueType } from "../spec/types";

export default class WASMRepr {
    funcTypes : Array<Number> = [];
    globalTypes : Array<WASMValueType> = [];
    importFunc : number = 0;
    importGlobal : number = 0;
    section1 : WASMSection<WASMFuncType> = new WASMSection();
    section2 : WASMSection<WASMSection2Content> = new WASMSection();
    section3 : WASMSection<WASMSection3Content> = new WASMSection();
    section4 : WASMSection<WASMSection4Content> = new WASMSection();
    section5 : WASMSection<WASMLimit> = new WASMSection();
    section7 : WASMSection<WASMSection7Content> = new WASMSection();
    section8 : WASMSection8Content = new WASMSection8Content();
    section10 : WASMSection<WASMSection10Content> = new WASMSection();
    section11 : WASMSection<WASMSection11Content> = new WASMSection();
    section12 : WASMSection12Content = new WASMSection12Content();
    sections : Array<boolean> = new Array(13).fill(false);
}