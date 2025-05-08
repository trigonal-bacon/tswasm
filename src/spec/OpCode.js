"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WASMOPDefs = exports.WASMOPCode = void 0;
var types_1 = require("./types");
var WASMOPCode;
(function (WASMOPCode) {
    WASMOPCode[WASMOPCode["op_unreachable"] = 0] = "op_unreachable";
    WASMOPCode[WASMOPCode["op_nop"] = 1] = "op_nop";
    WASMOPCode[WASMOPCode["op_block"] = 2] = "op_block";
    WASMOPCode[WASMOPCode["op_loop"] = 3] = "op_loop";
    WASMOPCode[WASMOPCode["op_if"] = 4] = "op_if";
    WASMOPCode[WASMOPCode["op_else"] = 5] = "op_else";
    WASMOPCode[WASMOPCode["op_end"] = 11] = "op_end";
    WASMOPCode[WASMOPCode["op_br"] = 12] = "op_br";
    WASMOPCode[WASMOPCode["op_br_if"] = 13] = "op_br_if";
    WASMOPCode[WASMOPCode["op_br_table"] = 14] = "op_br_table";
    WASMOPCode[WASMOPCode["op_return"] = 15] = "op_return";
    WASMOPCode[WASMOPCode["op_call"] = 16] = "op_call";
    WASMOPCode[WASMOPCode["op_call_indirect"] = 17] = "op_call_indirect";
    WASMOPCode[WASMOPCode["op_drop"] = 26] = "op_drop";
    WASMOPCode[WASMOPCode["op_select"] = 27] = "op_select";
    WASMOPCode[WASMOPCode["op_local_get"] = 32] = "op_local_get";
    WASMOPCode[WASMOPCode["op_local_set"] = 33] = "op_local_set";
    WASMOPCode[WASMOPCode["op_local_tee"] = 34] = "op_local_tee";
    WASMOPCode[WASMOPCode["op_global_get"] = 35] = "op_global_get";
    WASMOPCode[WASMOPCode["op_global_set"] = 36] = "op_global_set";
    WASMOPCode[WASMOPCode["op_i32_load"] = 40] = "op_i32_load";
    WASMOPCode[WASMOPCode["op_i64_load"] = 41] = "op_i64_load";
    WASMOPCode[WASMOPCode["op_f32_load"] = 42] = "op_f32_load";
    WASMOPCode[WASMOPCode["op_f64_load"] = 43] = "op_f64_load";
    WASMOPCode[WASMOPCode["op_i32_load8_s"] = 44] = "op_i32_load8_s";
    WASMOPCode[WASMOPCode["op_i32_load8_u"] = 45] = "op_i32_load8_u";
    WASMOPCode[WASMOPCode["op_i32_load16_s"] = 46] = "op_i32_load16_s";
    WASMOPCode[WASMOPCode["op_i32_load16_u"] = 47] = "op_i32_load16_u";
    WASMOPCode[WASMOPCode["op_i64_load8_s"] = 48] = "op_i64_load8_s";
    WASMOPCode[WASMOPCode["op_i64_load8_u"] = 49] = "op_i64_load8_u";
    WASMOPCode[WASMOPCode["op_i64_load16_s"] = 50] = "op_i64_load16_s";
    WASMOPCode[WASMOPCode["op_i64_load16_u"] = 51] = "op_i64_load16_u";
    WASMOPCode[WASMOPCode["op_i64_load32_s"] = 52] = "op_i64_load32_s";
    WASMOPCode[WASMOPCode["op_i64_load32_u"] = 53] = "op_i64_load32_u";
    WASMOPCode[WASMOPCode["op_i32_store"] = 54] = "op_i32_store";
    WASMOPCode[WASMOPCode["op_i64_store"] = 55] = "op_i64_store";
    WASMOPCode[WASMOPCode["op_f32_store"] = 56] = "op_f32_store";
    WASMOPCode[WASMOPCode["op_f64_store"] = 57] = "op_f64_store";
    WASMOPCode[WASMOPCode["op_i32_store8"] = 58] = "op_i32_store8";
    WASMOPCode[WASMOPCode["op_i32_store16"] = 59] = "op_i32_store16";
    WASMOPCode[WASMOPCode["op_i64_store8"] = 60] = "op_i64_store8";
    WASMOPCode[WASMOPCode["op_i64_store16"] = 61] = "op_i64_store16";
    WASMOPCode[WASMOPCode["op_i64_store32"] = 62] = "op_i64_store32";
    WASMOPCode[WASMOPCode["op_memory_size"] = 63] = "op_memory_size";
    WASMOPCode[WASMOPCode["op_memory_grow"] = 64] = "op_memory_grow";
    WASMOPCode[WASMOPCode["op_i32_const"] = 65] = "op_i32_const";
    WASMOPCode[WASMOPCode["op_i64_const"] = 66] = "op_i64_const";
    WASMOPCode[WASMOPCode["op_f32_const"] = 67] = "op_f32_const";
    WASMOPCode[WASMOPCode["op_f64_const"] = 68] = "op_f64_const";
    WASMOPCode[WASMOPCode["op_i32_eqz"] = 69] = "op_i32_eqz";
    WASMOPCode[WASMOPCode["op_i32_eq"] = 70] = "op_i32_eq";
    WASMOPCode[WASMOPCode["op_i32_ne"] = 71] = "op_i32_ne";
    WASMOPCode[WASMOPCode["op_i32_lt_s"] = 72] = "op_i32_lt_s";
    WASMOPCode[WASMOPCode["op_i32_lt_u"] = 73] = "op_i32_lt_u";
    WASMOPCode[WASMOPCode["op_i32_gt_s"] = 74] = "op_i32_gt_s";
    WASMOPCode[WASMOPCode["op_i32_gt_u"] = 75] = "op_i32_gt_u";
    WASMOPCode[WASMOPCode["op_i32_le_s"] = 76] = "op_i32_le_s";
    WASMOPCode[WASMOPCode["op_i32_le_u"] = 77] = "op_i32_le_u";
    WASMOPCode[WASMOPCode["op_i32_ge_s"] = 78] = "op_i32_ge_s";
    WASMOPCode[WASMOPCode["op_i32_ge_u"] = 79] = "op_i32_ge_u";
    WASMOPCode[WASMOPCode["op_i64_eqz"] = 80] = "op_i64_eqz";
    WASMOPCode[WASMOPCode["op_i64_eq"] = 81] = "op_i64_eq";
    WASMOPCode[WASMOPCode["op_i64_ne"] = 82] = "op_i64_ne";
    WASMOPCode[WASMOPCode["op_i64_lt_s"] = 83] = "op_i64_lt_s";
    WASMOPCode[WASMOPCode["op_i64_lt_u"] = 84] = "op_i64_lt_u";
    WASMOPCode[WASMOPCode["op_i64_gt_s"] = 85] = "op_i64_gt_s";
    WASMOPCode[WASMOPCode["op_i64_gt_u"] = 86] = "op_i64_gt_u";
    WASMOPCode[WASMOPCode["op_i64_le_s"] = 87] = "op_i64_le_s";
    WASMOPCode[WASMOPCode["op_i64_le_u"] = 88] = "op_i64_le_u";
    WASMOPCode[WASMOPCode["op_i64_ge_s"] = 89] = "op_i64_ge_s";
    WASMOPCode[WASMOPCode["op_i64_ge_u"] = 90] = "op_i64_ge_u";
    WASMOPCode[WASMOPCode["op_f32_eq"] = 91] = "op_f32_eq";
    WASMOPCode[WASMOPCode["op_f32_ne"] = 92] = "op_f32_ne";
    WASMOPCode[WASMOPCode["op_f32_lt"] = 93] = "op_f32_lt";
    WASMOPCode[WASMOPCode["op_f32_le"] = 94] = "op_f32_le";
    WASMOPCode[WASMOPCode["op_f32_gt"] = 95] = "op_f32_gt";
    WASMOPCode[WASMOPCode["op_f32_ge"] = 96] = "op_f32_ge";
    WASMOPCode[WASMOPCode["op_f64_eq"] = 97] = "op_f64_eq";
    WASMOPCode[WASMOPCode["op_f64_ne"] = 98] = "op_f64_ne";
    WASMOPCode[WASMOPCode["op_f64_lt"] = 99] = "op_f64_lt";
    WASMOPCode[WASMOPCode["op_f64_gt"] = 100] = "op_f64_gt";
    WASMOPCode[WASMOPCode["op_f64_le"] = 101] = "op_f64_le";
    WASMOPCode[WASMOPCode["op_f64_ge"] = 102] = "op_f64_ge";
    WASMOPCode[WASMOPCode["op_i32_clz"] = 103] = "op_i32_clz";
    WASMOPCode[WASMOPCode["op_i32_ctz"] = 104] = "op_i32_ctz";
    WASMOPCode[WASMOPCode["op_i32_popcnt"] = 105] = "op_i32_popcnt";
    WASMOPCode[WASMOPCode["op_i32_add"] = 106] = "op_i32_add";
    WASMOPCode[WASMOPCode["op_i32_sub"] = 107] = "op_i32_sub";
    WASMOPCode[WASMOPCode["op_i32_mul"] = 108] = "op_i32_mul";
    WASMOPCode[WASMOPCode["op_i32_div_s"] = 109] = "op_i32_div_s";
    WASMOPCode[WASMOPCode["op_i32_div_u"] = 110] = "op_i32_div_u";
    WASMOPCode[WASMOPCode["op_i32_rem_s"] = 111] = "op_i32_rem_s";
    WASMOPCode[WASMOPCode["op_i32_rem_u"] = 112] = "op_i32_rem_u";
    WASMOPCode[WASMOPCode["op_i32_and"] = 113] = "op_i32_and";
    WASMOPCode[WASMOPCode["op_i32_or"] = 114] = "op_i32_or";
    WASMOPCode[WASMOPCode["op_i32_xor"] = 115] = "op_i32_xor";
    WASMOPCode[WASMOPCode["op_i32_shl"] = 116] = "op_i32_shl";
    WASMOPCode[WASMOPCode["op_i32_shr_s"] = 117] = "op_i32_shr_s";
    WASMOPCode[WASMOPCode["op_i32_shr_u"] = 118] = "op_i32_shr_u";
    WASMOPCode[WASMOPCode["op_i32_rotl"] = 119] = "op_i32_rotl";
    WASMOPCode[WASMOPCode["op_i32_rotr"] = 120] = "op_i32_rotr";
    WASMOPCode[WASMOPCode["op_i64_clz"] = 121] = "op_i64_clz";
    WASMOPCode[WASMOPCode["op_i64_ctz"] = 122] = "op_i64_ctz";
    WASMOPCode[WASMOPCode["op_i64_popcnt"] = 123] = "op_i64_popcnt";
    WASMOPCode[WASMOPCode["op_i64_add"] = 124] = "op_i64_add";
    WASMOPCode[WASMOPCode["op_i64_sub"] = 125] = "op_i64_sub";
    WASMOPCode[WASMOPCode["op_i64_mul"] = 126] = "op_i64_mul";
    WASMOPCode[WASMOPCode["op_i64_div_s"] = 127] = "op_i64_div_s";
    WASMOPCode[WASMOPCode["op_i64_div_u"] = 128] = "op_i64_div_u";
    WASMOPCode[WASMOPCode["op_i64_rem_s"] = 129] = "op_i64_rem_s";
    WASMOPCode[WASMOPCode["op_i64_rem_u"] = 130] = "op_i64_rem_u";
    WASMOPCode[WASMOPCode["op_i64_and"] = 131] = "op_i64_and";
    WASMOPCode[WASMOPCode["op_i64_or"] = 132] = "op_i64_or";
    WASMOPCode[WASMOPCode["op_i64_xor"] = 133] = "op_i64_xor";
    WASMOPCode[WASMOPCode["op_i64_shl"] = 134] = "op_i64_shl";
    WASMOPCode[WASMOPCode["op_i64_shr_s"] = 135] = "op_i64_shr_s";
    WASMOPCode[WASMOPCode["op_i64_shr_u"] = 136] = "op_i64_shr_u";
    WASMOPCode[WASMOPCode["op_i64_rotl"] = 137] = "op_i64_rotl";
    WASMOPCode[WASMOPCode["op_i64_rotr"] = 138] = "op_i64_rotr";
    WASMOPCode[WASMOPCode["op_f32_abs"] = 139] = "op_f32_abs";
    WASMOPCode[WASMOPCode["op_f32_neg"] = 140] = "op_f32_neg";
    WASMOPCode[WASMOPCode["op_f32_ceil"] = 141] = "op_f32_ceil";
    WASMOPCode[WASMOPCode["op_f32_floor"] = 142] = "op_f32_floor";
    WASMOPCode[WASMOPCode["op_f32_trunc"] = 143] = "op_f32_trunc";
    WASMOPCode[WASMOPCode["op_f32_nearest"] = 144] = "op_f32_nearest";
    WASMOPCode[WASMOPCode["op_f32_sqrt"] = 145] = "op_f32_sqrt";
    WASMOPCode[WASMOPCode["op_f32_add"] = 146] = "op_f32_add";
    WASMOPCode[WASMOPCode["op_f32_sub"] = 147] = "op_f32_sub";
    WASMOPCode[WASMOPCode["op_f32_mul"] = 148] = "op_f32_mul";
    WASMOPCode[WASMOPCode["op_f32_div"] = 149] = "op_f32_div";
    WASMOPCode[WASMOPCode["op_f32_min"] = 150] = "op_f32_min";
    WASMOPCode[WASMOPCode["op_f32_max"] = 151] = "op_f32_max";
    WASMOPCode[WASMOPCode["op_f32_copysign"] = 152] = "op_f32_copysign";
    WASMOPCode[WASMOPCode["op_f64_abs"] = 153] = "op_f64_abs";
    WASMOPCode[WASMOPCode["op_f64_neg"] = 154] = "op_f64_neg";
    WASMOPCode[WASMOPCode["op_f64_ceil"] = 155] = "op_f64_ceil";
    WASMOPCode[WASMOPCode["op_f64_floor"] = 156] = "op_f64_floor";
    WASMOPCode[WASMOPCode["op_f64_trunc"] = 157] = "op_f64_trunc";
    WASMOPCode[WASMOPCode["op_f64_nearest"] = 158] = "op_f64_nearest";
    WASMOPCode[WASMOPCode["op_f64_sqrt"] = 159] = "op_f64_sqrt";
    WASMOPCode[WASMOPCode["op_f64_add"] = 160] = "op_f64_add";
    WASMOPCode[WASMOPCode["op_f64_sub"] = 161] = "op_f64_sub";
    WASMOPCode[WASMOPCode["op_f64_mul"] = 162] = "op_f64_mul";
    WASMOPCode[WASMOPCode["op_f64_div"] = 163] = "op_f64_div";
    WASMOPCode[WASMOPCode["op_f64_min"] = 164] = "op_f64_min";
    WASMOPCode[WASMOPCode["op_f64_max"] = 165] = "op_f64_max";
    WASMOPCode[WASMOPCode["op_f64_copysign"] = 166] = "op_f64_copysign";
    WASMOPCode[WASMOPCode["op_i32_wrap_i64"] = 167] = "op_i32_wrap_i64";
    WASMOPCode[WASMOPCode["op_i32_wrap_f32_s"] = 168] = "op_i32_wrap_f32_s";
    WASMOPCode[WASMOPCode["op_i32_wrap_f32_u"] = 169] = "op_i32_wrap_f32_u";
    WASMOPCode[WASMOPCode["op_i32_wrap_f64_s"] = 170] = "op_i32_wrap_f64_s";
    WASMOPCode[WASMOPCode["op_i32_wrap_f64_u"] = 171] = "op_i32_wrap_f64_u";
    WASMOPCode[WASMOPCode["op_i64_extend_i32_s"] = 172] = "op_i64_extend_i32_s";
    WASMOPCode[WASMOPCode["op_i64_extend_i32_u"] = 173] = "op_i64_extend_i32_u";
    WASMOPCode[WASMOPCode["op_i64_trunc_f32_s"] = 174] = "op_i64_trunc_f32_s";
    WASMOPCode[WASMOPCode["op_i64_trunc_f32_u"] = 175] = "op_i64_trunc_f32_u";
    WASMOPCode[WASMOPCode["op_i64_trunc_f64_s"] = 176] = "op_i64_trunc_f64_s";
    WASMOPCode[WASMOPCode["op_i64_trunc_f64_u"] = 177] = "op_i64_trunc_f64_u";
    WASMOPCode[WASMOPCode["op_f32_convert_i32_s"] = 178] = "op_f32_convert_i32_s";
    WASMOPCode[WASMOPCode["op_f32_convert_i32_u"] = 179] = "op_f32_convert_i32_u";
    WASMOPCode[WASMOPCode["op_f32_convert_i64_s"] = 180] = "op_f32_convert_i64_s";
    WASMOPCode[WASMOPCode["op_f32_convert_i64_u"] = 181] = "op_f32_convert_i64_u";
    WASMOPCode[WASMOPCode["op_f32_demote_f64"] = 182] = "op_f32_demote_f64";
    WASMOPCode[WASMOPCode["op_f64_convert_i32_s"] = 183] = "op_f64_convert_i32_s";
    WASMOPCode[WASMOPCode["op_f64_convert_i32_u"] = 184] = "op_f64_convert_i32_u";
    WASMOPCode[WASMOPCode["op_f64_convert_i64_s"] = 185] = "op_f64_convert_i64_s";
    WASMOPCode[WASMOPCode["op_f64_convert_i64_u"] = 186] = "op_f64_convert_i64_u";
    WASMOPCode[WASMOPCode["op_f64_promote_f32"] = 187] = "op_f64_promote_f32";
    WASMOPCode[WASMOPCode["op_i32_reinterpret_f32"] = 188] = "op_i32_reinterpret_f32";
    WASMOPCode[WASMOPCode["op_i64_reinterpret_f64"] = 189] = "op_i64_reinterpret_f64";
    WASMOPCode[WASMOPCode["op_f32_reinterpret_i32"] = 190] = "op_f32_reinterpret_i32";
    WASMOPCode[WASMOPCode["op_f64_reinterpret_i64"] = 191] = "op_f64_reinterpret_i64";
})(WASMOPCode || (exports.WASMOPCode = WASMOPCode = {}));
;
var WASMOPDef = /** @class */ (function () {
    function WASMOPDef(opcode, args, ret) {
        this.opcode = WASMOPCode.op_nop;
        this.args = [];
        this.ret = types_1.WASMValueType.nil;
        this.opcode = opcode;
        this.args = args;
        this.ret = ret;
    }
    return WASMOPDef;
}());
exports.WASMOPDefs = (_a = {},
    _a[WASMOPCode.op_unreachable] = new WASMOPDef(WASMOPCode.op_unreachable, [], types_1.WASMValueType.nil),
    _a[WASMOPCode.op_nop] = new WASMOPDef(WASMOPCode.op_nop, [], types_1.WASMValueType.nil),
    _a[WASMOPCode.op_block] = new WASMOPDef(WASMOPCode.op_block, [], types_1.WASMValueType.nil),
    _a[WASMOPCode.op_loop] = new WASMOPDef(WASMOPCode.op_loop, [], types_1.WASMValueType.nil),
    _a[WASMOPCode.op_if] = new WASMOPDef(WASMOPCode.op_if, [], types_1.WASMValueType.nil),
    _a[WASMOPCode.op_else] = new WASMOPDef(WASMOPCode.op_else, [], types_1.WASMValueType.nil),
    _a[WASMOPCode.op_end] = new WASMOPDef(WASMOPCode.op_end, [], types_1.WASMValueType.nil),
    _a[WASMOPCode.op_br] = new WASMOPDef(WASMOPCode.op_br, [], types_1.WASMValueType.nil),
    _a[WASMOPCode.op_br_if] = new WASMOPDef(WASMOPCode.op_br_if, [types_1.WASMValueType.i32], types_1.WASMValueType.nil),
    _a[WASMOPCode.op_br_table] = new WASMOPDef(WASMOPCode.op_br_table, [types_1.WASMValueType.i32], types_1.WASMValueType.nil),
    _a[WASMOPCode.op_return] = new WASMOPDef(WASMOPCode.op_return, [], types_1.WASMValueType.nil),
    _a[WASMOPCode.op_call] = new WASMOPDef(WASMOPCode.op_call, [], types_1.WASMValueType.nil),
    _a[WASMOPCode.op_call_indirect] = new WASMOPDef(WASMOPCode.op_call_indirect, [], types_1.WASMValueType.nil),
    _a[WASMOPCode.op_drop] = new WASMOPDef(WASMOPCode.op_drop, [], types_1.WASMValueType.nil),
    _a[WASMOPCode.op_select] = new WASMOPDef(WASMOPCode.op_select, [], types_1.WASMValueType.nil),
    _a[WASMOPCode.op_local_get] = new WASMOPDef(WASMOPCode.op_local_get, [], types_1.WASMValueType.nil),
    _a[WASMOPCode.op_local_set] = new WASMOPDef(WASMOPCode.op_local_set, [], types_1.WASMValueType.nil),
    _a[WASMOPCode.op_local_tee] = new WASMOPDef(WASMOPCode.op_local_tee, [], types_1.WASMValueType.nil),
    _a[WASMOPCode.op_global_get] = new WASMOPDef(WASMOPCode.op_global_get, [], types_1.WASMValueType.nil),
    _a[WASMOPCode.op_global_set] = new WASMOPDef(WASMOPCode.op_global_set, [], types_1.WASMValueType.nil),
    _a[WASMOPCode.op_i32_load] = new WASMOPDef(WASMOPCode.op_i32_load, [types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i64_load] = new WASMOPDef(WASMOPCode.op_i64_load, [types_1.WASMValueType.i32], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_f32_load] = new WASMOPDef(WASMOPCode.op_f32_load, [types_1.WASMValueType.i32], types_1.WASMValueType.f32),
    _a[WASMOPCode.op_f64_load] = new WASMOPDef(WASMOPCode.op_f64_load, [types_1.WASMValueType.i32], types_1.WASMValueType.f64),
    _a[WASMOPCode.op_i32_load8_s] = new WASMOPDef(WASMOPCode.op_i32_load8_s, [types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_load8_u] = new WASMOPDef(WASMOPCode.op_i32_load8_u, [types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_load16_s] = new WASMOPDef(WASMOPCode.op_i32_load16_s, [types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_load16_u] = new WASMOPDef(WASMOPCode.op_i32_load16_u, [types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i64_load8_s] = new WASMOPDef(WASMOPCode.op_i64_load8_s, [types_1.WASMValueType.i32], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_i64_load8_u] = new WASMOPDef(WASMOPCode.op_i64_load8_u, [types_1.WASMValueType.i32], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_i64_load16_s] = new WASMOPDef(WASMOPCode.op_i64_load16_s, [types_1.WASMValueType.i32], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_i64_load16_u] = new WASMOPDef(WASMOPCode.op_i64_load16_u, [types_1.WASMValueType.i32], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_i64_load32_s] = new WASMOPDef(WASMOPCode.op_i64_load32_s, [types_1.WASMValueType.i32], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_i64_load32_u] = new WASMOPDef(WASMOPCode.op_i64_load32_u, [types_1.WASMValueType.i32], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_i32_store] = new WASMOPDef(WASMOPCode.op_i32_store, [types_1.WASMValueType.i32, types_1.WASMValueType.i32], types_1.WASMValueType.nil),
    _a[WASMOPCode.op_i64_store] = new WASMOPDef(WASMOPCode.op_i64_store, [types_1.WASMValueType.i32, types_1.WASMValueType.i64], types_1.WASMValueType.nil),
    _a[WASMOPCode.op_f32_store] = new WASMOPDef(WASMOPCode.op_f32_store, [types_1.WASMValueType.i32, types_1.WASMValueType.f32], types_1.WASMValueType.nil),
    _a[WASMOPCode.op_f64_store] = new WASMOPDef(WASMOPCode.op_f64_store, [types_1.WASMValueType.i32, types_1.WASMValueType.f64], types_1.WASMValueType.nil),
    _a[WASMOPCode.op_i32_store8] = new WASMOPDef(WASMOPCode.op_i32_store8, [types_1.WASMValueType.i32, types_1.WASMValueType.i32], types_1.WASMValueType.nil),
    _a[WASMOPCode.op_i32_store16] = new WASMOPDef(WASMOPCode.op_i32_store16, [types_1.WASMValueType.i32, types_1.WASMValueType.i32], types_1.WASMValueType.nil),
    _a[WASMOPCode.op_i64_store8] = new WASMOPDef(WASMOPCode.op_i64_store8, [types_1.WASMValueType.i32, types_1.WASMValueType.i64], types_1.WASMValueType.nil),
    _a[WASMOPCode.op_i64_store16] = new WASMOPDef(WASMOPCode.op_i64_store16, [types_1.WASMValueType.i32, types_1.WASMValueType.i64], types_1.WASMValueType.nil),
    _a[WASMOPCode.op_i64_store32] = new WASMOPDef(WASMOPCode.op_i64_store32, [types_1.WASMValueType.i32, types_1.WASMValueType.i64], types_1.WASMValueType.nil),
    _a[WASMOPCode.op_memory_size] = new WASMOPDef(WASMOPCode.op_memory_size, [], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_memory_grow] = new WASMOPDef(WASMOPCode.op_memory_grow, [], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_const] = new WASMOPDef(WASMOPCode.op_i32_const, [], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i64_const] = new WASMOPDef(WASMOPCode.op_i64_const, [], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_f32_const] = new WASMOPDef(WASMOPCode.op_f32_const, [], types_1.WASMValueType.f32),
    _a[WASMOPCode.op_f64_const] = new WASMOPDef(WASMOPCode.op_f64_const, [], types_1.WASMValueType.f64),
    _a[WASMOPCode.op_i32_eqz] = new WASMOPDef(WASMOPCode.op_i32_eqz, [types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_eq] = new WASMOPDef(WASMOPCode.op_i32_eq, [types_1.WASMValueType.i32, types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_ne] = new WASMOPDef(WASMOPCode.op_i32_ne, [types_1.WASMValueType.i32, types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_lt_s] = new WASMOPDef(WASMOPCode.op_i32_lt_s, [types_1.WASMValueType.i32, types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_lt_u] = new WASMOPDef(WASMOPCode.op_i32_lt_u, [types_1.WASMValueType.i32, types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_gt_s] = new WASMOPDef(WASMOPCode.op_i32_gt_s, [types_1.WASMValueType.i32, types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_gt_u] = new WASMOPDef(WASMOPCode.op_i32_gt_u, [types_1.WASMValueType.i32, types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_le_s] = new WASMOPDef(WASMOPCode.op_i32_le_s, [types_1.WASMValueType.i32, types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_le_u] = new WASMOPDef(WASMOPCode.op_i32_le_u, [types_1.WASMValueType.i32, types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_ge_s] = new WASMOPDef(WASMOPCode.op_i32_ge_s, [types_1.WASMValueType.i32, types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_ge_u] = new WASMOPDef(WASMOPCode.op_i32_ge_u, [types_1.WASMValueType.i32, types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i64_eqz] = new WASMOPDef(WASMOPCode.op_i64_eqz, [types_1.WASMValueType.i64], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i64_eq] = new WASMOPDef(WASMOPCode.op_i64_eq, [types_1.WASMValueType.i64, types_1.WASMValueType.i64], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i64_ne] = new WASMOPDef(WASMOPCode.op_i64_ne, [types_1.WASMValueType.i64, types_1.WASMValueType.i64], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i64_lt_s] = new WASMOPDef(WASMOPCode.op_i64_lt_s, [types_1.WASMValueType.i64, types_1.WASMValueType.i64], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i64_lt_u] = new WASMOPDef(WASMOPCode.op_i64_lt_u, [types_1.WASMValueType.i64, types_1.WASMValueType.i64], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i64_gt_s] = new WASMOPDef(WASMOPCode.op_i64_gt_s, [types_1.WASMValueType.i64, types_1.WASMValueType.i64], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i64_gt_u] = new WASMOPDef(WASMOPCode.op_i64_gt_u, [types_1.WASMValueType.i64, types_1.WASMValueType.i64], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i64_le_s] = new WASMOPDef(WASMOPCode.op_i64_le_s, [types_1.WASMValueType.i64, types_1.WASMValueType.i64], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i64_le_u] = new WASMOPDef(WASMOPCode.op_i64_le_u, [types_1.WASMValueType.i64, types_1.WASMValueType.i64], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i64_ge_s] = new WASMOPDef(WASMOPCode.op_i64_ge_s, [types_1.WASMValueType.i64, types_1.WASMValueType.i64], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i64_ge_u] = new WASMOPDef(WASMOPCode.op_i64_ge_u, [types_1.WASMValueType.i64, types_1.WASMValueType.i64], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_f32_eq] = new WASMOPDef(WASMOPCode.op_f32_eq, [types_1.WASMValueType.f32, types_1.WASMValueType.f32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_f32_ne] = new WASMOPDef(WASMOPCode.op_f32_ne, [types_1.WASMValueType.f32, types_1.WASMValueType.f32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_f32_lt] = new WASMOPDef(WASMOPCode.op_f32_lt, [types_1.WASMValueType.f32, types_1.WASMValueType.f32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_f32_le] = new WASMOPDef(WASMOPCode.op_f32_le, [types_1.WASMValueType.f32, types_1.WASMValueType.f32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_f32_gt] = new WASMOPDef(WASMOPCode.op_f32_gt, [types_1.WASMValueType.f32, types_1.WASMValueType.f32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_f32_ge] = new WASMOPDef(WASMOPCode.op_f32_ge, [types_1.WASMValueType.f32, types_1.WASMValueType.f32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_f64_eq] = new WASMOPDef(WASMOPCode.op_f64_eq, [types_1.WASMValueType.f64, types_1.WASMValueType.f64], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_f64_ne] = new WASMOPDef(WASMOPCode.op_f64_ne, [types_1.WASMValueType.f64, types_1.WASMValueType.f64], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_f64_lt] = new WASMOPDef(WASMOPCode.op_f64_lt, [types_1.WASMValueType.f64, types_1.WASMValueType.f64], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_f64_gt] = new WASMOPDef(WASMOPCode.op_f64_gt, [types_1.WASMValueType.f64, types_1.WASMValueType.f64], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_f64_le] = new WASMOPDef(WASMOPCode.op_f64_le, [types_1.WASMValueType.f64, types_1.WASMValueType.f64], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_f64_ge] = new WASMOPDef(WASMOPCode.op_f64_ge, [types_1.WASMValueType.f64, types_1.WASMValueType.f64], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_clz] = new WASMOPDef(WASMOPCode.op_i32_clz, [types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_ctz] = new WASMOPDef(WASMOPCode.op_i32_ctz, [types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_popcnt] = new WASMOPDef(WASMOPCode.op_i32_popcnt, [types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_add] = new WASMOPDef(WASMOPCode.op_i32_add, [types_1.WASMValueType.i32, types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_sub] = new WASMOPDef(WASMOPCode.op_i32_sub, [types_1.WASMValueType.i32, types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_mul] = new WASMOPDef(WASMOPCode.op_i32_mul, [types_1.WASMValueType.i32, types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_div_s] = new WASMOPDef(WASMOPCode.op_i32_div_s, [types_1.WASMValueType.i32, types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_div_u] = new WASMOPDef(WASMOPCode.op_i32_div_u, [types_1.WASMValueType.i32, types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_rem_s] = new WASMOPDef(WASMOPCode.op_i32_rem_s, [types_1.WASMValueType.i32, types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_rem_u] = new WASMOPDef(WASMOPCode.op_i32_rem_u, [types_1.WASMValueType.i32, types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_and] = new WASMOPDef(WASMOPCode.op_i32_and, [types_1.WASMValueType.i32, types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_or] = new WASMOPDef(WASMOPCode.op_i32_or, [types_1.WASMValueType.i32, types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_xor] = new WASMOPDef(WASMOPCode.op_i32_xor, [types_1.WASMValueType.i32, types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_shl] = new WASMOPDef(WASMOPCode.op_i32_shl, [types_1.WASMValueType.i32, types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_shr_s] = new WASMOPDef(WASMOPCode.op_i32_shr_s, [types_1.WASMValueType.i32, types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_shr_u] = new WASMOPDef(WASMOPCode.op_i32_shr_u, [types_1.WASMValueType.i32, types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_rotl] = new WASMOPDef(WASMOPCode.op_i32_rotl, [types_1.WASMValueType.i32, types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_rotr] = new WASMOPDef(WASMOPCode.op_i32_rotr, [types_1.WASMValueType.i32, types_1.WASMValueType.i32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i64_clz] = new WASMOPDef(WASMOPCode.op_i64_clz, [types_1.WASMValueType.i64], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_i64_ctz] = new WASMOPDef(WASMOPCode.op_i64_ctz, [types_1.WASMValueType.i64], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_i64_popcnt] = new WASMOPDef(WASMOPCode.op_i64_popcnt, [types_1.WASMValueType.i64], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_i64_add] = new WASMOPDef(WASMOPCode.op_i64_add, [types_1.WASMValueType.i64, types_1.WASMValueType.i64], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_i64_sub] = new WASMOPDef(WASMOPCode.op_i64_sub, [types_1.WASMValueType.i64, types_1.WASMValueType.i64], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_i64_mul] = new WASMOPDef(WASMOPCode.op_i64_mul, [types_1.WASMValueType.i64, types_1.WASMValueType.i64], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_i64_div_s] = new WASMOPDef(WASMOPCode.op_i64_div_s, [types_1.WASMValueType.i64, types_1.WASMValueType.i64], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_i64_div_u] = new WASMOPDef(WASMOPCode.op_i64_div_u, [types_1.WASMValueType.i64, types_1.WASMValueType.i64], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_i64_rem_s] = new WASMOPDef(WASMOPCode.op_i64_rem_s, [types_1.WASMValueType.i64, types_1.WASMValueType.i64], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_i64_rem_u] = new WASMOPDef(WASMOPCode.op_i64_rem_u, [types_1.WASMValueType.i64, types_1.WASMValueType.i64], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_i64_and] = new WASMOPDef(WASMOPCode.op_i64_and, [types_1.WASMValueType.i64, types_1.WASMValueType.i64], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_i64_or] = new WASMOPDef(WASMOPCode.op_i64_or, [types_1.WASMValueType.i64, types_1.WASMValueType.i64], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_i64_xor] = new WASMOPDef(WASMOPCode.op_i64_xor, [types_1.WASMValueType.i64, types_1.WASMValueType.i64], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_i64_shl] = new WASMOPDef(WASMOPCode.op_i64_shl, [types_1.WASMValueType.i64, types_1.WASMValueType.i64], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_i64_shr_s] = new WASMOPDef(WASMOPCode.op_i64_shr_s, [types_1.WASMValueType.i64, types_1.WASMValueType.i64], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_i64_shr_u] = new WASMOPDef(WASMOPCode.op_i64_shr_u, [types_1.WASMValueType.i64, types_1.WASMValueType.i64], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_i64_rotl] = new WASMOPDef(WASMOPCode.op_i64_rotl, [types_1.WASMValueType.i64, types_1.WASMValueType.i64], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_i64_rotr] = new WASMOPDef(WASMOPCode.op_i64_rotr, [types_1.WASMValueType.i64, types_1.WASMValueType.i64], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_f32_abs] = new WASMOPDef(WASMOPCode.op_f32_abs, [types_1.WASMValueType.f32], types_1.WASMValueType.f32),
    _a[WASMOPCode.op_f32_neg] = new WASMOPDef(WASMOPCode.op_f32_neg, [types_1.WASMValueType.f32], types_1.WASMValueType.f32),
    _a[WASMOPCode.op_f32_ceil] = new WASMOPDef(WASMOPCode.op_f32_ceil, [types_1.WASMValueType.f32], types_1.WASMValueType.f32),
    _a[WASMOPCode.op_f32_floor] = new WASMOPDef(WASMOPCode.op_f32_floor, [types_1.WASMValueType.f32], types_1.WASMValueType.f32),
    _a[WASMOPCode.op_f32_trunc] = new WASMOPDef(WASMOPCode.op_f32_trunc, [types_1.WASMValueType.f32], types_1.WASMValueType.f32),
    _a[WASMOPCode.op_f32_nearest] = new WASMOPDef(WASMOPCode.op_f32_nearest, [types_1.WASMValueType.f32], types_1.WASMValueType.f32),
    _a[WASMOPCode.op_f32_sqrt] = new WASMOPDef(WASMOPCode.op_f32_sqrt, [types_1.WASMValueType.f32], types_1.WASMValueType.f32),
    _a[WASMOPCode.op_f32_add] = new WASMOPDef(WASMOPCode.op_f32_add, [types_1.WASMValueType.f32, types_1.WASMValueType.f32], types_1.WASMValueType.f32),
    _a[WASMOPCode.op_f32_sub] = new WASMOPDef(WASMOPCode.op_f32_sub, [types_1.WASMValueType.f32, types_1.WASMValueType.f32], types_1.WASMValueType.f32),
    _a[WASMOPCode.op_f32_mul] = new WASMOPDef(WASMOPCode.op_f32_mul, [types_1.WASMValueType.f32, types_1.WASMValueType.f32], types_1.WASMValueType.f32),
    _a[WASMOPCode.op_f32_div] = new WASMOPDef(WASMOPCode.op_f32_div, [types_1.WASMValueType.f32, types_1.WASMValueType.f32], types_1.WASMValueType.f32),
    _a[WASMOPCode.op_f32_min] = new WASMOPDef(WASMOPCode.op_f32_min, [types_1.WASMValueType.f32, types_1.WASMValueType.f32], types_1.WASMValueType.f32),
    _a[WASMOPCode.op_f32_max] = new WASMOPDef(WASMOPCode.op_f32_max, [types_1.WASMValueType.f32, types_1.WASMValueType.f32], types_1.WASMValueType.f32),
    _a[WASMOPCode.op_f32_copysign] = new WASMOPDef(WASMOPCode.op_f32_copysign, [types_1.WASMValueType.f32, types_1.WASMValueType.f32], types_1.WASMValueType.f32),
    _a[WASMOPCode.op_f64_abs] = new WASMOPDef(WASMOPCode.op_f64_abs, [types_1.WASMValueType.f64], types_1.WASMValueType.f64),
    _a[WASMOPCode.op_f64_neg] = new WASMOPDef(WASMOPCode.op_f64_neg, [types_1.WASMValueType.f64], types_1.WASMValueType.f64),
    _a[WASMOPCode.op_f64_ceil] = new WASMOPDef(WASMOPCode.op_f64_ceil, [types_1.WASMValueType.f64], types_1.WASMValueType.f64),
    _a[WASMOPCode.op_f64_floor] = new WASMOPDef(WASMOPCode.op_f64_floor, [types_1.WASMValueType.f64], types_1.WASMValueType.f64),
    _a[WASMOPCode.op_f64_trunc] = new WASMOPDef(WASMOPCode.op_f64_trunc, [types_1.WASMValueType.f64], types_1.WASMValueType.f64),
    _a[WASMOPCode.op_f64_nearest] = new WASMOPDef(WASMOPCode.op_f64_nearest, [types_1.WASMValueType.f64], types_1.WASMValueType.f64),
    _a[WASMOPCode.op_f64_sqrt] = new WASMOPDef(WASMOPCode.op_f64_sqrt, [types_1.WASMValueType.f64], types_1.WASMValueType.f64),
    _a[WASMOPCode.op_f64_add] = new WASMOPDef(WASMOPCode.op_f64_add, [types_1.WASMValueType.f64, types_1.WASMValueType.f64], types_1.WASMValueType.f64),
    _a[WASMOPCode.op_f64_sub] = new WASMOPDef(WASMOPCode.op_f64_sub, [types_1.WASMValueType.f64, types_1.WASMValueType.f64], types_1.WASMValueType.f64),
    _a[WASMOPCode.op_f64_mul] = new WASMOPDef(WASMOPCode.op_f64_mul, [types_1.WASMValueType.f64, types_1.WASMValueType.f64], types_1.WASMValueType.f64),
    _a[WASMOPCode.op_f64_div] = new WASMOPDef(WASMOPCode.op_f64_div, [types_1.WASMValueType.f64, types_1.WASMValueType.f64], types_1.WASMValueType.f64),
    _a[WASMOPCode.op_f64_min] = new WASMOPDef(WASMOPCode.op_f64_min, [types_1.WASMValueType.f64, types_1.WASMValueType.f64], types_1.WASMValueType.f64),
    _a[WASMOPCode.op_f64_max] = new WASMOPDef(WASMOPCode.op_f64_max, [types_1.WASMValueType.f64, types_1.WASMValueType.f64], types_1.WASMValueType.f64),
    _a[WASMOPCode.op_f64_copysign] = new WASMOPDef(WASMOPCode.op_f64_copysign, [types_1.WASMValueType.f64, types_1.WASMValueType.f64], types_1.WASMValueType.f64),
    _a[WASMOPCode.op_i32_wrap_i64] = new WASMOPDef(WASMOPCode.op_i32_wrap_i64, [types_1.WASMValueType.i64], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_wrap_f32_s] = new WASMOPDef(WASMOPCode.op_i32_wrap_f32_s, [types_1.WASMValueType.f32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_wrap_f32_u] = new WASMOPDef(WASMOPCode.op_i32_wrap_f32_u, [types_1.WASMValueType.f32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_wrap_f64_s] = new WASMOPDef(WASMOPCode.op_i32_wrap_f64_s, [types_1.WASMValueType.f64], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i32_wrap_f64_u] = new WASMOPDef(WASMOPCode.op_i32_wrap_f64_u, [types_1.WASMValueType.f64], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i64_extend_i32_s] = new WASMOPDef(WASMOPCode.op_i64_extend_i32_s, [types_1.WASMValueType.i32], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_i64_extend_i32_u] = new WASMOPDef(WASMOPCode.op_i64_extend_i32_u, [types_1.WASMValueType.i32], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_i64_trunc_f32_s] = new WASMOPDef(WASMOPCode.op_i64_trunc_f32_s, [types_1.WASMValueType.f32], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_i64_trunc_f32_u] = new WASMOPDef(WASMOPCode.op_i64_trunc_f32_u, [types_1.WASMValueType.f32], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_i64_trunc_f64_s] = new WASMOPDef(WASMOPCode.op_i64_trunc_f64_s, [types_1.WASMValueType.f64], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_i64_trunc_f64_u] = new WASMOPDef(WASMOPCode.op_i64_trunc_f64_u, [types_1.WASMValueType.f64], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_f32_convert_i32_s] = new WASMOPDef(WASMOPCode.op_f32_convert_i32_s, [types_1.WASMValueType.i32], types_1.WASMValueType.f32),
    _a[WASMOPCode.op_f32_convert_i32_u] = new WASMOPDef(WASMOPCode.op_f32_convert_i32_u, [types_1.WASMValueType.i32], types_1.WASMValueType.f32),
    _a[WASMOPCode.op_f32_convert_i64_s] = new WASMOPDef(WASMOPCode.op_f32_convert_i64_s, [types_1.WASMValueType.i64], types_1.WASMValueType.f32),
    _a[WASMOPCode.op_f32_convert_i64_u] = new WASMOPDef(WASMOPCode.op_f32_convert_i64_u, [types_1.WASMValueType.i64], types_1.WASMValueType.f32),
    _a[WASMOPCode.op_f32_demote_f64] = new WASMOPDef(WASMOPCode.op_f32_demote_f64, [types_1.WASMValueType.f64], types_1.WASMValueType.f32),
    _a[WASMOPCode.op_f64_convert_i32_s] = new WASMOPDef(WASMOPCode.op_f64_convert_i32_s, [types_1.WASMValueType.i32], types_1.WASMValueType.f64),
    _a[WASMOPCode.op_f64_convert_i32_u] = new WASMOPDef(WASMOPCode.op_f64_convert_i32_u, [types_1.WASMValueType.i32], types_1.WASMValueType.f64),
    _a[WASMOPCode.op_f64_convert_i64_s] = new WASMOPDef(WASMOPCode.op_f64_convert_i64_s, [types_1.WASMValueType.i64], types_1.WASMValueType.f64),
    _a[WASMOPCode.op_f64_convert_i64_u] = new WASMOPDef(WASMOPCode.op_f64_convert_i64_u, [types_1.WASMValueType.i64], types_1.WASMValueType.f64),
    _a[WASMOPCode.op_f64_promote_f32] = new WASMOPDef(WASMOPCode.op_f64_promote_f32, [types_1.WASMValueType.f32], types_1.WASMValueType.f64),
    _a[WASMOPCode.op_i32_reinterpret_f32] = new WASMOPDef(WASMOPCode.op_i32_reinterpret_f32, [types_1.WASMValueType.f32], types_1.WASMValueType.i32),
    _a[WASMOPCode.op_i64_reinterpret_f64] = new WASMOPDef(WASMOPCode.op_i64_reinterpret_f64, [types_1.WASMValueType.f64], types_1.WASMValueType.i64),
    _a[WASMOPCode.op_f32_reinterpret_i32] = new WASMOPDef(WASMOPCode.op_f32_reinterpret_i32, [types_1.WASMValueType.i32], types_1.WASMValueType.f32),
    _a[WASMOPCode.op_f64_reinterpret_i64] = new WASMOPDef(WASMOPCode.op_f64_reinterpret_i64, [types_1.WASMValueType.i64], types_1.WASMValueType.f64),
    _a);
