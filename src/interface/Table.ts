const DEFAULT_TABLE_MAX = 1 << 23;

export default class WASMTable {
    elements : Array<number>;
    init : number = 0;
    max : number = 0;

    __funcRefs : Array<Function>;
    constructor(options : any) {
        if (typeof options !== "object")
            throw new Error("Table options must be an object");

        if (typeof options.maximum === "number")
            this.max = options.maximum
        else
            this.max = DEFAULT_TABLE_MAX;

        if (typeof options.initial === "number")
            this.init = options.initial;

        if (this.max < this.init)
            throw new Error("Table max must be no less than table init");
        this.max = Math.max(this.max, this.init);
        this.elements = new Array(this.init).fill(0);
        this.__funcRefs = new Array(this.init);
    }

    get length() {
        return this.elements.length;
    }

    get(idx : number) : any {
        if (typeof this.__funcRefs[idx] !== "function")
            throw new RangeError(`Function at index ${idx} not initialized`);
        if (idx >= this.init)
            throw new RangeError("Table index out of bounds");
        return this.__funcRefs[idx];
    }

    set(idx : number, v : number) : void {
        if (idx >= this.init)
            throw new Error("Table index out of bounds");
        this.elements[idx] = v;
    }

    grow(n : number) : void {
        if (n + this.init > this.max) 
            this.init = this.max
        else
            this.init += n;
        for (let i = 0; i < n; ++i) this.elements.push(0);
    }
}