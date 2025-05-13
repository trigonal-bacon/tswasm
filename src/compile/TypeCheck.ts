import { WASMValueType, typeToString, typeArrayToString } from "../spec/Types";
import { WASMOPCode, WASMOPDefs } from "../spec/OpCode";

export function typeStackPush(stack : Array<WASMValueType>, t : WASMValueType) : void {
    if (t === undefined)
        throw new Error(`Impossible push`);
    if (t === WASMValueType.nil)
        return;
    stack.push(t);
}

export function typeCheckArgs(stack : Array<WASMValueType>, check : Array<WASMValueType>) : void {
    const save = stack.slice(0);
    for (let i = check.length - 1; i >= 0; --i) {
        if (stack.length === 0)
            throw new TypeError(`Expected args ${typeArrayToString(check)}, got ${typeArrayToString(save)}`);
        let curr = stack[stack.length - 1];
        if (curr === WASMValueType.nil)
            return;
        stack.pop();
        if (curr !== check[i])
            throw new TypeError(`Expected args ${typeArrayToString(check)}, got ${typeArrayToString(save)}`);
    }
    //success
    return;
}

export function typeCheckResults(stack : Array<WASMValueType>, check : Array<WASMValueType>) : void {
    const save = stack.slice(0);
    typeCheckArgs(stack, check);
    if (stack.length === 0 || stack.pop() === WASMValueType.nil)
        return;
    throw new TypeError(`Expected ${typeArrayToString(check)}, got ${typeArrayToString(save)}`);
}

export function typeArrayEq(t1 : Array<WASMValueType>, t2 : Array<WASMValueType>) : boolean {
    if (t1.length !== t2.length)
        return false;
    for (let i = 0; i < t1.length; ++i)
        if (t1[i] !== t2[i])
            return false;
    return true;
}

export function typeCheckDef(typeStack : Array<WASMValueType>, instrOp : WASMOPCode) {
    const instrDef = WASMOPDefs[instrOp];
    if (typeStack.length < instrDef.args.length)
        throw new RangeError(`Expected at least ${instrDef.args.length} values on stack for ${instrOp}, got ${typeStack.length}`);
    typeCheckArgs(typeStack, instrDef.args);

    for (const ret of instrDef.rets)
        typeStackPush(typeStack, ret);
}