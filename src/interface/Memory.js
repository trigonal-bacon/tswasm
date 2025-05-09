"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PAGE_SIZE = 65536;
var WASMMemory = /** @class */ (function () {
    function WASMMemory(options) {
        this.buffer = new Uint8Array(0);
        this.init = 0;
        this.max = 0;
        if (typeof options !== "object")
            throw new Error("Invalid memory options: must be an object");
        if (typeof options.maximum === "number")
            this.max = options.maximum;
        if (typeof options.initial === "number")
            this.init = options.initial;
        if (this.max < this.init)
            throw new Error("Memory limit must be greater than initial");
        this.max = Math.max(this.max, this.init);
        this.buffer = new Uint8Array(this.init * PAGE_SIZE);
    }
    Object.defineProperty(WASMMemory.prototype, "length", {
        get: function () {
            return this.init * PAGE_SIZE;
        },
        enumerable: false,
        configurable: true
    });
    return WASMMemory;
}());
exports.default = WASMMemory;
