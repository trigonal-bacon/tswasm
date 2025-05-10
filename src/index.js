"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebAssembly = void 0;
var Module_1 = require("./compile/Module");
var Memory_1 = require("./interface/Memory");
var Table_1 = require("./interface/Table");
var Interpreter_1 = require("./interpret/Interpreter");
var Error_1 = require("./spec/Error");
exports.WebAssembly = {
    compile: function (buf) {
        return new Promise(function (res, rej) {
            //if (!(buf instanceof ArrayBuffer))
            //return rej(new Error(`Cannot instantiate a non-buffer object`));
            var module = new Module_1.default(buf);
            res(module);
        });
    },
    instantiate: function (buf, imports) {
        if (imports === void 0) { imports = {}; }
        return new Promise(function (res, rej) {
            //if (!(buf instanceof ArrayBuffer))
            //return rej(new Error(`Cannot instantiate a non-buffer object`));
            var module = new Module_1.default(buf);
            var instance = new Interpreter_1.Program(module, imports);
            res({ module: module, instance: instance });
        });
    },
    Module: Module_1.default,
    Instance: Interpreter_1.Program,
    Table: Table_1.default,
    Memory: Memory_1.default,
    CompileError: Error_1.CompileError,
    LinkError: Error_1.LinkError,
    RuntimeError: Error_1.RuntimeError,
};
