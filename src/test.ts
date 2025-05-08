import WASMRepr from "./compile/Parser"

import * as fs from "fs";

const buf = fs.readFileSync("test/big.wasm");

const b = new WASMRepr(buf);