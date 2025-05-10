import { WebAssembly } from "./index"
import { WASMExternalGlobal } from "./interface/Global";

import * as fs from "fs";

const buf = fs.readFileSync("emscripten/a.out.wasm");

const buf2 = new Uint8Array(buf.length);
for (let i = 0; i < buf.length; ++i) buf2[i] = buf[i];

const bin = new Uint8Array(buf2).buffer;

const glob = new WASMExternalGlobal({ value: "i32", mutable: true });
WebAssembly.instantiate(bin, {
    "a": {
    },
    "env": {
        "g" : glob
    },
    "foo": {
        "bar": console.log,
        "baz": console.log,
        "bax": console.log
    }
}).then(obj => {
    //console.log(obj.instance.exports.addTwo(1.1,1.3,25.34,"hi"));
});
