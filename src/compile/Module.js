"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Parser_1 = require("./Parser");
var Repr_1 = require("./Repr");
var WASMModule = /** @class */ (function (_super) {
    __extends(WASMModule, _super);
    function WASMModule(bin) {
        var _this = _super.call(this) || this;
        var buf = new Uint8Array(bin);
        var parser = new Parser_1.default(buf);
        parser.parse(_this);
        return _this;
    }
    return WASMModule;
}(Repr_1.default));
exports.default = WASMModule;
