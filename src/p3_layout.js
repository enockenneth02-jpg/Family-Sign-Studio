
/* ---------------------------------------------------------- auto layouts */
function sizeOptions(n) {
  const opts = [], seen = new Set();
  const add = a => { if (a.some(v => v < 1 || v > 8)) return; if (a.length > 1 && Math.min(...a) < 2 && !(n <= 3 && a.length === 2)) return; const k = a.join('+'); if (a.reduce((s, v) => s + v, 0) === n && !seen.has(k)) { seen.add(k); opts.push(a); } };
  for (let k = 1; k <= 5; k++) {
    if (k > n) break;
    const base = Math.floor(n / k), extra = n % k;
    if (!extra) { add(Array(k).fill(base)); continue; }
    const top = Array(k).fill(base).map((v, i) => i < extra ? v + 1 : v); add(top);
    const bottom = Array(k).fill(base).map((v, i) => i >= k - extra ? v + 1 : v); add(bottom);
    if (k >= 3) {
      const order = [...Array(k).keys()].sort((a, b) => Math.abs(a - (k - 1) / 2) - Math.abs(b - (k - 1) / 2));
      const mid = Array(k).fill(base); order.slice(0, extra).forEach(i => mid[i]++); add(mid);
    }
  }
  for (let k = 2; k <= 5; k++) for (let s = k; s <= 8; s++) {   // tapering rows such as 4+3+2
    const a = Array.from({ length: k }, (_, i) => s - i); if (a[k - 1] >= 1 && a.reduce((t, v) => t + v, 0) === n) add(a);
  }
  return opts.sort((a, b) => a.length - b.length);
}
function defaultSizes(n) {
  if (n <= 0) return [];
  const o = sizeOptions(n);
  return o.find(a => Math.max(...a) <= 5) || o[0] || [n];
}
function currentRows() {
  const n = S.members.length;
  if (S.set.lmode === 'gen') {
    const gens = [...new Set(S.members.map(m => m.gen))].sort((a, b) => a - b);
    return gens.map(g => S.members.filter(m => m.gen === g));
  }
  let sizes = S.rowSizes;
  if (!sizes || sizes.reduce((s, v) => s + v, 0) !== n) sizes = defaultSizes(n);
  let i = 0; return sizes.map(s => S.members.slice(i, i += s));
}
function chooseCols(k, C, prev) {
  if (C > 12) return null;
  if (k === C) return [...Array(C).keys()];
  let best = null, bs = -1e9; const mid = (C - 1) / 2;
  for (let mask = 1; mask < (1 << C); mask++) {
    const cols = []; for (let c = 0; c < C; c++) if (mask >> c & 1) cols.push(c);
    if (cols.length !== k) continue;
    if (!cols.every(c => mask >> (C - 1 - c) & 1)) continue;          // must mirror left/right
    let sc = 0; if (prev && cols.every(c => prev.includes(c))) sc += 1000;
    sc += cols.reduce((s, c) => s + Math.abs(c - mid), 0);
    if (sc > bs) { bs = sc; best = cols; }
  }
  return best;
}
function fitFactor(widthFor) {
  const limit = boardRect().w * 0.96; let f = 1;
  if (!S.set.fit) return 1;
  while (f > 0.35 && widthFor(f) > limit) f -= 0.02;
  return Math.round(f * 100) / 100;
}
function layoutRows() {
  const rows = currentRows().filter(r => r.length); if (!rows.length) return;
  const gap = S.set.gap, chain = S.set.chain, bw = boardRect().w, C = Math.max(...rows.map(r => r.length));
  const place = S.set.place;
  const widthFor = f => {
    const maxW = Math.max(...S.members.map(m => S.set.figH * m.sz * f * m.asset.w / m.asset.h));
    return (C - 1) * (maxW + gap) + maxW;
  };
  S.set.fitF = fitFactor(widthFor); applyHeights();
  const maxW = Math.max(...S.members.map(mw)), pitch = maxW + gap, cxb = bw / 2;
  let anchorY = boardLowest() + chain, prev = null;
  for (const row of rows) {
    const k = row.length; let cols = null, txs;
    if (place === 'grid') cols = chooseCols(k, C, prev);
    else if (place === 'left') cols = [...Array(k).keys()];
    else if (place === 'right') cols = Array.from({ length: k }, (_, i) => C - k + i);
    if (cols) { txs = cols.map(c => cxb + (c - (C - 1) / 2) * pitch); prev = cols; }
    else { txs = row.map((_, j) => cxb + (j - (k - 1) / 2) * pitch); prev = null; }   // centred on the same column pitch, so odd/even rows sit between the ones above
    row.forEach((m, i) => { m.x = txs[i] - m.asset.topFx * mw(m); m.y = anchorY - m.asset.topFy * m.h - INSET; m.parent = 'auto'; });
    anchorY = Math.max(...row.map(lowestY)) + chain;
  }
  straighten();
}
function straighten() {          // nudge each figure so its hole is right under the hole it hangs from
  for (const m of S.members.slice().sort((a, b) => a.y - b.y)) {
    S.linksDirty = true; computeLinks();
    const l = S.links.find(k => k.child === m), dx = l ? l.ax - l.bx : 0;
    if (Math.abs(dx) > 0.02 && Math.abs(dx) < 0.9) { m.x += dx; if (S.members.some(o => o !== m && overlapAmount(m, o) > 0.05)) m.x -= dx; }
  }
  S.linksDirty = true;
}
function layoutTree() {
  const ms = S.members; if (!ms.length) return;
  const byId = new Map(ms.map(m => [m.id, m]));
  const parentOf = m => (m.parent && m.parent !== 'auto' && m.parent !== 'board' && m.parent !== m.id && byId.has(m.parent)) ? byId.get(m.parent) : null;
  for (const m of ms) {                       // break accidental loops
    const seen = new Set([m.id]); let cur = parentOf(m);
    while (cur) { if (seen.has(cur.id)) { m.parent = 'auto'; break; } seen.add(cur.id); cur = parentOf(cur); }
  }
  const kids = new Map(ms.map(m => [m.id, []])), roots = [];
  for (const m of ms) { const p = parentOf(m); if (p) kids.get(p.id).push(m); else roots.push(m); }
  const gap = S.set.gap, chain = S.set.chain, bw = boardRect().w;
  const wf = (m, f) => S.set.figH * m.sz * f * m.asset.w / m.asset.h;
  const subW = (m, f) => { const ks = kids.get(m.id); if (!ks.length) return wf(m, f); return Math.max(wf(m, f), ks.reduce((t, c) => t + subW(c, f), 0) + gap * (ks.length - 1)); };
  const total = f => roots.reduce((t, r) => t + subW(r, f), 0) + gap * (roots.length - 1);
  S.set.fitF = fitFactor(total); applyHeights();
  const f = S.set.fitF, depthOf = new Map(), tx = new Map();
  const put = (m, left, d) => {
    const ks = kids.get(m.id), bwid = subW(m, f); depthOf.set(m.id, d);
    const childW = ks.reduce((t, c) => t + subW(c, f), 0) + gap * Math.max(0, ks.length - 1);
    let x = left + (bwid - childW) / 2; ks.forEach(c => { put(c, x, d + 1); x += subW(c, f) + gap; });
    tx.set(m.id, left + bwid / 2);
  };
  let left = bw / 2 - total(f) / 2; roots.forEach(r => { put(r, left, 0); left += subW(r, f) + gap; });
  const maxD = Math.max(...depthOf.values()); let anchorY = boardLowest() + chain;
  for (let d = 0; d <= maxD; d++) {
    const row = ms.filter(m => depthOf.get(m.id) === d);
    row.forEach(m => { m.x = tx.get(m.id) - m.asset.topFx * mw(m); m.y = anchorY - m.asset.topFy * m.h - INSET; });
    if (row.length) anchorY = Math.max(...row.map(lowestY)) + chain;
  }
  for (const m of roots) m.parent = 'auto';
  straighten();
}
function guessTree() {
  const gens = [...new Set(S.members.map(m => m.gen))].sort((a, b) => a - b);
  for (let gi = 0; gi < gens.length; gi++) {
    const row = S.members.filter(m => m.gen === gens[gi]);
    if (gi === 0) { row.forEach(m => m.parent = 'auto'); continue; }
    const ups = S.members.filter(m => m.gen === gens[gi - 1]);
    row.forEach((m, i) => { m.parent = ups[Math.min(ups.length - 1, Math.floor(i * ups.length / row.length))].id; });
  }
}
function autoLayout() {
  if (!S.members.length) return;
  if (S.set.lmode === 'tree') layoutTree(); else layoutRows();
  S.manual = false; commit(); fitView();
}

