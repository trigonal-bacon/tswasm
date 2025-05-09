"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var Convert_1 = require("./interpret/Convert");
var Code_1 = require("./spec/Code");
var Global_1 = require("./interface/Global");
var Module_1 = require("./compile/Module");
var buf = fs.readFileSync("test/stuff.wasm");
var buf2 = new Uint8Array(buf.length);
for (var i = 0; i < buf.length; ++i)
    buf2[i] = buf[i];
var bin = new Uint8Array(buf2).buffer;
var A = new Module_1.default(bin);
var c = A.repr;
//convertToExecForm(c);
var p = (0, Convert_1.default)(c);
//console.log(p.code);
var glob = new Global_1.WASMGlobalImport({ value: "i32", mutable: true });
//console.log(glob.value);
p.initializeImports({
    "env": {
        "g": glob
    },
    "foo": {
        "bar": console.log
    }
}, c.section2.content);
console.log(p.run(2, [Code_1.WASMValue.createF32Literal(-138)]));
//console.log(glob.value);
