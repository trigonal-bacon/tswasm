"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WASMRefType = exports.WASMDeclType = exports.WASMValueType = void 0;
var WASMValueType;
(function (WASMValueType) {
    WASMValueType[WASMValueType["nil"] = 64] = "nil";
    WASMValueType[WASMValueType["f64"] = 124] = "f64";
    WASMValueType[WASMValueType["f32"] = 125] = "f32";
    WASMValueType[WASMValueType["i64"] = 126] = "i64";
    WASMValueType[WASMValueType["i32"] = 127] = "i32";
    WASMValueType[WASMValueType["u32"] = 128] = "u32"; //NOT IN SPEC
})(WASMValueType || (exports.WASMValueType = WASMValueType = {}));
var WASMDeclType;
(function (WASMDeclType) {
    WASMDeclType[WASMDeclType["func"] = 0] = "func";
    WASMDeclType[WASMDeclType["table"] = 1] = "table";
    WASMDeclType[WASMDeclType["mem"] = 2] = "mem";
    WASMDeclType[WASMDeclType["global"] = 3] = "global";
})(WASMDeclType || (exports.WASMDeclType = WASMDeclType = {}));
var WASMRefType;
(function (WASMRefType) {
    WASMRefType[WASMRefType["funcref"] = 112] = "funcref";
    WASMRefType[WASMRefType["externref"] = 111] = "externref";
})(WASMRefType || (exports.WASMRefType = WASMRefType = {}));
