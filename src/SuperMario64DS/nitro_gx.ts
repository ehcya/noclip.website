
// Read DS Geometry Engine commands.

import { bgr5 as _bgr5 } from './nitro_tex.js';
import ArrayBufferSlice from '../ArrayBufferSlice.js';
import { makeTriangleIndexBuffer, GfxTopology } from '../gfx/helpers/TopologyHelpers.js';
import { ReadonlyVec2, ReadonlyVec3, vec2, vec3 } from 'gl-matrix';
import { Color, colorNewCopy } from '../Color.js';

enum CmdType {
    MTX_RESTORE = 0x14,

    COLOR =       0x20,
    NORMAL =      0x21,
    TEXCOORD =    0x22,
    VTX_16 =      0x23,
    VTX_10 =      0x24,
    VTX_XY =      0x25,
    VTX_XZ =      0x26,
    VTX_YZ =      0x27,
    VTX_DIFF =    0x28,

    DIF_AMB =     0x30,

    BEGIN_VTXS =  0x40,
    END_VTXS =    0x41,
}

enum PolyType {
    TRIANGLES = 0,
    QUADS = 1,
    TRIANGLE_STRIP = 2,
    QUAD_STRIP = 3,
}

// 3 pos + 4 color + 2 uv + 3 nrm + 1 matrix ID
export const VERTEX_SIZE = 13;
export const VERTEX_BYTES = VERTEX_SIZE * Float32Array.BYTES_PER_ELEMENT;

const tmp = new Uint8Array(3);
export function bgr5(dst: Color, pixel: number): void {
    _bgr5(tmp, 0, pixel);
    dst.r = tmp[0] / 0xFF;
    dst.g = tmp[1] / 0xFF;
    dst.b = tmp[2] / 0xFF;
}

function cmd_MTX_RESTORE(ctx: ContextInternal) {
    ctx.s_mtxId = ctx.readParam();
}

function cmd_COLOR(ctx: ContextInternal) {
    const param = ctx.readParam();
    bgr5(ctx.s_color, param);
}

function cmd_NORMAL(ctx: ContextInternal) {
    const param = ctx.readParam();
    let x = (param & 0x03FF);
    let y = (param >> 10) & 0x03FF;
    let z = (param >> 20) & 0x03FF;

    // Sign extend.
    x = (x << 22 >> 22);
    y = (y << 22 >> 22);
    z = (z << 22 >> 22);

    // Fixed point.
    x = x / 1024.0;
    y = y / 1024.0;
    z = z / 1024.0;

    vec3.set(ctx.s_nrm, x, y, z);
    ctx.s_color.r = -1;
}

function cmd_TEXCOORD(ctx: ContextInternal) {
    const param = ctx.readParam();
    let s = param & 0xFFFF;
    let t = param >> 16;

    // Sign extend.
    s = (s << 16 >> 16);
    t = (t << 16 >> 16);

    // Fixed point.
    s = s / 16.0;
    t = t / 16.0;

    vec2.set(ctx.s_texCoord, s, t);
}

function cmd_VTX_16(ctx: ContextInternal) {
    const param1 = ctx.readParam();
    let x = (param1 & 0xFFFF);
    let y = (param1 >> 16) & 0xFFFF;
    const param2 = ctx.readParam();
    let z = (param2 & 0xFFFF);

    // Sign extend.
    x = (x << 16 >> 16);
    y = (y << 16 >> 16);
    z = (z << 16 >> 16);

    // Fixed point.
    x = x / 4096.0;
    y = y / 4096.0;
    z = z / 4096.0;

    ctx.vtx(x, y, z);
}

function cmd_VTX_10(ctx: ContextInternal) {
    const param = ctx.readParam();
    let x = (param & 0x03FF);
    let y = (param >> 10) & 0x03FF;
    let z = (param >> 20) & 0x03FF;

    // Sign extend.
    x = (x << 22 >> 22);
    y = (y << 22 >> 22);
    z = (z << 22 >> 22);

    // Fixed point.
    x = x / 64.0;
    y = y / 64.0;
    z = z / 64.0;

    ctx.vtx(x, y, z);
}

