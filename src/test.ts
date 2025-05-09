import WASMParser from "./compile/Parser"

import * as fs from "fs";
import { WASMValue } from "./spec/Code";
import { WASMGlobalImport } from "./interface/Global";
import WASMRepr from "./compile/Repr";
import WASMModule from "./compile/Module";
import { Program } from "./interpret/Interpreter";

const buf = fs.readFileSync("test/stuff.wasm");

const buf2 = new Uint8Array(buf.length);
for (let i = 0; i < buf.length; ++i) buf2[i] = buf[i];

const bin = new Uint8Array(buf2).buffer;
const A = new WASMModule(bin);
//convertToExecForm(c);
//console.log(p.code);
const glob = new WASMGlobalImport({ value: "i32", mutable: true });
//console.log(glob.value);
const prog = new Program(A, {
    "env": {
        "g" : glob
    },
    "foo": {
        "bar": console.log
    }
})
prog.run(2, [WASMValue.createF32Literal(0)]);
//console.log(prog.run(2, [WASMValue.createF32Literal(-138)]));
//console.log(glob.value);
