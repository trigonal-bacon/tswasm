const CONVERSION_BUFFER = new ArrayBuffer(8); 
export const CONVERSION_UINT8 = new Uint8Array(CONVERSION_BUFFER);
export const CONVERSION_INT8 = new Int8Array(CONVERSION_BUFFER);
export const CONVERSION_UINT16 = new Uint16Array(CONVERSION_BUFFER);
export const CONVERSION_INT16 = new Int16Array(CONVERSION_BUFFER);
export const CONVERSION_UINT32 = new Uint32Array(CONVERSION_BUFFER);
export const CONVERSION_INT32 = new Int32Array(CONVERSION_BUFFER);
export const CONVERSION_FLOAT32 = new Float32Array(CONVERSION_BUFFER);
export const CONVERSION_UINT64 = new BigUint64Array(CONVERSION_BUFFER);
export const CONVERSION_INT64 = new BigInt64Array(CONVERSION_BUFFER);
export const CONVERSION_FLOAT64 = new Float64Array(CONVERSION_BUFFER);

export function toConvert(src : Uint8Array, ptr : number, size : number) : void {
    if (ptr < 0 || ptr + size > src.length)
        throw new RangeError(`Memory slice [${ptr}, ${ptr + size}] out of bounds`);
    CONVERSION_UINT8.set(src.subarray(ptr, ptr + size), 0);
}

export function fromConvert(src : Uint8Array, ptr : number, size : number) : void {
    if (ptr < 0 || ptr + size > src.length)
        throw new RangeError(`Memory slice [${ptr}, ${ptr + size}] out of bounds`);
    src.set(CONVERSION_UINT8.subarray(0, size), ptr);
}