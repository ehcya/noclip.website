// Generated by build_wat.js

// assembly/Yaz0_as.ts
export interface yaz0_asExports {
    memory: WebAssembly.Memory;
}
const yaz0_asCode = "AGFzbQEAAAABCgJgA39/fwBgAAADAwIAAQUDAQAABxcCBm1lbW9yeQIACmRlY29tcHJlc3MAAAqPAgKIAgEGfwNAIAEiA0EBaiEBIAMtAAAhB0EIIQYDQAJAIAYiA0EBayEGIANFDQBBASAGdCAHcQRAIAJBAWshAiAAIgNBAWohACABIgRBAWohASADIAQtAAA6AAAFIAEvAQAiA0EIdCADQf//A3FBCHZyIQMgAUECaiEBIANB/x9xQQFqIQQgA0H//wNxQQx2QQJqQf8BcSIFQQJGBEAgASIDQQFqIQEgAy0AAEEQaiAFaiEFCyAAIARB//8DcWshAyACIAVrIQIDQCAFIgRBAWshBSAEQf//A3EEQCAAIgRBAWohACADIghBAWohAyAEIAgtAAA6AAAMAQsLCyACQQBKDQEPCwsMAAsACwMAAQs=";
export function yaz0_asInstance(imports?: any): Promise<yaz0_asExports> {
    return WebAssembly.compile(Uint8Array.from(window.atob(yaz0_asCode), function(c) { return c.charCodeAt(0); })).then((module: WebAssembly.Module) => {
        return WebAssembly.instantiate(module, imports);
    }).then((instance: WebAssembly.Instance) => {
        return (instance.exports as unknown) as yaz0_asExports;
    });
}

// assembly/gx_texture_as.ts
export interface gx_texture_asExports {
    memory: WebAssembly.Memory;
}
const gx_texture_asCode = "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";
export function gx_texture_asInstance(imports?: any): Promise<gx_texture_asExports> {
    return WebAssembly.compile(Uint8Array.from(window.atob(gx_texture_asCode), function(c) { return c.charCodeAt(0); })).then((module: WebAssembly.Module) => {
        return WebAssembly.instantiate(module, imports);
    }).then((instance: WebAssembly.Instance) => {
        return (instance.exports as unknown) as gx_texture_asExports;
    });
}
