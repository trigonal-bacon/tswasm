import { WebAssembly } from "./index"
import { WASMExternalGlobal } from "./interface/Global";

import * as fs from "fs";

const buf = fs.readFileSync("test/import.wasm");

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
        "bar": console.log
    }
}).then(obj => {
    obj.instance.run(0, []);
});
