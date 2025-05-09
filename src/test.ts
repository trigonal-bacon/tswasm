import WASMParser from "./compile/Parser"

import * as fs from "fs";
import createProgramFromRepr from "./interpret/Convert";
import { WASMValue } from "./spec/Code";
import { WASMGlobalImport } from "./interface/Global";
import WASMRepr from "./compile/Repr";
import WASMModule from "./compile/Module";

const buf = fs.readFileSync("test/stuff.wasm");

const buf2 = new Uint8Array(buf.length);
for (let i = 0; i < buf.length; ++i) buf2[i] = buf[i];

const bin = new Uint8Array(buf2).buffer;
const A = new WASMModule(bin);
const c = A.repr;
//convertToExecForm(c);

const p = createProgramFromRepr(c);
//console.log(p.code);
const glob = new WASMGlobalImport({ value: "i32", mutable: true });
//console.log(glob.value);
p.initializeImports({
    "env": {
        "g" : glob
    },
    "foo": {
        "bar": console.log
    }
}, c.section2.content);
console.log(p.run(2, [WASMValue.createF32Literal(-138)]));
//console.log(glob.value);
