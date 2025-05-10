export function popcnt32(i : number) : number {
  let count = 0;
  i >>>= 0;
  i = i - ((i >> 1) & 0x55555555);
  i = (i & 0x33333333) + ((i >> 2) & 0x33333333);
  i = (i + (i >> 4)) & 0x0f0f0f0f;
  i = i + (i >> 8);
  i = i + (i >> 16);
  count += i & 0x3f;
  return count;
}

export function ctz32(i : number) : number {
    i >>>= 0;
    if (i === 0) return 32;
    i &= -i;
    return 31 - Math.clz32(i);
}

export function rotl32(i : number, r : number) : number {
    r &= 0x1f;
    return (i << r) | (i >>> (32 - r));
}

export function rotr32(i : number, r : number) : number {
    r &= 0x1f;
    return (i >>> r) | (i << (32 - r));
}

export function rotl64(i : bigint, r : bigint) : bigint {
    r &= BigInt(0x3f);
    return (i << r) | (i >> (BigInt(64) - r)); 
}

export function rotr64(i : bigint, r : bigint) : bigint {
    r &= BigInt(0x3f);
    return (i >> r) | (i << (BigInt(64) - r)); 
}