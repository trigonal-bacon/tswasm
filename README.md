# TSWASM
WebAssembly parser and interpreter written in TypeScript

Run ``npm run build`` to create a webpack bundle.

To use in the browser, include the bundle as a ``<script>`` tag before any WebAssembly loading files. ``window.WebAssembly`` will be overwritten by the library. 

The library exposes the following functions and classes, to match as closely to the default ``WebAssembly`` API as possible:

```
WebAsembly.instantiate(buf, imports) -> Promise<{ module : WebAssembly.Module, instance : WebAssembly.Instance }>
WebAssembly.instantiateStreaming(res, imports) -> Promise<{ module : WebAssembly.Module, instance : WebAssembly.Instance }>
WebAssembly.compile(buf) -> Promise<WebAssembly.Module>
WebAssembly.compileStreaming(res) -> Promise<WebAssembly.Module>
WebAssembly.Module
WebAssembly.Instance
WebAssembly.Memory
WebAssembly.Table
WebAssembly.CompileError
WebAssembly.LinkError
WebAssembly.RuntimeError
```

Usage is identical to the normal ``WebAssembly`` API. For most emscripten-compiled WASM, simply including the ``<script>`` tag is enough.

# Supported Features
* Non-trapping float-to-int conversions
* Multiple return values for both functions and blocks
* Mutable imported/exported globals

# TODO Features
* Fully rigorous polymorphic stack type checking for ``br``, ``br_table``, and ``return``
* ``global.get`` in const expressions
* WAT dumping
* Misc. optimization

# Interpreter
For optimization reasons (and as sort of a challenge), the interpreter uses a slightly modified binary syntax. Notably:

- All ints are encoded as fixed-length integers, as opposed to the LEB128 format WASM uses.
- Control instructions, like ``br``, ``br_if`` and ``br_table`` have extra immediates (apart from branch depth) that tell the interpreter which index in the binary to jump to, and also how many values to pop/preserve on the stack (making it more similar to a vanilla jump instruction). These "control immediates" are fixed length, but their byte length can be changed using CTRL_ARG_BYTELEN (defaults to 4, but usually 2 is enough)
- ``return`` also stores a branch depth immediate 
- Function pointers are stored at the start of the interpreter binary as uint32s.

This extra information embedded in the binary allows the program to:
1. Skip most runtime typechecking. Since the compiler already validated the binary, we may assume that all operations are type safe, and thus our only concern is the number of arguments instructions manipulate.
2. Use one global array to store blocks and the stack. Call frames can share the same stack since we kept track of how many elements to delete when the frame returns. This allows for some speedup.
3. Technically store all locals in one array as well, but I decided not to do that.

This does make debugging more painful (which is the opposite of what an interpreter should be doing) so I will also write another implementation that more implements the WASM runtime in a more 1-to-1 manner in the future. 
