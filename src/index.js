"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebAssembly = void 0;
var Module_1 = require("./compile/Module");
var Memory_1 = require("./interface/Memory");
var Table_1 = require("./interface/Table");
var Interpreter_1 = require("./interpret/Interpreter");
var error_1 = require("./spec/error");
exports.WebAssembly = {
    instantiate: function (buf, imports) {
        if (imports === void 0) { imports = {}; }
        return new Promise(function (res, rej) {
            var module = new Module_1.default(buf);
            var instance = new Interpreter_1.Program(module, imports);
            res({ module: module, instance: instance });
        });
    },
    compile: function (buf) {
        return new Promise(function (res, rej) {
            var module = new Module_1.default(buf);
            return module;
        });
    },
    Module: Module_1.default,
    Instance: Interpreter_1.Program,
    Table: Table_1.default,
    Memory: Memory_1.default,
    CompileError: error_1.CompileError,
    LinkError: error_1.LinkError,
    RuntimeError: error_1.RuntimeError,
};
