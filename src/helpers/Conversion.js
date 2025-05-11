"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONVERSION_FLOAT64 = exports.CONVERSION_INT64 = exports.CONVERSION_UINT64 = exports.CONVERSION_FLOAT32 = exports.CONVERSION_INT32 = exports.CONVERSION_UINT32 = exports.CONVERSION_INT16 = exports.CONVERSION_UINT16 = exports.CONVERSION_INT8 = exports.CONVERSION_UINT8 = void 0;
exports.toConvert = toConvert;
exports.fromConvert = fromConvert;
var CONVERSION_BUFFER = new ArrayBuffer(8);
exports.CONVERSION_UINT8 = new Uint8Array(CONVERSION_BUFFER);
exports.CONVERSION_INT8 = new Int8Array(CONVERSION_BUFFER);
exports.CONVERSION_UINT16 = new Uint16Array(CONVERSION_BUFFER);
exports.CONVERSION_INT16 = new Int16Array(CONVERSION_BUFFER);
exports.CONVERSION_UINT32 = new Uint32Array(CONVERSION_BUFFER);
exports.CONVERSION_INT32 = new Int32Array(CONVERSION_BUFFER);
exports.CONVERSION_FLOAT32 = new Float32Array(CONVERSION_BUFFER);
exports.CONVERSION_UINT64 = new BigUint64Array(CONVERSION_BUFFER);
exports.CONVERSION_INT64 = new BigInt64Array(CONVERSION_BUFFER);
exports.CONVERSION_FLOAT64 = new Float64Array(CONVERSION_BUFFER);
function toConvert(src, ptr, size) {
    exports.CONVERSION_UINT8.set(src.subarray(ptr, ptr + size), 0);
}
function fromConvert(src, ptr, size) {
    src.set(exports.CONVERSION_UINT8.subarray(0, size), ptr);
}
