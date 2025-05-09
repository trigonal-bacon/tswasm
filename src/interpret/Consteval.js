"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = evalConstExpr;
var OpCode_1 = require("../spec/OpCode");
//does not allow for globals, will fix later
function evalConstExpr(expr) {
    for (var _i = 0, expr_1 = expr; _i < expr_1.length; _i++) {
        var instr = expr_1[_i];
        switch (instr.instr) {
            case OpCode_1.WASMOPCode.op_global_get:
                throw new Error("global_get constexpr not yet supported");
                break;
            case OpCode_1.WASMOPCode.op_i32_const:
            case OpCode_1.WASMOPCode.op_i64_const:
            case OpCode_1.WASMOPCode.op_f32_const:
            case OpCode_1.WASMOPCode.op_f64_const:
                return instr.immediates[0];
            default:
                throw new Error("Not a constexpr");
                break;
        }
    }
    throw new Error("Failed to evaluate constexpr");
}
