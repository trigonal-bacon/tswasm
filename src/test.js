"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("./index");
var Global_1 = require("./interface/Global");
var fs = require("fs");
var buf = fs.readFileSync("test/import.wasm");
var buf2 = new Uint8Array(buf.length);
for (var i = 0; i < buf.length; ++i)
    buf2[i] = buf[i];
var bin = new Uint8Array(buf2).buffer;
var glob = new Global_1.WASMExternalGlobal({ value: "i32", mutable: true });
index_1.WebAssembly.instantiate(bin, {
    "a": {},
    "env": {
        "g": glob
    },
    "foo": {
        "bar": console.log
    }
}).then(function (obj) {
    obj.instance.run(0, []);
    console.log(obj.instance.exports);
});
/*
const A = new WASMModule(bin);
//console.log(p.code);
console.log(glob.value);
const prog = new Program(A, {
    "a": {
    },
    "env": {
        "g" : glob
    },
    "foo": {
        "bar": console.log
    }
})
prog.run(0, []);
//console.log(prog.run(2, [WASMValue.createF32Literal(-138)]));
console.log(glob.value);
*/ 
