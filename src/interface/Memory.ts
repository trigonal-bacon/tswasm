const PAGE_SIZE = 65536;

export default class WASMMemory {
    buffer : ArrayBuffer = new ArrayBuffer();
    _buffer : Uint8Array = new Uint8Array(this.buffer);
    init : number = 0;
    max : number = 0;

    constructor(options : any) {
        if (typeof options !== "object") 
            throw new Error("Invalid memory options: must be an object");

        if (typeof options.maximum === "number")
            this.max = options.maximum;
        
        if (typeof options.initial === "number")
            this.init = options.initial;
        
        if (this.max < this.init)
            throw new Error("Memory limit must be greater than initial");
        this.max = Math.max(this.max, this.init);
        this.buffer = new ArrayBuffer(this.init * PAGE_SIZE);
        this._buffer = new Uint8Array(this.buffer);
    }

    get length() {
        return this.init * PAGE_SIZE;
    }
}