"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Parser_1 = require("./Parser");
var Repr_1 = require("./Repr");
var WASMModule = /** @class */ (function () {
    function WASMModule(bin) {
        var buf = new Uint8Array(bin);
        this.repr = new Repr_1.default();
        var parser = new Parser_1.default(buf);
        parser.parse(this.repr);
    }
    return WASMModule;
}());
exports.default = WASMModule;
