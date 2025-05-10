"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("./index");
var Global_1 = require("./interface/Global");
var fs = require("fs");
var buf = fs.readFileSync("emscripten/a.out.wasm");
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
        "bar": console.log,
        "baz": console.log,
        "bax": console.log
    }
}).then(function (obj) {
    //console.log(obj.instance.exports.addTwo(1.1,1.3,25.34,"hi"));
});
