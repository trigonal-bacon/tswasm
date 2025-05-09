import WASMParser from "./Parser";
import WASMRepr from "./Repr";

export default class WASMModule {
    repr : WASMRepr;
    constructor(bin : ArrayBuffer) {
        const buf = new Uint8Array(bin);
        this.repr = new WASMRepr();
        const parser = new WASMParser(buf);
        parser.parse(this.repr);
    }
}