function cmd_VTX_XY(ctx: ContextInternal) {
    const param = ctx.readParam();
    let x = (param & 0xFFFF);
    let y = (param >> 16) & 0xFFFF;

    // Sign extend.
    x = (x << 16 >> 16);
    y = (y << 16 >> 16);

    // Fixed point.
    x = x / 4096.0;
    y = y / 4096.0;

    ctx.vtx(x, y, ctx.s_vtx[2]);
}

function cmd_VTX_XZ(ctx: ContextInternal) {
    const param = ctx.readParam();
    let x = (param & 0xFFFF);
    let z = (param >> 16) & 0xFFFF;

    // Sign extend.
    x = (x << 16 >> 16);
    z = (z << 16 >> 16);

    // Fixed point.
    x = x / 4096.0;
    z = z / 4096.0;

    ctx.vtx(x, ctx.s_vtx[1], z);
}

function cmd_VTX_YZ(ctx: ContextInternal) {
    const param = ctx.readParam();
    let y = (param & 0xFFFF);
    let z = (param >> 16) & 0xFFFF;

    // Sign extend.
    y = (y << 16 >> 16);
    z = (z << 16 >> 16);

    // Fixed point.
    y = y / 4096.0;
    z = z / 4096.0;

    ctx.vtx(ctx.s_vtx[0], y, z);
}

function cmd_VTX_DIFF(ctx: ContextInternal) {
    const param = ctx.readParam();

    let x = (param & 0x03FF);
    let y = (param >> 10) & 0x03FF;
    let z = (param >> 20) & 0x03FF;

    // Sign extend.
    x = (x << 22 >> 22);
    y = (y << 22 >> 22);
    z = (z << 22 >> 22);

    // Fixed point.
    x = x / 4096.0;
    y = y / 4096.0;
    z = z / 4096.0;

    // Add on the difference...
    x += ctx.s_vtx[0];
    y += ctx.s_vtx[1];
    z += ctx.s_vtx[2];

    ctx.vtx(x, y, z);
}

function cmd_DIF_AMB(ctx: ContextInternal) {
    const param = ctx.readParam();
    // TODO: lighting
}

function cmd_BEGIN_VTXS(ctx: ContextInternal) {
    const param = ctx.readParam();
    const polyType = param & 0x03;
    ctx.s_polyType = polyType;
    ctx.s_startVertexIndex = ctx.vtxs.length;
}

export interface DrawCall {
    startIndex: number;
    numIndices: number;
}

function translatePolyType(polyType: PolyType): GfxTopology {
    switch (polyType) {
    case PolyType.TRIANGLES:
        return GfxTopology.Triangles;
    case PolyType.TRIANGLE_STRIP:
        return GfxTopology.TriStrips;
    case PolyType.QUADS:
        return GfxTopology.Quads;
    case PolyType.QUAD_STRIP:
        return GfxTopology.QuadStrips;
    }
}

function cmd_END_VTXS(ctx: ContextInternal) {
    const baseVertex = ctx.s_startVertexIndex;
    const numVertices = ctx.vtxs.length - baseVertex;

    const newIndexBuffer = makeTriangleIndexBuffer(translatePolyType(ctx.s_polyType), baseVertex, numVertices);
    for (let i = 0; i < newIndexBuffer.length; i++)
        ctx.indexes.push(newIndexBuffer[i]);
}

function runCmd(ctx: ContextInternal, cmd: number) {
    switch (cmd) {
    case 0: return;
    case CmdType.MTX_RESTORE: return cmd_MTX_RESTORE(ctx);
    case CmdType.COLOR:       return cmd_COLOR(ctx);
    case CmdType.NORMAL:      return cmd_NORMAL(ctx);
    case CmdType.TEXCOORD:    return cmd_TEXCOORD(ctx);
    case CmdType.VTX_16:      return cmd_VTX_16(ctx);
    case CmdType.VTX_10:      return cmd_VTX_10(ctx);
    case CmdType.VTX_XY:      return cmd_VTX_XY(ctx);
    case CmdType.VTX_XZ:      return cmd_VTX_XZ(ctx);
    case CmdType.VTX_YZ:      return cmd_VTX_YZ(ctx);
    case CmdType.VTX_DIFF:    return cmd_VTX_DIFF(ctx);
    case CmdType.DIF_AMB:     return cmd_DIF_AMB(ctx);
    case CmdType.BEGIN_VTXS:  return cmd_BEGIN_VTXS(ctx);
    case CmdType.END_VTXS:    return cmd_END_VTXS(ctx);
    default: console.warn("Missing command", cmd.toString(16));
    }
}

