
/* --------------------------------------------------------------- geometry */
function maskHit(r, a, x, y, tol) {
  const u = (x - r.x) / r.w, v = (y - r.y) / r.h;
  if (u < 0 || u >= 1 || v < 0 || v >= 1) return false;
  const W = a.mask.w, H = a.mask.h, c = (u * W) | 0, rr = (v * H) | 0, d = a.mask.d;
  if (d[rr * W + c]) return true;
  if (tol) for (let j = -tol; j <= tol; j++) for (let i = -tol; i <= tol; i++) {
    const cc = c + i, r2 = rr + j; if (cc >= 0 && cc < W && r2 >= 0 && r2 < H && d[r2 * W + cc]) return true;
  }
  return false;
}
/* where a chain hanging straight down at x leaves the bottom edge of item r/a */
function bottomAt(r, a, x) {
  const W = a.mask.w; let c = Math.floor((x - r.x) / r.w * W);
  let exact = c >= 0 && c < W && a.lowOk[c] === 1;
  if (!exact) {
    let best = -1, bd = 1e9; const cc = clamp(c, 0, W - 1);
    for (let i = 0; i < W; i++) if (a.lowOk[i]) { const dd = Math.abs(i - cc); if (dd < bd) { bd = dd; best = i; } }
    if (best < 0) best = clamp(cc, 0, W - 1);
    c = best;
  }
  const ax = exact ? x : r.x + (c + 0.5) / W * r.w;
  const bv = a.edge.bot[c] >= 0 ? a.edge.bot[c] : a.maxBot;
  return { ax, ay: r.y + bv * r.h - INSET, exact };
}
function segBlocked(ax, ay, bx, by, ignore) {
  const len = Math.hypot(bx - ax, by - ay); if (len < 0.8) return false;
  const n = Math.ceil(len / 0.2);
  for (let i = 1; i < n; i++) {
    const t = i / n, x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
    if (Math.hypot(x - ax, y - ay) < 0.35 || Math.hypot(x - bx, y - by) < 0.35) continue;
    for (const o of S.members) { if (ignore.includes(o)) continue; if (maskHit(rectOf(o), o.asset, x, y, 0)) return true; }
  }
  return false;
}
function makeLink(m, pid, t) {
  let r, a, owner = null;
  if (pid === 'board') { if (!S.board) return null; r = boardRect(); a = S.board.asset; }
  else { owner = S.members.find(o => o.id === pid); if (!owner || owner === m) return null; r = rectOf(owner); a = owner.asset; }
  const at = bottomAt(r, a, t.x), len = t.y - at.ay;
  return { pid, ax: at.ax, ay: at.ay, exact: at.exact, len, blocked: segBlocked(at.ax, at.ay, t.x, t.y, [m, owner]) };
}
/* every figure hangs from the nearest thing above it (or from what the user chose) */
function computeLinks() {
  const L = [], kids = new Map();
  const ms = S.members.slice().sort((a, b) => a.y - b.y);
  for (const m of ms) {
    const t = topAnchor(m); let c = null;
    if (m.parent && m.parent !== 'auto') c = makeLink(m, m.parent, t);
    if (!c) {
      let bs = 1e9;
      for (const pid of ['board'].concat(S.members.filter(o => o !== m).map(o => o.id))) {
        const k = makeLink(m, pid, t); if (!k || k.len < MINCHAIN) continue;
        const sc = k.len + (k.exact ? 0 : 60) + (k.blocked ? 240 : 0) + ((kids.get(pid) || 0) >= S.set.maxKids ? 120 : 0);
        if (sc < bs) { bs = sc; c = k; }
      }
    }
    if (c) { kids.set(c.pid, (kids.get(c.pid) || 0) + 1); L.push(Object.assign({ child: m, bx: t.x, by: t.y }, c)); }
  }
  S.links = L; S.linksDirty = false;
}
function segsCross(p1, p2, p3, p4) {
  const d = (a, b, c) => (c.x - a.x) * (b.y - a.y) - (b.x - a.x) * (c.y - a.y);
  const d1 = d(p3, p4, p1), d2 = d(p3, p4, p2), d3 = d(p1, p2, p3), d4 = d(p1, p2, p4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}
function overlapAmount(A, B) {
  const ra = rectOf(A), rb = rectOf(B);
  const x0 = Math.max(ra.x, rb.x), x1 = Math.min(ra.x + ra.w, rb.x + rb.w), y0 = Math.max(ra.y, rb.y), y1 = Math.min(ra.y + ra.h, rb.y + rb.h);
  if (x1 <= x0 || y1 <= y0) return 0;
  let n = 0;
  for (let y = y0; y < y1; y += 0.15) for (let x = x0; x < x1; x += 0.15) if (maskHit(ra, A.asset, x, y, 0) && maskHit(rb, B.asset, x, y, 0)) n++;
  return n * 0.0225;
}
function computeChecks() {
  if (S.linksDirty) computeLinks();
  const out = [], name = m => m.name || tr('member');
  const ms = S.members;
  if (!S.board) out.push({ lvl: 'err', msg: tr('isNoBoard'), ids: [] });
  for (let i = 0; i < ms.length; i++) for (let j = i + 1; j < ms.length; j++) {
    const o = overlapAmount(ms[i], ms[j]);
    if (o > 0.25) out.push({ lvl: 'err', msg: tr('isOverlap', { a: name(ms[i]), b: name(ms[j]) }), ids: [ms[i].id, ms[j].id] });
  }
  if (S.board) {
    const br = boardRect();
    for (const m of ms) {
      const r = rectOf(m); if (r.y > br.y + br.h || r.x > br.w || r.x + r.w < 0) continue;
      let hit = 0; for (let y = Math.max(r.y, 0); y < Math.min(r.y + r.h, br.h); y += 0.3) for (let x = Math.max(r.x, 0); x < Math.min(r.x + r.w, br.w); x += 0.3) if (maskHit(r, m.asset, x, y, 0) && maskHit(br, S.board.asset, x, y, 0)) hit++;
      if (hit > 3) out.push({ lvl: 'err', msg: tr('isHitsBoard', { a: name(m) }), ids: [m.id] });
    }
  }
  const byChild = new Map(S.links.map(l => [l.child.id, l]));
  const kidCount = new Map();
  for (const m of ms) {
    const l = byChild.get(m.id);
    if (!l) { out.push({ lvl: 'err', msg: tr('isNoAnchor', { a: name(m) }), ids: [m.id] }); continue; }
    kidCount.set(l.pid, (kidCount.get(l.pid) || 0) + 1);
    const pn = l.pid === 'board' ? tr('card') : name(ms.find(o => o.id === l.pid));
    if (l.len < 0) out.push({ lvl: 'err', msg: tr('isAbove', { a: name(m), p: pn }), ids: [m.id] });
    else if (l.blocked) out.push({ lvl: 'err', msg: tr('isBlocked', { a: name(m) }), ids: [m.id] });
    else if (l.len < 1) out.push({ lvl: 'warn', msg: tr('isShort', { a: name(m), len: fmt(l.len) }), ids: [m.id] });
    else if (l.len > 18) out.push({ lvl: 'warn', msg: tr('isLong', { a: name(m), len: fmt(l.len) }), ids: [m.id] });
    if (!l.exact || Math.abs(l.ax - l.bx) > 0.2) out.push({ lvl: 'info', msg: tr('isSlant', { a: name(m) }), ids: [m.id] });
  }
  for (const [pid, n] of kidCount) if (pid !== 'board' && n > S.set.maxKids) { const p = ms.find(o => o.id === pid); out.push({ lvl: 'warn', msg: tr('isMaxKids', { n, a: name(p), max: S.set.maxKids }), ids: [pid] }); }
  for (let i = 0; i < S.links.length; i++) for (let j = i + 1; j < S.links.length; j++) {
    const a = S.links[i], b = S.links[j];
    if (segsCross({ x: a.ax, y: a.ay }, { x: a.bx, y: a.by }, { x: b.ax, y: b.ay }, { x: b.bx, y: b.by })) out.push({ lvl: 'err', msg: tr('isCross', { a: name(a.child), b: name(b.child) }), ids: [a.child.id, b.child.id] });
  }
  const emp = ms.filter(m => m.asset.ph); if (emp.length) out.push({ lvl: 'info', msg: tr('isEmptySlots', { n: emp.length }), ids: emp.map(m => m.id) });
  if (S.set.fit && ms.length && S.set.fitF < 0.5) out.push({ lvl: 'warn', msg: tr('isTight', { h: fmt(S.set.figH * S.set.fitF) }), ids: [] });
  S.issues = out;
}

/* ---------------------------------------------------------------- drawing */
function shadowOn(ctx, k, c) { ctx.shadowColor = c || 'rgba(35,25,15,.34)'; ctx.shadowBlur = 0.42 * k; ctx.shadowOffsetX = 0.1 * k; ctx.shadowOffsetY = 0.2 * k; }
function shadowOff(ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; }
function drawChain(ctx, ax, ay, bx, by) {
  const len = Math.hypot(bx - ax, by - ay); if (len < 0.05) return;
  const n = Math.max(1, Math.round(len / 0.27));
  ctx.fillStyle = '#d4d8de'; ctx.strokeStyle = '#7f8691'; ctx.lineWidth = 0.035;
  for (let i = 0; i <= n; i++) { const t = i / n; ctx.beginPath(); ctx.arc(ax + (bx - ax) * t, ay + (by - ay) * t, 0.1, 0, 6.2832); ctx.fill(); ctx.stroke(); }
}
function drawRing(ctx, x, y) {
  ctx.beginPath(); ctx.arc(x, y, 0.21, 0, 6.2832); ctx.fillStyle = '#f2f4f7'; ctx.fill();
  ctx.lineWidth = 0.07; ctx.strokeStyle = '#8b929c'; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, 0.09, 0, 6.2832); ctx.fillStyle = '#5d636d'; ctx.fill();
}
/* o: {k: device px per cm, ox, oy: device px origin, dpr, names, ghost} */
function drawScene(ctx, o) {
  const k = o.k;
  if (S.linksDirty) computeLinks();
  ctx.setTransform(k, 0, 0, k, o.ox, o.oy);
  if (S.board) {
    const br = boardRect(); shadowOn(ctx, k); ctx.drawImage(S.board.asset.canvas, 0, 0, br.w, br.h); shadowOff(ctx);
  }
  if (o.ghost && S.base) {
    ctx.save(); ctx.globalAlpha = 0.3;
    for (const m of S.members) { const b = S.base.m[m.id]; if (b) ctx.drawImage(m.asset.canvas, b.x, b.y, b.h * m.asset.w / m.asset.h, b.h); }
    ctx.restore();
  }
  for (const l of S.links) drawChain(ctx, l.ax, l.ay, l.bx, l.by);
  for (const m of S.members) { shadowOn(ctx, k); ctx.drawImage(m.asset.canvas, m.x, m.y, mw(m), m.h); }
  shadowOff(ctx);
  for (const l of S.links) { drawRing(ctx, l.ax, l.ay); drawRing(ctx, l.bx, l.by); }
  if (o.names) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const fs = clamp(0.5 * k, 10 * o.dpr, 22 * o.dpr);
    ctx.font = `600 ${fs}px "Figtree", system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const m of S.members) {
      if (!m.name) continue;
      const r = rectOf(m), x = o.ox + (r.x + r.w / 2) * k, y = o.oy + (r.y + r.h) * k + fs * 0.95;
      const w = ctx.measureText(m.name).width + fs * 0.9;
      ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.beginPath(); ctx.roundRect(x - w / 2, y - fs * 0.62, w, fs * 1.24, fs * 0.6); ctx.fill();
      ctx.fillStyle = '#26304a'; ctx.fillText(m.name, x, y + 1);
    }
  }
}
function sceneBounds() {
  const br = boardRect(); let x0 = 0, y0 = 0, x1 = br.w, y1 = S.board ? br.h : 0;
  for (const m of S.members) { const r = rectOf(m); x0 = Math.min(x0, r.x); x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h + 1.2); }
  if (!S.board && !S.members.length) { x1 = 30; y1 = 30; }
  return { x0, y0, x1, y1 };
}
function hangSize() {
  const b = sceneBounds(), br = boardRect();
  let y1 = S.board ? br.h : 0, x0 = 0, x1 = S.board ? br.w : 0;
  for (const m of S.members) { const r = rectOf(m); y1 = Math.max(y1, r.y + r.h); x0 = Math.min(x0, r.x); x1 = Math.max(x1, r.x + r.w); }
  return { w: x1 - x0, h: y1 };
}
