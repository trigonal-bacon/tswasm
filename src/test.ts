import WASMParser from "./compile/Parser"

import * as fs from "fs";
import createProgramFromRepr from "./interpret/Convert";
import { WASMValue } from "./spec/Code";
import { WASMGlobalImport } from "./interface/Global";

const buf = fs.readFileSync("test/stuff.wasm");

const b = new WASMParser(buf);
const c = b.parse();
c.validate();
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
console.log(p.run(2, [WASMValue.createF32Literal(19564323528)]));
//console.log(glob.value);