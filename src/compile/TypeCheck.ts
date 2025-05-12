import { WASMValueType, typeToString, typeArrayToString } from "../spec/Types";
import { CompileError } from "../spec/Error";
import { WASMOPCode, WASMOPDefs } from "../spec/OpCode";

export function typeStackPush(stack : Array<WASMValueType>, t : WASMValueType) : void {
    if (t === undefined)
        throw new Error(`Impossible push`);
    if (t === WASMValueType.nil)
        return;
    stack.push(t);
}

export function typeCheckArg(stack : Array<WASMValueType>, check : WASMValueType) : void {
    if (check === WASMValueType.nil)
        //do nothing
        return;
    const top = stack.pop();
    if (top === undefined)
        throw new CompileError(`Expected 1 value on stack, got 0`);
    //if polymorphic, whatever is ok.
    if (top === WASMValueType.nil)
        return;
    if (top !== check)
        throw new TypeError(`Type mismatch: expected ${typeToString(check)} on stack, got ${typeToString(top)}`);
}

export function typeCheckResult(stack : Array<WASMValueType>, check : WASMValueType) : void {
    if (check === WASMValueType.nil) {
        if (stack.length === 0) 
            return;
        if (stack.pop() === WASMValueType.nil)
            return;
        throw new RangeError(`Expected empty stack on return, got ${stack.length}`);
    }
    else if (stack.length !== 1)
        throw new RangeError(`Error on return, expected 1 argument on stack, got ${stack.length}`);
    const top = stack[0];
    if (top === undefined)
        throw new CompileError(`Impossible`);
    //if polymorphic, whatever is ok.
    if (top == WASMValueType.nil)
        return;
    if (top !== check)
        throw new TypeError(`Type mismatch: expected ${typeToString(check)} values on stack, got ${typeToString(top)}`);
}

export function typeCheckDef(typeStack : Array<WASMValueType>, instrOp : WASMOPCode) {
    const instrDef = WASMOPDefs[instrOp];
    if (typeStack.length < instrDef.args.length)
        throw new RangeError(`Expected at least ${instrDef.args.length} values on stack for ${instrOp}, got ${typeStack.length}`);
    for (let i = instrDef.args.length; i > 0; --i)
        typeCheckArg(typeStack, instrDef.args[i - 1])

    typeStackPush(typeStack, instrDef.ret);
}