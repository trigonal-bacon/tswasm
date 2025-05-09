import WASMParser from "./Parser";
import WASMRepr from "./Repr";

export default class WASMModule extends WASMRepr {
    constructor(bin : ArrayBuffer) {
        super();
        const buf = new Uint8Array(bin);
        const parser = new WASMParser(buf);
        parser.parse(this);
    }
}