"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WASMSection12Content = exports.WASMSection11Content = exports.WASMSection10Content = exports.WASMLocalEnum = exports.WASMSection8Content = exports.WASMSection7Content = exports.WASMSection4Content = exports.WASMSection3Content = exports.WASMSection2Content = exports.WASMLimit = exports.WASMFuncType = exports.WASMSection = void 0;
var Code_1 = require("./Code");
var types_1 = require("./types");
var WASMSection = /** @class */ (function () {
    function WASMSection() {
        this.byteLen = 0;
        this.content = [];
    }
    return WASMSection;
}());
exports.WASMSection = WASMSection;
var WASMFuncType = /** @class */ (function () {
    function WASMFuncType() {
        this.args = [];
        this.ret = types_1.WASMValueType.nil;
    }
    return WASMFuncType;
}());
exports.WASMFuncType = WASMFuncType;
var WASMLimit = /** @class */ (function () {
    function WASMLimit() {
        this.hasMax = false;
        this.min = 0;
        this.max = 0;
    }
    return WASMLimit;
}());
exports.WASMLimit = WASMLimit;
var WASMSection2Content = /** @class */ (function () {
    function WASMSection2Content() {
        this.module = "";
        this.name = "";
        this.kind = types_1.WASMDeclType.func;
        this.index = 0;
        this.type = types_1.WASMValueType.nil;
    }
    return WASMSection2Content;
}());
exports.WASMSection2Content = WASMSection2Content;
var WASMSection3Content = /** @class */ (function () {
    function WASMSection3Content() {
        this.index = 0;
    }
    return WASMSection3Content;
}());
exports.WASMSection3Content = WASMSection3Content;
var WASMSection4Content = /** @class */ (function () {
    function WASMSection4Content() {
        this.refKind = types_1.WASMRefType.funcref;
        this.limit = new WASMLimit();
    }
    return WASMSection4Content;
}());
exports.WASMSection4Content = WASMSection4Content;
var WASMSection7Content = /** @class */ (function () {
    function WASMSection7Content() {
        this.name = "";
        this.kind = 0;
        this.index = 0;
    }
    return WASMSection7Content;
}());
exports.WASMSection7Content = WASMSection7Content;
var WASMSection8Content = /** @class */ (function () {
    function WASMSection8Content() {
        this.byteLen = 0;
        this.index = 0;
    }
    return WASMSection8Content;
}());
exports.WASMSection8Content = WASMSection8Content;
var WASMLocalEnum = /** @class */ (function () {
    function WASMLocalEnum() {
        this.type = types_1.WASMValueType.i32;
        this.count = 0;
    }
    return WASMLocalEnum;
}());
exports.WASMLocalEnum = WASMLocalEnum;
var WASMSection10Content = /** @class */ (function () {
    function WASMSection10Content() {
        this.byteLen = 0;
        this.funcSig = 0;
        this.locals = [];
        this.localTypes = [];
        this.code = [];
    }
    return WASMSection10Content;
}());
exports.WASMSection10Content = WASMSection10Content;
var WASMSection11Content = /** @class */ (function () {
    function WASMSection11Content() {
        this.kind = 0;
        this.memidx = 0;
        this.offset = new Code_1.InstrNode();
        this.data = new Uint8Array(0);
    }
    return WASMSection11Content;
}());
exports.WASMSection11Content = WASMSection11Content;
;
var WASMSection12Content = /** @class */ (function () {
    function WASMSection12Content() {
        this.byteLen = 0;
        this.dataCount = 0;
    }
    return WASMSection12Content;
}());
exports.WASMSection12Content = WASMSection12Content;
