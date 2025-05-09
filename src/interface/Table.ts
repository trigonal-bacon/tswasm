const DEFAULT_TABLE_MAX = 1 << 23;

export default class WASMTable {
    elements : Array<number>;
    init : number = 0;
    max : number = 0;

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
    }

    get length() {
        return this.elements.length;
    }

    get(idx : number) : number {
        if (idx >= this.init)
            throw new Error("Table index out of bounds");
        return this.elements[idx];
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