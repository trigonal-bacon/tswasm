import WASMParser from "./Parser";
import WASMRepr from "./Repr";

export default class WASMModule extends WASMRepr {
    constructor(bin : ArrayBuffer) {
        const start = performance.now();
        super();
        const buf = new Uint8Array(bin);
        const parser = new WASMParser(buf);
        parser.parse(this);
        console.log(`Compiling took ${(performance.now() - start).toFixed(2)}ms`);
    }
}