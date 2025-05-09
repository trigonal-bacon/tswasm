"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DEFAULT_TABLE_MAX = 1 << 23;
var WASMTable = /** @class */ (function () {
    function WASMTable(options) {
        this.init = 0;
        this.max = 0;
        if (typeof options !== "object")
            throw new Error("Table options must be an object");
        if (typeof options.maximum === "number")
            this.max = options.maximum;
        else
            this.max = DEFAULT_TABLE_MAX;
        if (typeof options.initial === "number")
            this.init = options.initial;
        if (this.max < this.init)
            throw new Error("Table max must be no less than table init");
        this.max = Math.max(this.max, this.init);
        this.elements = new Array(this.init).fill(0);
    }
    Object.defineProperty(WASMTable.prototype, "length", {
        get: function () {
            return this.elements.length;
        },
        enumerable: false,
        configurable: true
    });
    WASMTable.prototype.get = function (idx) {
        if (idx >= this.init)
            throw new Error("Table index out of bounds");
        return this.elements[idx];
    };
    WASMTable.prototype.set = function (idx, v) {
        if (idx >= this.init)
            throw new Error("Table index out of bounds");
        this.elements[idx] = v;
    };
    WASMTable.prototype.grow = function (n) {
        if (n + this.init > this.max)
            this.init = this.max;
        else
            this.init += n;
        for (var i = 0; i < n; ++i)
            this.elements.push(0);
    };
    return WASMTable;
}());
exports.default = WASMTable;
