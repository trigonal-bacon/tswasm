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
    compile(buf : any) {
        return new Promise((res, rej) : void => {
            if (!(buf instanceof ArrayBuffer) && !(buf instanceof Uint8Array))
                return rej(new Error(`Cannot instantiate a non-buffer object`));
            const module = new WASMModule(new Uint8Array(buf));
            res(module);
        });
    },
    instantiate(buf : any, imports = {}) {
        return new Promise((res : (x : InstantiateResult) => any, rej) => {
            if (!(buf instanceof ArrayBuffer) && !(buf instanceof Uint8Array))
                return rej(new Error(`Cannot instantiate a non-buffer object`));
            const module = new WASMModule(new Uint8Array(buf));
            const instance = new Program(module, imports);
            res({ module, instance });
        });
    },
    async instantiateStreaming(req : Response | Promise<Response>, imports = {}) {
        if (req instanceof Promise)
            req = await req;
        const buf = await req.arrayBuffer();
        return await this.instantiate(buf, imports);
    },
    async compileStreaming(req : Response | Promise<Response>) {
        if (req instanceof Promise)
            req = await req;
        const buf = await req.arrayBuffer();
        return await this.compile(buf);
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