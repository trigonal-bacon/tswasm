"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toTruthy = toTruthy;
exports.popcnt32 = popcnt32;
exports.ctz32 = ctz32;
exports.rotl32 = rotl32;
exports.rotr32 = rotr32;
exports.rotl64 = rotl64;
exports.rotr64 = rotr64;
function toTruthy(b) {
    return b ? 1 : 0;
}
function popcnt32(i) {
    var count = 0;
    i >>>= 0;
    i = i - ((i >> 1) & 0x55555555);
    i = (i & 0x33333333) + ((i >> 2) & 0x33333333);
    i = (i + (i >> 4)) & 0x0f0f0f0f;
    i = i + (i >> 8);
    i = i + (i >> 16);
    count += i & 0x3f;
    return count;
}
function ctz32(i) {
    i >>>= 0;
    if (i === 0)
        return 32;
    i &= -i;
    return 31 - Math.clz32(i);
}
function rotl32(i, r) {
    r &= 0x1f;
    return (i << r) | (i >>> (32 - r));
}
function rotr32(i, r) {
    r &= 0x1f;
    return (i >>> r) | (i << (32 - r));
}
function rotl64(i, r) {
    r &= BigInt(0x3f);
    return (i << r) | (i >> (BigInt(64) - r));
}
function rotr64(i, r) {
    r &= BigInt(0x3f);
    return (i >> r) | (i << (BigInt(64) - r));
}
