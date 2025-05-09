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
} from "../spec/sections";
import { WASMGlobalType } from "../spec/types";

export default class WASMRepr {
    funcTypes : Array<number> = [];
    globalTypes : Array<WASMGlobalType> = [];
    importFunc : number = 0;
    importGlobal : number = 0;
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
    sections : Array<boolean> = new Array(13).fill(false);

    has_section(sec : number) : boolean {
        return this.sections[sec];
    }

    validate() {
        if (this.has_section(12) && this.has_section(11)) {
            if (this.section12.dataCount !== this.section11.content.length) {
                throw new Error("Invalid data count " + this.section12.dataCount + " | " + this.section11.content.length);
            }
        }
        if (this.has_section(3)) {
            if (!this.has_section(1)) 
                throw new Error("Missing functype section");
            for (let i = 0; i < this.funcTypes.length; ++i) {
                if (this.funcTypes[i] >= this.section1.content.length)
                    throw new Error("Invalid functype for $func" + i + " of " + this.funcTypes[i]);
            }
        }
        if (this.has_section(10)) {
            if (this.section10.content.length !== this.section3.content.length)
                throw new Error(`Function count mismatch: ${this.section3.content.length} declared, ${this.section10.content.length} iniialized`);
            //typecheck and check for out-of-bound function and local references
        }
        //check for existence of only one memory segment?
    }
}