import {
    CONVERSION_UINT8, CONVERSION_INT8, 
    CONVERSION_UINT16, CONVERSION_INT16,
    CONVERSION_UINT32, CONVERSION_INT32, CONVERSION_FLOAT32,
    CONVERSION_UINT64, CONVERSION_INT64, CONVERSION_FLOAT64
} from "../helpers/Conversion";

const TEXT_DECODER = new TextDecoder();

export class Reader {
    buf : Uint8Array;
    at : number;
    constructor(buf : Uint8Array) {
        this.buf = buf;
        this.at = 0;
    }

    has() : boolean {
        return this.at < this.buf.length;
    }

    back() : void {
        if (this.at > 0) this.at--;
    }

    read_uint8() : number {
        if (this.at >= this.buf.length) {
            throw new Error("Unexpected EOF");
        }
        return this.buf[this.at++]; //guaranteed byte
    }

    read_instr() : number {
        const op = this.read_uint8();
        if (op === 0xFC)
            return op | (this.read_uint8() << 8);
        return op;
    }

    read_uint32() : number {
        CONVERSION_UINT32[0] = 0;
        let shift = 0;
        let u8 = this.read_uint8();
        while (u8 & 0x80) {
            CONVERSION_UINT32[0] |= (u8 & 0x7F) << shift;
            shift += 7;
            if (shift >= 32) break; //error;
            u8 = this.read_uint8();
        }
        CONVERSION_UINT32[0] |= (u8 << shift); //only get last 4 bits from 5th byte
        return CONVERSION_UINT32[0];
    }

    read_int32() : number {
        CONVERSION_INT32[0] = 0;
        let shift = 0;
        let u8 = this.read_uint8();
        while (u8 & 0x80) {
            CONVERSION_INT32[0] |= (u8 & 0x7F) << shift;
            shift += 7;
            if (shift >= 32) break; //error;
            u8 = this.read_uint8();
        }
        CONVERSION_INT32[0] |= (u8 << shift); //only get last 4 bits from 5th byte
        if (u8 & 0x40 && shift <= 7 * 3) CONVERSION_INT32[0] |= (~0 << (shift + 7));
        return CONVERSION_INT32[0];
    }

    read_uint64() : bigint {
        CONVERSION_UINT64[0] = BigInt(0);
        let shift = BigInt(0);
        let u8 = BigInt(this.read_uint8());
        while (u8 & BigInt(0x80)) {
            CONVERSION_UINT64[0] |= (u8 & BigInt(0x7F)) << shift; //no need to prevent underflow with bignums
            shift += BigInt(7);
            if (shift >= BigInt(64)) break; //error;
            u8 = BigInt(this.read_uint8());
        }
        CONVERSION_UINT64[0] |= (u8 << shift); //only get last one bit from 10th byte
        return CONVERSION_UINT64[0];
    }

    read_int64() : bigint {
        CONVERSION_INT64[0] = BigInt(0);
        let shift = BigInt(0);
        let u8 = BigInt(this.read_uint8());
        while (u8 & BigInt(0x80)) {
            CONVERSION_INT64[0] |= (u8 & BigInt(0x7F)) << shift; //no need to prevent underflow with bignums
            shift += BigInt(7);
            if (shift >= BigInt(64)) break; //error;
            u8 = BigInt(this.read_uint8());
        }
        CONVERSION_INT64[0] |= (u8 << shift); //only get last one bit from 10th byte
        if (u8 & BigInt(0x40) && shift <= BigInt(7 * 8)) CONVERSION_INT64[0] |= (~BigInt(0) << (shift + BigInt(7)));
        return CONVERSION_INT64[0];
    }

    read_float32() : number {
        if (this.at + 4 >= this.buf.length) return 0; //error
        CONVERSION_UINT8.set(this.buf.subarray(this.at, this.at += 4), 0);
        return CONVERSION_FLOAT32[0];
    }

    read_float64() : number {
        if (this.at + 8 >= this.buf.length) return 0; //error
        CONVERSION_UINT8.set(this.buf.subarray(this.at, this.at += 8), 0);
        return CONVERSION_FLOAT64[0];
    }

    read_string() : string {
        const len = this.read_uint32();
        if (this.at + len >= this.buf.length) return ""; //error
        const buf = TEXT_DECODER.decode(this.buf.slice(this.at, this.at += len));
        return buf;
    }
}

export class FixedLengthWriter {
    buf : Array<number> = [];
    at : number = 0;

    toBuffer() : Uint8Array {
        return new Uint8Array(this.buf);
    }

    write_u8(u8 : number) : void {
        CONVERSION_UINT8[0] = u8;
        this.buf[this.at++] = CONVERSION_UINT8[0];
    }

    write_instr(instr : number) : void {
        this.write_u8(instr);
        if ((instr & 0xff) === 0xfc)
            this.write_u8(instr >> 8);
    }

    retroactive_write_u32(u32 : number, ptr : number) {
        CONVERSION_UINT32[0] = u32;
        for (let i = 0; i < 4; ++i) this.buf[ptr + i] = CONVERSION_UINT8[i];
    }
    write_u32(u32 : number) : void {
        CONVERSION_UINT32[0] = u32;
        for (let i = 0; i < 4; ++i) this.buf[this.at++] = CONVERSION_UINT8[i];
    }

    write_i32(i32 : number) : void {
        CONVERSION_INT32[0] = i32;
        for (let i = 0; i < 4; ++i) this.buf[this.at++] = CONVERSION_UINT8[i];
    }

    write_f32(f32 : number) : void {
        CONVERSION_FLOAT32[0] = f32;
        for (let i = 0; i < 4; ++i) this.buf[this.at++] = CONVERSION_UINT8[i];
    }

    write_i64(i64 : bigint) : void {
        CONVERSION_INT64[0] = i64;
        for (let i = 0; i < 8; ++i) this.buf[this.at++] = CONVERSION_UINT8[i];
    }

    write_f64(f64 : number) : void {
        CONVERSION_FLOAT64[0] = f64;
        for (let i = 0; i < 8; ++i) this.buf[this.at++] = CONVERSION_UINT8[i];
    }
}

export class FixedLengthReader {
    at : number = 0;
    buf : Uint8Array;
    constructor(buf : Uint8Array) {
        this.buf = buf;
    }

    read_u8() : number {
        return this.buf[this.at++];
    }

    read_instr() {
        const code = this.read_u8();
        if (code === 0xfc) return (this.read_u8() << 8) | code;
        return code;
    }

    read_u32() : number {
        for (let i = 0; i < 4; ++i) CONVERSION_UINT8[i] = this.read_u8();
        return CONVERSION_UINT32[0];
    }

    read_i32() : number {
        for (let i = 0; i < 4; ++i) CONVERSION_UINT8[i] = this.read_u8();
        return CONVERSION_INT32[0];
    }

    read_f32() : number {
        for (let i = 0; i < 4; ++i) CONVERSION_UINT8[i] = this.read_u8();
        return CONVERSION_FLOAT32[0];
    }

    read_i64() : bigint{
        for (let i = 0; i < 8; ++i) CONVERSION_UINT8[i] = this.read_u8();
        return CONVERSION_INT64[0];
    }

    read_f64() : number {
        for (let i = 0; i < 8; ++i) CONVERSION_UINT8[i] = this.read_u8();
        return CONVERSION_FLOAT64[0];
    }
}