"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WASMSection12Content = exports.WASMSection11Content = exports.WASMSection10Content = exports.WASMSection9Content = exports.WASMLocalEnum = exports.WASMSection8Content = exports.WASMSection7Content = exports.WASMSection6Content = exports.WASMSection4Content = exports.WASMSection3Content = exports.WASMSection2Content = exports.WASMLimit = exports.WASMFuncType = exports.WASMSection = void 0;
var types_1 = require("./types");
var WASMSection = /** @class */ (function () {
    function WASMSection() {
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
        this.limits = new WASMLimit();
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
var WASMSection6Content = /** @class */ (function () {
    function WASMSection6Content() {
        this.type = new types_1.WASMGlobalType();
        this.expr = [];
    }
    return WASMSection6Content;
}());
exports.WASMSection6Content = WASMSection6Content;
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
var WASMSection9Content = /** @class */ (function () {
    function WASMSection9Content() {
        this.kind = 0;
        this.offset = [];
        this.funcrefs = [];
    }
    return WASMSection9Content;
}());
exports.WASMSection9Content = WASMSection9Content;
var WASMSection10Content = /** @class */ (function () {
    function WASMSection10Content() {
        this.byteLen = 0;
        this.locals = [];
        this.code = [];
    }
    return WASMSection10Content;
}());
exports.WASMSection10Content = WASMSection10Content;
var WASMSection11Content = /** @class */ (function () {
    function WASMSection11Content() {
        this.kind = 0;
        this.memidx = 0;
        this.offset = [];
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
