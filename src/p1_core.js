'use strict';
(function () {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 9);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt = v => (Math.round(v * 10) / 10).toFixed(1);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const INSET = 0.35;      // cm: hole sits this far inside the acrylic edge
const MINCHAIN = 0.3;    // cm: shortest chain the auto-parent will accept
const MAXM = 20;         // most members one sign can have

/* ------------------------------------------------------------------ state */
const S = {
  mode: 'shop',
  board: null,            // {asset, wCm, hCm, lock, sized, blank, title}
  members: [],            // {id,name,asset,x,y,sz,h,parent,gen}
  sel: new Set(),
  set: { gap: 0.8, chain: 3, figH: 9, fitF: 1, fit: true, maxKids: 2, guides: true, names: true, place: 'grid', lmode: 'rows' },
  rowSizes: null,
  view: { z: 18, ox: 30, oy: 30 },
  base: null,             // {m:{id:{x,y,h}}}  layout as the shop left it
  ghost: false,
  meta: { customer: '', note: '', lockCount: false },
  manual: false,          // true once somebody moved things by hand (so uploads do not re-arrange everything)
  links: [], linksDirty: true, issues: []
};
const assets = new Map();

const mw = m => m.h * m.asset.w / m.asset.h;
const rectOf = m => ({ x: m.x, y: m.y, w: mw(m), h: m.h });
function boardRect() {
  const b = S.board; if (!b) return { x: 0, y: 0, w: 30, h: 20 };
  return { x: 0, y: 0, w: b.wCm, h: b.hCm || b.wCm * b.asset.h / b.asset.w };
}
const boardLowest = () => { const r = boardRect(); return S.board ? r.y + S.board.asset.maxBot * r.h - INSET : 0; };
const topAnchor = m => ({ x: m.x + m.asset.topFx * mw(m), y: m.y + m.asset.topFy * m.h + INSET });
const botAnchorX = m => m.x + m.asset.botFx * mw(m);
const lowestY = m => m.y + m.asset.maxBot * m.h - INSET;
function applyHeights() { for (const m of S.members) m.h = S.set.figH * m.sz * S.set.fitF; }

/* ---------------------------------------------------------------- history */
const Hist = { stack: [], idx: -1 };
function snap() {
  return JSON.stringify({
    members: S.members.map(m => ({ id: m.id, name: m.name, a: m.asset.id, x: m.x, y: m.y, sz: m.sz, h: m.h, parent: m.parent, gen: m.gen })),
    board: S.board ? { a: S.board.asset.id, w: S.board.wCm, h: S.board.hCm, lock: S.board.lock, sized: S.board.sized, blank: S.board.blank, title: S.board.title } : null,
    set: S.set, rowSizes: S.rowSizes
  });
}
function restore(js) {
  const o = JSON.parse(js);
  S.members = o.members.map(m => ({ id: m.id, name: m.name, asset: assets.get(m.a), x: m.x, y: m.y, sz: m.sz, h: m.h, parent: m.parent, gen: m.gen })).filter(m => m.asset);
  if (o.board) { const a = assets.get(o.board.a); if (a) S.board = { asset: a, wCm: o.board.w, hCm: o.board.h, lock: o.board.lock, sized: o.board.sized, blank: o.board.blank, title: o.board.title || '' }; } else S.board = null;
  Object.assign(S.set, o.set); S.rowSizes = o.rowSizes;
  S.sel = new Set([...S.sel].filter(id => S.members.some(m => m.id === id)));
}
function commit() {
  const s = snap();
  if (Hist.stack[Hist.idx] === s) { changed(false); return; }
  Hist.stack = Hist.stack.slice(0, Hist.idx + 1); Hist.stack.push(s);
  if (Hist.stack.length > 120) Hist.stack.shift();
  Hist.idx = Hist.stack.length - 1;
  changed(true);
}
function resetHistory() { Hist.stack = [snap()]; Hist.idx = 0; changed(true); }
function undo() { if (Hist.idx > 0) { Hist.idx--; restore(Hist.stack[Hist.idx]); changed(true); } }
function redo() { if (Hist.idx < Hist.stack.length - 1) { Hist.idx++; restore(Hist.stack[Hist.idx]); changed(true); } }

/* ------------------------------------------------------- image pipeline */
function loadImage(src) {
  return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error(tr('errImage'))); im.src = src; });
}
async function fileToImage(file) {
  const url = URL.createObjectURL(file);
  try { return await loadImage(url); } finally { setTimeout(() => URL.revokeObjectURL(url), 4000); }
}
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); c.getContext('2d', { willReadFrequently: true }); return c; }
function toCanvas(im, maxDim) {
  const w = im.naturalWidth || im.width, h = im.naturalHeight || im.height;
  const s = Math.min(1, maxDim / Math.max(w, h));
  const c = mkCanvas(w * s, h * s);
  c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
  return c;
}
function hasAlpha(c) {
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let n = 0, t = 0;
  for (let i = 3; i < d.length; i += 20) { t++; if (d[i] < 245) n++; }
  return n > t * 0.004;
}
function removeBg(c, tol) {
  tol = tol || 30;
  const ctx = c.getContext('2d'), W = c.width, H = c.height;
  const id = ctx.getImageData(0, 0, W, H), d = id.data;
  const med = a => { a.sort((x, y) => x - y); return a[a.length >> 1]; };
  const R = [], G = [], B = [];
  const patch = (x0, y0) => { for (let y = y0; y < y0 + 5; y++) for (let x = x0; x < x0 + 5; x++) { const i = (Math.min(H - 1, y) * W + Math.min(W - 1, x)) * 4; R.push(d[i]); G.push(d[i + 1]); B.push(d[i + 2]); } };
  patch(0, 0); patch(W - 5, 0); patch(0, H - 5); patch(W - 5, H - 5);
  const br = med(R), bg = med(G), bb = med(B);
  const dist = i => { const a = d[i] - br, b = d[i + 1] - bg, c2 = d[i + 2] - bb; return Math.sqrt(a * a + b * b + c2 * c2); };
  const vis = new Uint8Array(W * H), st = new Int32Array(W * H); let sp = 0;
  const push = p => { if (!vis[p] && dist(p * 4) <= tol) { vis[p] = 1; st[sp++] = p; } };
  for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
  while (sp) {
    const p = st[--sp], x = p % W, y = (p / W) | 0;
    d[p * 4 + 3] = 0;
    if (x > 0) push(p - 1); if (x < W - 1) push(p + 1); if (y > 0) push(p - W); if (y < H - 1) push(p + W);
  }
  // soften: drop 1-2 px fringe that is still nearly background coloured
  for (let pass = 0; pass < 2; pass++) {
    const kill = [];
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const p = y * W + x, i = p * 4;
      if (d[i + 3] === 0) continue;
      if ((d[i - 4 + 3] === 0 || d[i + 4 + 3] === 0 || d[i - W * 4 + 3] === 0 || d[i + W * 4 + 3] === 0) && dist(i) <= tol * 2.2) kill.push(i + 3);
    }
    for (const k of kill) d[k] = 0;
  }
  ctx.putImageData(id, 0, 0);
}
function trim(c, pad) {
  const W = c.width, H = c.height, d = c.getContext('2d').getImageData(0, 0, W, H).data;
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 12) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return c;
  pad = pad || 0;
  const o = mkCanvas(x1 - x0 + 1 + pad * 2, y1 - y0 + 1 + pad * 2);
  o.getContext('2d').drawImage(c, x0, y0, x1 - x0 + 1, y1 - y0 + 1, pad, pad, x1 - x0 + 1, y1 - y0 + 1);
  return o;
}
function fitMax(c, maxH, maxW) {
  const s = Math.min(1, maxH / c.height, (maxW || 1e9) / c.width);
  if (s >= 1) return c;
  const o = mkCanvas(c.width * s, c.height * s);
  const x = o.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, o.width, o.height);
  return o;
}
function addOutline(c, r) {
  const pad = r + 2, o = mkCanvas(c.width + pad * 2, c.height + pad * 2), x = o.getContext('2d');
  const w = mkCanvas(c.width, c.height), wx = w.getContext('2d');
  wx.drawImage(c, 0, 0); wx.globalCompositeOperation = 'source-in'; wx.fillStyle = '#fff'; wx.fillRect(0, 0, w.width, w.height);
  for (const rr of [r, r * 0.7, r * 0.4]) for (let a = 0; a < 360; a += 12) {
    const t = a * Math.PI / 180; x.drawImage(w, pad + Math.cos(t) * rr, pad + Math.sin(t) * rr);
  }
  x.drawImage(w, pad, pad); x.drawImage(c, pad, pad);
  return o;
}
/* mask, silhouette edges and chain-hole anchors */
function analyze(a) {
  const L = 128, sc = L / Math.max(a.w, a.h);
  const MW = Math.max(8, Math.round(a.w * sc)), MH = Math.max(8, Math.round(a.h * sc));
  const sm = mkCanvas(MW, MH), sx = sm.getContext('2d', { willReadFrequently: true });
  sx.imageSmoothingQuality = 'high'; sx.drawImage(a.canvas, 0, 0, MW, MH);
  const d = sx.getImageData(0, 0, MW, MH).data, m = new Uint8Array(MW * MH);
  for (let i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] > 40 ? 1 : 0;
  const top = new Float32Array(MW).fill(-1), bot = new Float32Array(MW).fill(-1), lowOk = new Uint8Array(MW);
  let minTop = 1, maxBot = 0;
  for (let c = 0; c < MW; c++) {
    let t = -1, b = -1, n = 0;
    for (let r = 0; r < MH; r++) if (m[r * MW + c]) { if (t < 0) t = r; b = r; n++; }
    if (n >= 2) { top[c] = t / MH; bot[c] = (b + 1) / MH; minTop = Math.min(minTop, top[c]); maxBot = Math.max(maxBot, bot[c]); }
  }
  const span = maxBot - minTop;
  for (let c = 0; c < MW; c++) lowOk[c] = bot[c] >= 0 && bot[c] >= maxBot - 0.22 * span ? 1 : 0;
  const pick = (arr, ok) => {
    let best = -1, bd = 1e9; const mid = (MW - 1) / 2;
    for (let c = 0; c < MW; c++) if (ok(c)) { const dd = Math.abs(c - mid); if (dd < bd) { bd = dd; best = c; } }
    return best < 0 ? Math.floor(MW / 2) : best;
  };
  const tc = pick(top, c => top[c] >= 0 && top[c] <= minTop + 0.06 * span);
  const bc = pick(bot, c => lowOk[c]);
  a.mask = { w: MW, h: MH, d: m };
  a.edge = { top, bot }; a.lowOk = lowOk; a.minTop = minTop; a.maxBot = maxBot;
  a.topFx = (tc + 0.5) / MW; a.topFy = top[tc] >= 0 ? top[tc] : minTop;
  a.botFx = (bc + 0.5) / MW;
  return a;
}
function buildAsset(canvas, name, id) {
  const a = { id: id || uid(), name: name || 'Figure', canvas, w: canvas.width, h: canvas.height };
  analyze(a); assets.set(a.id, a); return a;
}
/* import one image file as a figure/board canvas */
async function prepCanvas(file, opt) {
  const im = await fileToImage(file);
  let c = toCanvas(im, opt.maxDim || 1600);
  const alpha = hasAlpha(c);
  if (!alpha) removeBg(c, opt.tol || 30);
  return { c, alpha };
}
function finishCanvas(c, o) {
  c = trim(c, 0);
  c = fitMax(c, o.maxH || 640, o.maxW);
  if (o.outline) c = addOutline(c, Math.max(2, Math.round((o.board ? c.width * 0.006 : c.height * 0.02))));
  return c;
}
/* split a sheet holding many figures into separate canvases (reading order) */
function splitSheet(canvas) {
  const W = canvas.width, H = canvas.height;
  const s = Math.min(1, 800 / Math.max(W, H)), sw = Math.max(8, Math.round(W * s)), sh = Math.max(8, Math.round(H * s)), N = sw * sh;
  const sm = mkCanvas(sw, sh), sx = sm.getContext('2d', { willReadFrequently: true });
  sx.drawImage(canvas, 0, 0, sw, sh);
  const d = sx.getImageData(0, 0, sw, sh).data, op = new Uint8Array(N), core = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const a = d[i * 4 + 3]; if (a <= 40) continue; op[i] = 1;
    if (!(Math.min(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]) >= 232 && a >= 200)) core[i] = 1;   // white sticker outlines do not join figures
  }
  const lab = new Int32Array(N), comps = [], q = new Int32Array(N);
  for (let p0 = 0; p0 < N; p0++) {
    if (!core[p0] || lab[p0]) continue;
    const id = comps.length + 1; let qh = 0, qt = 0; q[qt++] = p0; lab[p0] = id;
    let x0 = sw, y0 = sh, x1 = 0, y1 = 0, area = 0;
    while (qh < qt) {
      const p = q[qh++], x = p % sw, y = (p / sw) | 0; area++;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= sw || ny >= sh) continue;
        const np = ny * sw + nx; if (core[np] && !lab[np]) { lab[np] = id; q[qt++] = np; }
      }
    }
    comps.push({ id, area, x0, y0, x1, y1 });
  }
  if (!comps.length) return [];
  const maxA = Math.max(...comps.map(c => c.area)), big = comps.filter(c => c.area >= maxA * 0.08), remap = new Int32Array(comps.length + 1);
  const near = Math.max(sw, sh) * 0.04;
  for (const c of comps) {
    if (big.includes(c)) { remap[c.id] = c.id; continue; }
    let best = null, bd = 1e9;
    for (const b of big) { const gx = Math.max(0, b.x0 - c.x1, c.x0 - b.x1), gy = Math.max(0, b.y0 - c.y1, c.y0 - b.y1), g = Math.hypot(gx, gy); if (g < bd) { bd = g; best = b; } }
    if (best && bd <= near) { remap[c.id] = best.id; best.x0 = Math.min(best.x0, c.x0); best.y0 = Math.min(best.y0, c.y0); best.x1 = Math.max(best.x1, c.x1); best.y1 = Math.max(best.y1, c.y1); }
  }
  for (let i = 0; i < N; i++) if (lab[i]) lab[i] = remap[lab[i]];
  // give the white outline pixels to the figure they surround (grow labels through opaque pixels only)
  let front = []; for (let i = 0; i < N; i++) if (lab[i]) front.push(i);
  for (let step = 0, G = Math.ceil(0.04 * Math.max(sw, sh)); step < G && front.length; step++) {
    const nf = [];
    for (const p of front) {
      const x = p % sw, y = (p / sw) | 0, l = lab[p];
      if (x > 0 && op[p - 1] && !lab[p - 1]) { lab[p - 1] = l; nf.push(p - 1); }
      if (x < sw - 1 && op[p + 1] && !lab[p + 1]) { lab[p + 1] = l; nf.push(p + 1); }
      if (y > 0 && op[p - sw] && !lab[p - sw]) { lab[p - sw] = l; nf.push(p - sw); }
      if (y < sh - 1 && op[p + sw] && !lab[p + sw]) { lab[p + sw] = l; nf.push(p + sw); }
    }
    front = nf;
  }
  const outs = [];
  for (const c of big) {
    const fx0 = Math.max(0, Math.floor(c.x0 / s) - 8), fy0 = Math.max(0, Math.floor(c.y0 / s) - 8);
    const fx1 = Math.min(W, Math.ceil((c.x1 + 1) / s) + 8), fy1 = Math.min(H, Math.ceil((c.y1 + 1) / s) + 8);
    const cw = fx1 - fx0, ch = fy1 - fy0, oc = mkCanvas(cw, ch), ox = oc.getContext('2d', { willReadFrequently: true });
    ox.drawImage(canvas, fx0, fy0, cw, ch, 0, 0, cw, ch);
    const id = ox.getImageData(0, 0, cw, ch), dd = id.data;
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const lx = Math.min(sw - 1, ((fx0 + x) * s) | 0), ly = Math.min(sh - 1, ((fy0 + y) * s) | 0);
      if (lab[ly * sw + lx] !== c.id) dd[(y * cw + x) * 4 + 3] = 0;
    }
    ox.putImageData(id, 0, 0);
    outs.push({ canvas: oc, cx: (c.x0 + c.x1) / 2, cy: (c.y0 + c.y1) / 2, h: c.y1 - c.y0 });
  }
  outs.sort((a, b) => a.cy - b.cy);
  const rows = [];
  for (const o of outs) {
    const row = rows.find(r2 => Math.abs(r2.cy - o.cy) < Math.min(r2.h, o.h) * 0.45);
    if (row) { row.items.push(o); row.cy = row.items.reduce((t, i) => t + i.cy, 0) / row.items.length; row.h = Math.max(row.h, o.h); }
    else rows.push({ cy: o.cy, h: o.h, items: [o] });
  }
  rows.sort((a, b) => a.cy - b.cy);
  return rows.flatMap(r2 => r2.items.sort((a, b) => a.cx - b.cx)).map(o => o.canvas);
}
