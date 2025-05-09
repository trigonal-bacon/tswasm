import { InstrNode, WASMValue } from "../spec/Code";
import { WASMOPCode } from "../spec/OpCode";

//does not allow for globals, will fix later
export default function evalConstExpr(expr : Array<InstrNode>) : WASMValue {
    for (const instr of expr) {
        switch (instr.instr) {
            case WASMOPCode.op_global_get:
                throw new Error("global_get constexpr not yet supported");
                break;
            case WASMOPCode.op_i32_const:
            case WASMOPCode.op_i64_const:
            case WASMOPCode.op_f32_const:
            case WASMOPCode.op_f64_const:
                return instr.immediates[0];
            default:
                throw new Error("Not a constexpr");
                break;
        }
    }
    throw new Error("Failed to evaluate constexpr");
}