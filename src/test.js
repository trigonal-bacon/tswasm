"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Parser_1 = require("./compile/Parser");
var fs = require("fs");
var Convert_1 = require("./interpret/Convert");
var Code_1 = require("./spec/Code");
var Global_1 = require("./interface/Global");
var buf = fs.readFileSync("test/stuff.wasm");
var b = new Parser_1.default(buf);
var c = b.parse();
c.validate();
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
console.log(p.run(2, [Code_1.WASMValue.createF32Literal(19564323528)]));
//console.log(glob.value);
