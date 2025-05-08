"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Parser_1 = require("./compile/Parser");
var fs = require("fs");
var buf = fs.readFileSync("test/big.wasm");
var b = new Parser_1.default(buf);
