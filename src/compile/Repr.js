"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sections_1 = require("../spec/sections");
var WASMRepr = /** @class */ (function () {
    function WASMRepr() {
        this.funcTypes = [];
        this.globalTypes = [];
        this.importFunc = 0;
        this.importGlobal = 0;
        this.section1 = new sections_1.WASMSection();
        this.section2 = new sections_1.WASMSection();
        this.section3 = new sections_1.WASMSection();
        this.section4 = new sections_1.WASMSection();
        this.section5 = new sections_1.WASMSection();
        this.section6 = new sections_1.WASMSection();
        this.section7 = new sections_1.WASMSection();
        this.section8 = new sections_1.WASMSection8Content();
        this.section9 = new sections_1.WASMSection();
        this.section10 = new sections_1.WASMSection();
        this.section11 = new sections_1.WASMSection();
        this.section12 = new sections_1.WASMSection12Content();
        this.sections = new Array(13).fill(false);
    }
    WASMRepr.prototype.has_section = function (sec) {
        return this.sections[sec];
    };
    WASMRepr.prototype.validate = function () {
        if (this.has_section(12) && this.has_section(11)) {
            if (this.section12.dataCount !== this.section11.content.length) {
                throw new Error("Invalid data count " + this.section12.dataCount + " | " + this.section11.content.length);
            }
        }
        if (this.has_section(3)) {
            if (!this.has_section(1))
                throw new Error("Missing functype section");
            for (var i = 0; i < this.funcTypes.length; ++i) {
                if (this.funcTypes[i] >= this.section1.content.length)
                    throw new Error("Invalid functype for $func" + i + " of " + this.funcTypes[i]);
            }
        }
        if (this.has_section(10)) {
            if (this.section10.content.length !== this.section3.content.length)
                throw new Error("Function count mismatch: ".concat(this.section3.content.length, " declared, ").concat(this.section10.content.length, " iniialized"));
        }
    };
    return WASMRepr;
}());
exports.default = WASMRepr;
