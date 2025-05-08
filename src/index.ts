import { Reader } from "./helpers/Lexer"; 

const arr = new Uint8Array([0,0,128,63]);
const r = new Reader(arr);
console.log(r.read_float32());