/* -------------------------------------------------------- align commands */
const selMembers = () => S.members.filter(m => S.sel.has(m.id));
function alignSel(kind) {
  const ms = selMembers(); if (!ms.length) return;
  const rs = ms.map(m => [m, rectOf(m)]);
  const x0 = Math.min(...rs.map(([, r]) => r.x)), x1 = Math.max(...rs.map(([, r]) => r.x + r.w));
  const y0 = Math.min(...rs.map(([, r]) => r.y)), y1 = Math.max(...rs.map(([, r]) => r.y + r.h));
  if (kind === 'cardc') { const dx = boardRect().w / 2 - (x0 + x1) / 2; ms.forEach(m => m.x += dx); }
  else if (ms.length > 1) {
    if (kind === 'l') rs.forEach(([m]) => m.x = x0);
    if (kind === 'c') rs.forEach(([m, r]) => m.x = (x0 + x1) / 2 - r.w / 2);
    if (kind === 'r') rs.forEach(([m, r]) => m.x = x1 - r.w);
    if (kind === 't') rs.forEach(([m]) => m.y = y0);
    if (kind === 'm') rs.forEach(([m, r]) => m.y = (y0 + y1) / 2 - r.h / 2);
    if (kind === 'b') rs.forEach(([m, r]) => m.y = y1 - r.h);
    if (kind === 'dh' && ms.length > 2) {
      const s = rs.slice().sort((a, b) => a[1].x - b[1].x), tw = s.reduce((t, [, r]) => t + r.w, 0), g = (x1 - x0 - tw) / (s.length - 1); let x = x0;
      s.forEach(([m, r]) => { m.x = x; x += r.w + g; });
    }
    if (kind === 'dv' && ms.length > 2) {
      const s = rs.slice().sort((a, b) => a[1].y - b[1].y), th = s.reduce((t, [, r]) => t + r.h, 0), g = (y1 - y0 - th) / (s.length - 1); let y = y0;
      s.forEach(([m, r]) => { m.y = y; y += r.h + g; });
    }
    if (kind === 'swap' && ms.length === 2) {
      const [a, b] = ms, ta = topAnchor(a), tb = topAnchor(b);
      a.x += tb.x - ta.x; a.y += tb.y - ta.y; b.x += ta.x - tb.x; b.y += ta.y - tb.y;
    }
  }
  S.manual = true; commit();
}
function hangStraight(m) {            // put the figure straight under the hole it hangs from
  if (S.linksDirty) computeLinks();
  const l = S.links.find(k => k.child === m); if (!l) return;
  m.x += l.ax - l.bx; S.manual = true; commit();
}

