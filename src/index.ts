import WASMModule from "./compile/Module"
import WASMMemory from "./interface/Memory";
import WASMTable from "./interface/Table";
import { Program } from "./interpret/Interpreter";
import { CompileError, LinkError, RuntimeError } from "./spec/Error";

interface InstantiateResult {
    module : WASMModule,
    instance : Program
}

const WebAssembly = {
    compile(buf : ArrayBuffer) {
        return new Promise((res, rej) : void => {
            //if (!(buf instanceof ArrayBuffer))
                //return rej(new Error(`Cannot instantiate a non-buffer object`));
            const module = new WASMModule(buf);
            res(module);
        });
    },
    instantiate(buf : ArrayBuffer, imports = {}) {
        return new Promise((res : (x : InstantiateResult) => any, rej) => {
            //if (!(buf instanceof ArrayBuffer))
                //return rej(new Error(`Cannot instantiate a non-buffer object`));
            const module = new WASMModule(buf);
            const instance = new Program(module, imports);
            res({ module, instance });
        });
    },
    instantiateStreaming(req : Request, imports = {}) {
        return req.arrayBuffer().then(buf => this.instantiate(buf, imports));
    },
    compileStreaming(req : Request) {
        return req.arrayBuffer().then(this.compile);
    },
    Module : WASMModule,
    Instance : Program,
    Table : WASMTable,
    Memory : WASMMemory,
    CompileError,
    LinkError,
    RuntimeError,
}

export default WebAssembly;