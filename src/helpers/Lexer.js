"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reader = void 0;
var CONVERSION_BUFFER = new ArrayBuffer(8);
var CONVERSION_UINT8 = new Uint8Array(CONVERSION_BUFFER);
var CONVERSION_UINT32 = new Uint32Array(CONVERSION_BUFFER);
var CONVERSION_INT32 = new Int32Array(CONVERSION_BUFFER);
var CONVERSION_FLOAT32 = new Float32Array(CONVERSION_BUFFER);
var CONVERSION_UINT64 = new BigUint64Array(CONVERSION_BUFFER);
var CONVERSION_INT64 = new BigInt64Array(CONVERSION_BUFFER);
var CONVERSION_FLOAT64 = new Float64Array(CONVERSION_BUFFER);
var TEXT_DECODER = new TextDecoder();
var Reader = /** @class */ (function () {
    function Reader(buf) {
        this.buf = buf;
        this.at = 0;
    }
    Reader.prototype.has = function () {
        return this.at < this.buf.length;
    };
    Reader.prototype.back = function () {
        if (this.at > 0)
            this.at--;
    };
    Reader.prototype.read_uint8 = function () {
        if (this.at >= this.buf.length) {
            throw new Error("Unexpected EOF");
        }
        return this.buf[this.at++]; //guaranteed byte
    };
    Reader.prototype.read_uint32 = function () {
        CONVERSION_UINT32[0] = 0;
        var shift = 0;
        var u8 = this.read_uint8();
        while (u8 & 0x80) {
            CONVERSION_UINT32[0] |= (u8 & 0x7F) << shift;
            shift += 7;
            if (shift >= 32)
                break; //error;
            u8 = this.read_uint8();
        }
        CONVERSION_UINT32[0] |= (u8 << shift); //only get last 4 bits from 5th byte
        return CONVERSION_UINT32[0];
    };
    Reader.prototype.read_int32 = function () {
        CONVERSION_INT32[0] = 0;
        var shift = 0;
        var u8 = this.read_uint8();
        while (u8 & 0x80) {
            CONVERSION_INT32[0] |= (u8 & 0x7F) << shift;
            shift += 7;
            if (shift >= 32)
                break; //error;
            u8 = this.read_uint8();
        }
        CONVERSION_INT32[0] |= (u8 << shift); //only get last 4 bits from 5th byte
        if (u8 & 0x40 && shift <= 7 * 3)
            CONVERSION_INT32[0] |= (~0 << (shift + 7));
        return CONVERSION_INT32[0];
    };
    Reader.prototype.read_uint64 = function () {
        CONVERSION_UINT64[0] = BigInt(0);
        var shift = BigInt(0);
        var u8 = BigInt(this.read_uint8());
        while (u8 & BigInt(0x80)) {
            CONVERSION_UINT64[0] |= (u8 & BigInt(0x7F)) << shift; //no need to prevent underflow with bignums
            shift += BigInt(7);
            if (shift >= BigInt(64))
                break; //error;
            u8 = BigInt(this.read_uint8());
        }
        CONVERSION_UINT64[0] |= (u8 << shift); //only get last one bit from 10th byte
        return CONVERSION_UINT64[0];
    };
    Reader.prototype.read_int64 = function () {
        CONVERSION_INT64[0] = BigInt(0);
        var shift = BigInt(0);
        var u8 = BigInt(this.read_uint8());
        while (u8 & BigInt(0x80)) {
            CONVERSION_INT64[0] |= (u8 & BigInt(0x7F)) << shift; //no need to prevent underflow with bignums
            shift += BigInt(7);
            if (shift >= BigInt(64))
                break; //error;
            u8 = BigInt(this.read_uint8());
        }
        CONVERSION_INT64[0] |= (u8 << shift); //only get last one bit from 10th byte
        if (u8 & BigInt(0x40) && shift <= BigInt(7 * 8))
            CONVERSION_INT64[0] |= (~BigInt(0) << (shift + BigInt(7)));
        return CONVERSION_INT64[0];
    };
    Reader.prototype.read_float32 = function () {
        if (this.at + 4 >= this.buf.length)
            return 0; //error
        CONVERSION_UINT8.set(this.buf.subarray(this.at, this.at += 4), 0);
        return CONVERSION_FLOAT32[0];
    };
    Reader.prototype.read_float64 = function () {
        if (this.at + 8 >= this.buf.length)
            return 0; //error
        CONVERSION_UINT8.set(this.buf.subarray(this.at, this.at += 8), 0);
        return CONVERSION_FLOAT64[0];
    };
    Reader.prototype.read_string = function () {
        var len = this.read_uint32();
        if (this.at + len >= this.buf.length)
            return ""; //error
        var buf = TEXT_DECODER.decode(this.buf.slice(this.at, this.at += len));
        return buf;
    };
    return Reader;
}());
exports.Reader = Reader;