/* ------------------------------------------------------------ stage view */
let cv, cx, VW = 0, VH = 0, dpr = 1, raf = 0, COL = { stage: '#e8ebf1', dot: '#c3c9d6', acc: '#2f56c4', err: '#d0343f', warn: '#d98a12' };
function requestRender() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; renderStage(); }); }
function resizeStage() {
  const r = cv.parentElement.getBoundingClientRect(); dpr = window.devicePixelRatio || 1; VW = r.width; VH = r.height;
  cv.width = Math.max(1, Math.round(VW * dpr)); cv.height = Math.max(1, Math.round(VH * dpr)); cv.style.width = VW + 'px'; cv.style.height = VH + 'px';
  requestRender();
}
const toWorld = (px, py) => ({ x: (px - S.view.ox) / S.view.z, y: (py - S.view.oy) / S.view.z });
function fitView() {
  if (!VW) return;
  const b = sceneBounds(), pad = 1.2, bw = b.x1 - b.x0 + pad * 2, bh = b.y1 - b.y0 + pad * 2;
  const top = 54, bot = 52, z = clamp(Math.min((VW - 24) / bw, (VH - top - bot) / bh), 2, 90);
  S.view.moved = false; S.view.z = z; S.view.ox = (VW - (b.x1 - b.x0) * z) / 2 - b.x0 * z; S.view.oy = top + (VH - top - bot - (b.y1 - b.y0) * z) / 2 - b.y0 * z;
  requestRender(); const l = $('#zoomLbl'); if (l) l.textContent = Math.round(z / 18 * 100) + '%';
}
function zoomAt(px, py, f) {
  const w = toWorld(px, py), z = clamp(S.view.z * f, 2, 120);
  S.view.moved = true; S.view.z = z; S.view.ox = px - w.x * z; S.view.oy = py - w.y * z;
  requestRender(); const l = $('#zoomLbl'); if (l) l.textContent = Math.round(z / 18 * 100) + '%';
}
let GUIDES = [], MARQ = null;
function renderStage() {
  if (!cx) return;
  const ctx = cx, z = S.view.z;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = COL.stage; ctx.fillRect(0, 0, cv.width, cv.height);
  const step = z >= 9 ? z : z * 5; ctx.fillStyle = COL.dot;
  for (let x = ((S.view.ox % step) + step) % step; x < VW; x += step) for (let y = ((S.view.oy % step) + step) % step; y < VH; y += step) ctx.fillRect(Math.round(x * dpr), Math.round(y * dpr), Math.max(1, dpr), Math.max(1, dpr));
  drawScene(ctx, { k: z * dpr, ox: S.view.ox * dpr, oy: S.view.oy * dpr, dpr, names: S.set.names, ghost: S.ghost && !!S.base });
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const sx = x => S.view.ox + x * z, sy = y => S.view.oy + y * z;
  const bad = new Map(); for (const i of S.issues) if (i.lvl !== 'info') for (const id of i.ids) bad.set(id, i.lvl === 'err' ? COL.err : (bad.get(id) || COL.warn));
  for (const m of S.members) {
    const r = rectOf(m), selected = S.sel.has(m.id), c = bad.get(m.id);
    if (!selected && !c) continue;
    ctx.setLineDash(selected ? [] : [5, 4]); ctx.lineWidth = selected ? 2 : 1.5; ctx.strokeStyle = selected ? COL.acc : c;
    ctx.strokeRect(sx(r.x) - 3, sy(r.y) - 3, r.w * z + 6, r.h * z + 6);
    if (selected) { ctx.fillStyle = 'rgba(47,86,196,.07)'; ctx.fillRect(sx(r.x) - 3, sy(r.y) - 3, r.w * z + 6, r.h * z + 6); }
  }
  ctx.setLineDash([]);
  ctx.lineWidth = 1; ctx.strokeStyle = '#d6226f';
  for (const g of GUIDES) { ctx.beginPath(); if (g.t === 'v') { ctx.moveTo(sx(g.v) + .5, 0); ctx.lineTo(sx(g.v) + .5, VH); } else { ctx.moveTo(0, sy(g.v) + .5); ctx.lineTo(VW, sy(g.v) + .5); } ctx.stroke(); }
  if (MARQ) { ctx.setLineDash([4, 3]); ctx.strokeStyle = COL.acc; ctx.fillStyle = 'rgba(47,86,196,.08)'; const r = MARQ; ctx.fillRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0); ctx.strokeRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0); ctx.setLineDash([]); }
  if (!S.board && !S.members.length) {
    ctx.fillStyle = '#6b7488'; ctx.font = '600 15px Figtree, system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(tr('emptyStage'), VW / 2, VH / 2);
  } else if (S.board && !S.members.length) {
    ctx.fillStyle = '#6b7488'; ctx.font = '600 15px Figtree, system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(tr('emptyMembers'), VW / 2, S.view.oy + (boardRect().h) * z + 36);
  }
}

