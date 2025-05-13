import WASMParser from "./Parser";
import WASMRepr from "./Repr";

export default class WASMModule extends WASMRepr {
    constructor(buf : Uint8Array) {
        const start = performance.now();
        super();
        const parser = new WASMParser(buf);
        parser.parse(this);
        console.log(`Compiling took ${(performance.now() - start).toFixed(2)}ms`);
    }
}