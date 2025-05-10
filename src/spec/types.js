"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WASMGlobalType = exports.WASMRefType = exports.WASMDeclType = exports.WASMValueType = void 0;
exports.typeToString = typeToString;
exports.typeArrayToString = typeArrayToString;
var WASMValueType;
(function (WASMValueType) {
    WASMValueType[WASMValueType["nil"] = 64] = "nil";
    WASMValueType[WASMValueType["f64"] = 124] = "f64";
    WASMValueType[WASMValueType["f32"] = 125] = "f32";
    WASMValueType[WASMValueType["i64"] = 126] = "i64";
    WASMValueType[WASMValueType["i32"] = 127] = "i32";
    WASMValueType[WASMValueType["u32"] = 128] = "u32"; //NOT IN SPEC
})(WASMValueType || (exports.WASMValueType = WASMValueType = {}));
function typeToString(t) {
    switch (t) {
        case WASMValueType.nil: return "nil";
        case WASMValueType.i32: return "i32";
        case WASMValueType.f32: return "f32";
        case WASMValueType.i64: return "i64";
        case WASMValueType.f64: return "f32";
    }
    return "unk";
}
function typeArrayToString(t) {
    return t.map(function (x) { return typeToString(x); }).join(' ');
}
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
var WASMGlobalType = /** @class */ (function () {
    function WASMGlobalType() {
        this.mutable = false;
        this.type = WASMValueType.i32;
    }
    return WASMGlobalType;
}());
exports.WASMGlobalType = WASMGlobalType;