/* ------------------------------------------------------------ pointer UI */
const P = { ptrs: new Map(), drag: null, pan: null, marq: null, pinch: null, space: false };
function pickAt(wx, wy) {
  for (let i = S.members.length - 1; i >= 0; i--) { const m = S.members[i]; if (maskHit(rectOf(m), m.asset, wx, wy, 2)) return m; }
  return null;
}
function snapDrag(dx, dy, orig) {
  const sel = selMembers(), z = S.view.z, th = 7 / z;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const m of sel) { const o = orig.get(m.id); x0 = Math.min(x0, o.x + dx); y0 = Math.min(y0, o.y + dy); x1 = Math.max(x1, o.x + dx + mw(m)); y1 = Math.max(y1, o.y + dy + m.h); }
  const xsD = [x0, (x0 + x1) / 2, x1], ysD = [y0, (y0 + y1) / 2, y1], single = sel.length === 1;
  let chainD = null;
  if (single) { const m = sel[0], o = orig.get(m.id); xsD.push(o.x + dx + m.asset.topFx * mw(m), o.x + dx + m.asset.botFx * mw(m)); chainD = o.y + dy + m.asset.topFy * m.h + INSET; }
  const br = boardRect(), xt = [0, br.w / 2, br.w], yt = [], ct = [];
  if (S.board) ct.push(boardLowest() + S.set.chain);
  for (const o of S.members) {
    if (S.sel.has(o.id)) continue; const r = rectOf(o);
    xt.push(r.x, r.x + r.w / 2, r.x + r.w, topAnchor(o).x, botAnchorX(o)); yt.push(r.y, r.y + r.h / 2, r.y + r.h); ct.push(lowestY(o) + S.set.chain);
  }
  let bx = null, by = null;
  for (const a of xsD) for (const t of xt) { const d = t - a; if (Math.abs(d) < th && (!bx || Math.abs(d) < Math.abs(bx.d))) bx = { d, v: t }; }
  for (const a of ysD) for (const t of yt) { const d = t - a; if (Math.abs(d) < th && (!by || Math.abs(d) < Math.abs(by.d))) by = { d, v: t }; }
  if (chainD != null) for (const t of ct) { const d = t - chainD; if (Math.abs(d) < th && (!by || Math.abs(d) < Math.abs(by.d))) by = { d, v: t - 0 , chain: true }; }
  const g = [];
  if (bx) { dx += bx.d; g.push({ t: 'v', v: bx.v }); }
  if (by) { dy += by.d; if (!by.chain) g.push({ t: 'h', v: by.v }); }
  return { dx, dy, g };
}
function initPointer() {
  const pos = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  cv.addEventListener('pointerdown', e => {
    cv.setPointerCapture(e.pointerId); const p = pos(e); P.ptrs.set(e.pointerId, p);
    if (P.ptrs.size === 2) { const [a, b] = [...P.ptrs.values()]; P.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: S.view.z }; P.drag = P.pan = P.marq = null; MARQ = null; GUIDES = []; return; }
    const w = toWorld(p.x, p.y), hit = (e.button === 1 || P.space) ? null : pickAt(w.x, w.y);
    if (hit) {
      let toggle = null;
      if (!S.sel.has(hit.id)) { if (!e.shiftKey) S.sel.clear(); S.sel.add(hit.id); } else if (e.shiftKey) toggle = hit.id;
      syncSel();
      P.drag = { s: p, w, moved: false, toggle, orig: new Map(selMembers().map(m => [m.id, { x: m.x, y: m.y }])) };
    } else if (e.shiftKey && e.button === 0) { P.marq = { x0: p.x, y0: p.y }; MARQ = { x0: p.x, y0: p.y, x1: p.x, y1: p.y }; }
    else P.pan = { s: p, ox: S.view.ox, oy: S.view.oy, moved: false };
    requestRender();
  });
  cv.addEventListener('pointermove', e => {
    if (!P.ptrs.has(e.pointerId)) { const p = pos(e); const w = toWorld(p.x, p.y); cv.style.cursor = P.space ? 'grab' : pickAt(w.x, w.y) ? 'move' : 'default'; return; }
    const p = pos(e); P.ptrs.set(e.pointerId, p);
    if (P.pinch && P.ptrs.size === 2) {
      const [a, b] = [...P.ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), cxp = (a.x + b.x) / 2, cyp = (a.y + b.y) / 2;
      const target = clamp(P.pinch.z * d / P.pinch.d, 2, 120); zoomAt(cxp, cyp, target / S.view.z); return;
    }
    if (P.drag) {
      if (!P.drag.moved && Math.hypot(p.x - P.drag.s.x, p.y - P.drag.s.y) < 3) return;
      P.drag.moved = true;
      const w = toWorld(p.x, p.y); let dx = w.x - P.drag.w.x, dy = w.y - P.drag.w.y;
      if (S.set.guides && !e.altKey) { const r = snapDrag(dx, dy, P.drag.orig); dx = r.dx; dy = r.dy; GUIDES = r.g; } else GUIDES = [];
      for (const m of selMembers()) { const o = P.drag.orig.get(m.id); m.x = o.x + dx; m.y = o.y + dy; }
      S.linksDirty = true; scheduleChecks(); updatePosFields(); requestRender();
    } else if (P.pan) {
      const dx = p.x - P.pan.s.x, dy = p.y - P.pan.s.y; if (Math.hypot(dx, dy) > 3) P.pan.moved = true;
      S.view.moved = true; S.view.ox = P.pan.ox + dx; S.view.oy = P.pan.oy + dy; requestRender();
    } else if (P.marq) {
      MARQ = { x0: P.marq.x0, y0: P.marq.y0, x1: p.x, y1: p.y }; requestRender();
    }
  });
  const up = e => {
    if (!P.ptrs.has(e.pointerId)) return; P.ptrs.delete(e.pointerId);
    if (P.pinch) { if (P.ptrs.size < 2) P.pinch = null; return; }
    if (P.drag) {
      if (P.drag.moved) { S.manual = true; commit(); } else if (P.drag.toggle) { S.sel.delete(P.drag.toggle); syncSel(); }
      P.drag = null; GUIDES = [];
    } else if (P.pan) {
      if (!P.pan.moved && S.sel.size) { S.sel.clear(); syncSel(); } P.pan = null;
    } else if (P.marq && MARQ) {
      const a = toWorld(Math.min(MARQ.x0, MARQ.x1), Math.min(MARQ.y0, MARQ.y1)), b = toWorld(Math.max(MARQ.x0, MARQ.x1), Math.max(MARQ.y0, MARQ.y1));
      S.sel.clear(); for (const m of S.members) { const r = rectOf(m); if (r.x < b.x && r.x + r.w > a.x && r.y < b.y && r.y + r.h > a.y) S.sel.add(m.id); }
      P.marq = null; MARQ = null; syncSel();
    }
    requestRender();
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', e => { e.preventDefault(); const p = pos(e); zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
  window.addEventListener('keydown', e => {
    const tag = (e.target.tagName || '').toLowerCase(); if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
    if (e.code === 'Space') { P.space = true; if (!e.repeat) e.preventDefault(); return; }
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
    if (mod && e.key.toLowerCase() === 'a') { e.preventDefault(); S.members.forEach(m => S.sel.add(m.id)); syncSel(); return; }
    if (e.key === 'Escape') { S.sel.clear(); syncSel(); return; }
    if ((e.key === 'Delete' || e.key === 'Backspace') && S.mode === 'shop' && S.sel.size) { e.preventDefault(); removeMembers([...S.sel]); return; }
    const st = e.shiftKey ? 1 : 0.1, arrows = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] };
    if (arrows[e.key] && S.sel.size) { e.preventDefault(); selMembers().forEach(m => { m.x += arrows[e.key][0]; m.y += arrows[e.key][1]; }); S.linksDirty = true; clearTimeout(initPointer.t); requestRender(); updatePosFields(); initPointer.t = setTimeout(() => { S.manual = true; commit(); }, 350); }
  });
  window.addEventListener('keyup', e => { if (e.code === 'Space') P.space = false; });
}
