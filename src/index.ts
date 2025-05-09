import WASMModule from "./compile/Module"
import WASMMemory from "./interface/Memory";
import WASMTable from "./interface/Table";
import { Program } from "./interpret/Interpreter";
import { CompileError, LinkError, RuntimeError } from "./spec/error";

interface InstantiateResult {
    module : WASMModule,
    instance : Program
}

export const WebAssembly = {
    instantiate(buf : ArrayBuffer, imports = {}) {
        return new Promise((res : (x : InstantiateResult) => any, rej) => {
            const module = new WASMModule(buf);
            const instance = new Program(module, imports);
            res({ module, instance });
        });
    },
    compile(buf : ArrayBuffer) {
        return new Promise((res, rej) : WASMModule => {
            const module = new WASMModule(buf);
            return module;
        });
    },
    Module : WASMModule,
    Instance : Program,
    Table : WASMTable,
    Memory : WASMMemory,
    CompileError,
    LinkError,
    RuntimeError,
}