interface Vertex {
    pos: ReadonlyVec3;
    nrm: ReadonlyVec3;
    color: Color;
    uv: ReadonlyVec2;
    mtxId: number;
}

export class Context {
    public color: Color;
    public alpha: number;
}

class ContextInternal {
    public view: DataView;
    public offs: number = 0;

    public alpha: number;
    public s_color: Color;
    public s_texCoord = vec2.create();
    public s_vtx = vec3.create();
    public s_nrm = vec3.create();
    public s_polyType: PolyType;
    public s_mtxId: number = 0;
    public s_startVertexIndex: number = 0;

    public vtxs: Vertex[] = [];
    public indexes: number[] = [];

    constructor(buffer: ArrayBufferSlice, baseCtx: Context, public posScale: number) {
        this.view = buffer.createDataView();
        this.alpha = baseCtx.alpha;
        this.s_color = colorNewCopy(baseCtx.color);
    }

    public readParam(): number {
        return this.view.getUint32((this.offs += 4) - 4, true);
    }

    public vtx(x: number, y: number, z: number) {
        vec3.set(this.s_vtx, x, y, z);
        this.vtxs.push({ pos: vec3.clone(this.s_vtx), nrm: vec3.clone(this.s_nrm), color: colorNewCopy(this.s_color), uv: vec2.clone(this.s_texCoord), mtxId: this.s_mtxId });
    }

    public makePackedVertexBuffer(): Float32Array {
        const vtxBuffer = new Float32Array(this.vtxs.length * VERTEX_SIZE);

        for (let i = 0; i < this.vtxs.length; i++) {
            const v = this.vtxs[i];
            vtxBuffer[i * VERTEX_SIZE + 0] = v.pos[0] * this.posScale;
            vtxBuffer[i * VERTEX_SIZE + 1] = v.pos[1] * this.posScale;
            vtxBuffer[i * VERTEX_SIZE + 2] = v.pos[2] * this.posScale;
            vtxBuffer[i * VERTEX_SIZE + 3] = v.color.r;
            vtxBuffer[i * VERTEX_SIZE + 4] = v.color.g;
            vtxBuffer[i * VERTEX_SIZE + 5] = v.color.b;
            vtxBuffer[i * VERTEX_SIZE + 6] = this.alpha / 0xFF;
            vtxBuffer[i * VERTEX_SIZE + 7] = v.uv[0];
            vtxBuffer[i * VERTEX_SIZE + 8] = v.uv[1];
            vtxBuffer[i * VERTEX_SIZE + 9] = v.nrm[0];
            vtxBuffer[i * VERTEX_SIZE + 10] = v.nrm[1];
            vtxBuffer[i * VERTEX_SIZE + 11] = v.nrm[2];
            vtxBuffer[i * VERTEX_SIZE + 12] = v.mtxId;
        }

        return vtxBuffer;
    }
}

export interface VertexData {
    packedVertexBuffer: Float32Array;
    indexBuffer: Uint16Array;
    drawCall: DrawCall;
}

export function readCmds(buffer: ArrayBufferSlice, baseCtx: Context, posScale: number = 1): VertexData {
    const ctx = new ContextInternal(buffer, baseCtx, posScale);

    while (ctx.offs < buffer.byteLength) {
        // Commands are packed 4 at a time...
        const cmd0 = ctx.view.getUint8(ctx.offs++);
        const cmd1 = ctx.view.getUint8(ctx.offs++);
        const cmd2 = ctx.view.getUint8(ctx.offs++);
        const cmd3 = ctx.view.getUint8(ctx.offs++);

        runCmd(ctx, cmd0);
        runCmd(ctx, cmd1);
        runCmd(ctx, cmd2);
        runCmd(ctx, cmd3);
    }

    const packedVertexBuffer = ctx.makePackedVertexBuffer();
    const indexBuffer = new Uint16Array(ctx.indexes);
    const drawCall = { startIndex: 0, numIndices: indexBuffer.length };

    return { packedVertexBuffer, indexBuffer, drawCall };
}
