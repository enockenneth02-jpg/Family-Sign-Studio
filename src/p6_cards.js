
/* ------------------------------------------------------------------------
   Members (up to 20, with empty slots), card size, picture upload, drafts
   ------------------------------------------------------------------------ */
const customerLocked = () => S.mode === 'customer' && !!S.meta.lockCount;
const num1 = v => String(Math.round(v * 10) / 10);
const isDefaultName = n => !n || /^Member \d+$/.test(n);
function nextName() { const used = new Set(S.members.map(m => m.name)); for (let k = 1; ; k++) { const n = tr('member') + ' ' + k; if (!used.has(n)) return n; } }
function niceName(f) {
  const b = f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  if (b.length < 2 || /\d{4,}/.test(b) || /^(img|dsc|dcim|image|photo|pxl|screenshot|whatsapp|received|picsart|snap|untitled)/i.test(b)) return null;
  return b.slice(0, 24);
}

/* ---- placeholder figure (an empty member slot) ---- */
let PH = null;
function phAsset() {
  if (PH && assets.has(PH.id)) return PH;
  const c = mkCanvas(300, 520), x = c.getContext('2d'), fill = '#d7deee', ink = '#8d99b9';
  x.fillStyle = fill; x.strokeStyle = ink; x.lineWidth = 6; x.lineJoin = 'round';
  const rr = (a, b, w, h, r) => { x.beginPath(); x.roundRect(a, b, w, h, r); x.fill(); x.stroke(); };
  rr(92, 340, 54, 150, 22); rr(154, 340, 54, 150, 22);
  rr(56, 214, 40, 150, 20); rr(204, 214, 40, 150, 20);
  rr(80, 196, 140, 170, 34);
  x.beginPath(); x.arc(150, 112, 88, 0, 6.2832); x.fill(); x.stroke();
  x.beginPath(); x.arc(150, 282, 36, 0, 6.2832); x.fillStyle = '#fff'; x.fill(); x.stroke();
  x.lineWidth = 9; x.lineCap = 'round'; x.beginPath(); x.moveTo(150, 264); x.lineTo(150, 300); x.moveTo(132, 282); x.lineTo(168, 282); x.stroke();
  PH = buildAsset(addOutline(trim(c, 0), 7), 'placeholder'); PH.ph = true; return PH;
}
function newSlot() { return { id: uid(), name: nextName(), asset: phAsset(), x: 0, y: 0, sz: 1, h: S.set.figH, parent: 'auto', gen: 1 }; }

/* ---- picture -> figure canvas (cutout when it already has / clearly has a plain background, otherwise a photo) ---- */
function photoCard(c) {
  const ratio = 0.75; let cw = c.width, ch = cw / ratio; if (ch > c.height) { ch = c.height; cw = ch * ratio; }
  const sx = (c.width - cw) / 2, sy = Math.max(0, Math.min(c.height - ch, (c.height - ch) * 0.3));
  const H = Math.min(640, Math.round(ch)), W = Math.round(H * ratio), o = mkCanvas(W, H), x = o.getContext('2d');
  x.imageSmoothingQuality = 'high'; x.save(); x.beginPath(); x.roundRect(0, 0, W, H, W * 0.14); x.clip(); x.drawImage(c, sx, sy, cw, ch, 0, 0, W, H); x.restore();
  return addOutline(o, Math.max(2, Math.round(H * 0.02)));
}
function looksCutout(c) {
  const W = c.width, H = c.height, d = c.getContext('2d').getImageData(0, 0, W, H).data, ms = [];
  for (const [u, v] of [[0, 0], [.5, 0], [1, 0], [0, .5], [1, .5], [0, 1], [.5, 1], [1, 1]]) {
    const x0 = clamp(Math.round(u * (W - 1)) - 3, 0, Math.max(0, W - 7)), y0 = clamp(Math.round(v * (H - 1)) - 3, 0, Math.max(0, H - 7));
    let r = 0, g = 0, b = 0, k = 0; const px = [];
    for (let y = y0; y < Math.min(H, y0 + 7); y++) for (let x = x0; x < Math.min(W, x0 + 7); x++) { const i = (y * W + x) * 4; px.push(d[i], d[i + 1], d[i + 2]); r += d[i]; g += d[i + 1]; b += d[i + 2]; k++; }
    r /= k; g /= k; b /= k; let dev = 0; for (let i = 0; i < px.length; i += 3) dev = Math.max(dev, Math.abs(px[i] - r) + Math.abs(px[i + 1] - g) + Math.abs(px[i + 2] - b));
    ms.push([r, g, b, dev]);
  }
  return ms.every(m => m[3] < 60 && Math.hypot(m[0] - ms[0][0], m[1] - ms[0][1], m[2] - ms[0][2]) < 45);
}
function opaqueFraction(c) { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0, t = 0; for (let i = 3; i < d.length; i += 16) { t++; if (d[i] > 40) n++; } return t ? n / t : 0; }
async function memberCanvas(file) {
  const im = await fileToImage(file), c = toCanvas(im, 1600), alpha = hasAlpha(c), mode = $('#imgMode').value;
  if (alpha) return finishCanvas(c, { outline: false, maxH: 640 });
  if (mode !== 'photo' && (mode === 'cut' || looksCutout(c))) {
    const t = mkCanvas(c.width, c.height); t.getContext('2d').drawImage(c, 0, 0); removeBg(t, 30);
    const f = opaqueFraction(t);
    if (mode === 'cut' || (f > 0.06 && f < 0.9)) return finishCanvas(t, { outline: $('#optOutline').checked, maxH: 640 });
  }
  return photoCard(c);
}

/* ---- put pictures into slots (empty slots first, then new members up to the limit) ---- */
function setImage(m, it) {
  const t0 = topAnchor(m);
  m.asset = buildAsset(it.canvas, it.name || m.name);
  if (it.name && isDefaultName(m.name)) m.name = it.name;
  const t1 = topAnchor(m); m.x += t0.x - t1.x; m.y += t0.y - t1.y;
}
function relayout() { if (S.members.length) autoLayout(); else { S.manual = false; commit(); fitView(); } }
function placeItems(items, targetId) {
  if (!items.length) return;
  dropDemo();
  let skipped = 0, added = 0;
  const empties = () => S.members.filter(m => m.asset.ph), canGrow = () => !customerLocked() && S.members.length < MAXM;
  items.forEach((it, i) => {
    let m = (i === 0 && targetId) ? S.members.find(x => x.id === targetId) : null;
    if (!m) m = empties()[0];
    if (m) setImage(m, it);
    else if (canGrow()) { S.members.push(newMember(it.canvas, it.name || nextName(), 1)); added++; }
    else skipped++;
  });
  applyHeights();
  if (added) S.rowSizes = null;
  if (added || !S.manual) autoLayout(); else { S.linksDirty = true; commit(); }
  if (skipped) toast(tr(customerLocked() ? 'countLocked' : 'maxReached', { max: MAXM, n: skipped }), 5000);
}
async function addFigures(files, targetId) {
  await busy(tr('busyFigs'), async () => {
    const items = [];
    for (const f of files) items.push({ canvas: await memberCanvas(f), name: niceName(f) });
    placeItems(items, targetId);
  });
}
async function addSheet(file) {
  await busy(tr('busySheet'), async () => {
    const { c, alpha } = await prepCanvas(file, { maxDim: 3000 });
    const parts = splitSheet(c); if (!parts.length) throw new Error(tr('errSheet'));
    const out = $('#optOutline').checked && !alpha;
    placeItems(parts.map(p => ({ canvas: finishCanvas(p, { outline: out, maxH: 640 }), name: null })));
    toast(tr('sheetSplit', { n: parts.length }), 4200);
  });
}
let pendingPic = null;
function pickMemberImage(id) { pendingPic = id; $('#fMember').click(); }

/* ---- number of members ---- */
function autoGens() {
  const n = S.members.length; if (n < 2 || !S.members.every(m => m.gen === 1)) return;
  let i = 0; defaultSizes(n).forEach((sz, r) => { for (let k = 0; k < sz; k++) if (S.members[i]) S.members[i++].gen = Math.min(6, r + 1); });
}
function setMemberCount(n) {
  if (customerLocked()) { updateLayoutPanel(); return; }
  n = clamp(Math.round(n) || 0, 0, MAXM); const cur = S.members.length;
  if (n === cur) { updateLayoutPanel(); return; }
  if (n > cur) { for (let i = cur; i < n; i++) S.members.push(newSlot()); }
  else {
    let need = cur - n; const ids = [];
    for (let i = S.members.length - 1; i >= 0 && need > 0; i--) if (S.members[i].asset.ph) { ids.push(S.members[i].id); need--; }
    for (let i = S.members.length - 1; i >= 0 && need > 0; i--) if (!ids.includes(S.members[i].id)) { ids.push(S.members[i].id); need--; }
    const withPic = ids.filter(id => !S.members.find(m => m.id === id).asset.ph).length;
    S.members = S.members.filter(m => !ids.includes(m.id));
    for (const m of S.members) if (ids.includes(m.parent)) m.parent = 'auto';
    ids.forEach(id => S.sel.delete(id));
    if (withPic) toast(tr('countRemoved', { n: withPic }), 4500);
  }
  S.rowSizes = null; applyHeights(); autoGens(); relayout();
}

/* ---- card: blank card, actual size, ratio lock ---- */
function makeBlankCard(wCm, hCm, title) {
  const k = 1000 / Math.max(wCm, hCm), W = Math.round(wCm * k), H = Math.round(hCm * k), m = Math.min(W, H);
  const c = mkCanvas(W, H), x = c.getContext('2d');
  const rr = (a, b, w, h, r, f) => { x.beginPath(); x.roundRect(a, b, w, h, r); x.fillStyle = f; x.fill(); };
  rr(0, 0, W, H, m * 0.11, '#fff');
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#f0c45a'); g.addColorStop(0.5, '#b9822a'); g.addColorStop(1, '#e8b947');
  rr(m * 0.025, m * 0.025, W - m * 0.05, H - m * 0.05, m * 0.09, g);
  rr(m * 0.065, m * 0.065, W - m * 0.13, H - m * 0.13, m * 0.06, '#fbf2d9');
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = '#5a3a1a'; x.font = `italic 700 ${m * 0.085}px Georgia, serif`; x.fillText('Welcome to', W / 2, H * 0.27);
  const name = (title || 'Family Name').toUpperCase(); let fs = m * 0.2; x.font = `900 ${fs}px Georgia, serif`;
  const w = x.measureText(name).width; if (w > W * 0.78) { fs *= W * 0.78 / w; x.font = `900 ${fs}px Georgia, serif`; }
  x.lineWidth = fs * 0.06; x.strokeStyle = '#d9a63a'; x.strokeText(name, W / 2, H * 0.5); x.fillStyle = '#1f3a8a'; x.fillText(name, W / 2, H * 0.5);
  rr(W * 0.2, H * 0.63, W * 0.6, H * 0.15, m * 0.03, '#a3262a');
  x.fillStyle = '#fff'; x.font = `italic 700 ${m * 0.085}px Georgia, serif`; x.fillText('Family', W / 2, H * 0.705);
  return c;
}
function rebuildBlank() { const b = S.board; b.asset = buildAsset(makeBlankCard(b.wCm, b.hCm, b.title), 'Card'); b.blank = true; }
function useBlank() {
  const prev = S.board, w = prev ? prev.wCm : 30, h = prev ? boardRect().h : 21;
  S.board = { asset: null, wCm: w, hCm: h, lock: false, sized: !!(prev && prev.sized), blank: true, title: (prev && prev.title) || '' };
  rebuildBlank(); S.base = null; relayout();
}
async function addBoard(file) {
  await busy(tr('busyBoard'), async () => {
    let { c, alpha } = await prepCanvas(file, { maxDim: 2200, tol: 34 });
    if (!alpha) { const parts = splitSheet(c); if (parts.length > 1) c = parts.reduce((a, b) => (b.width * b.height > a.width * a.height ? b : a)); }   // drop stray bits left by the background
    const fc = finishCanvas(c, { outline: $('#optOutline').checked && !alpha, board: true, maxH: 1500, maxW: 1900 });
    const prev = S.board, asset = buildAsset(fc, 'Card'), ratio = asset.w / asset.h, w = prev ? prev.wCm : 30;
    if (prev && prev.sized) {
      const h = boardRect().h; S.board = { asset, wCm: w, hCm: h, lock: false, sized: true, blank: false, title: prev.title || '' };
    } else S.board = { asset, wCm: w, hCm: w / ratio, lock: true, sized: false, blank: false, title: (prev && prev.title) || '' };
    S.base = null; relayout();
  });
}
function setBoardSize(w, h) {
  if (!S.board) useBlank();
  const b = S.board; b.wCm = clamp(w, 5, 150); b.hCm = clamp(h, 5, 150); b.sized = true;
  if (b.blank) rebuildBlank();
  relayout();
}
const boardRatio = () => S.board && !S.board.blank ? S.board.asset.w / S.board.asset.h : 0;
function syncCardFields() {
  const b = S.board, r = boardRect(), blank = !!(b && b.blank);
  const set = (id, v) => { const e = $('#' + id); if (e && document.activeElement !== e) e.value = v; };
  set('boardW', num1(r.w)); set('boardH', num1(r.h)); set('cardTitle', b ? b.title || '' : '');
  const key = num1(r.w) + 'x' + num1(r.h), ps = $('#boardPreset'); ps.value = [...ps.options].some(o => o.value === key) ? key : '';
  $('#lockWrap').hidden = !b || blank; $('#boardLock').checked = !!(b && b.lock); $('#titleWrap').hidden = !blank;
  const hint = $('#cardHint'), ir = boardRatio();
  if (b && !blank && !b.lock && Math.abs(ir - r.w / r.h) / ir > 0.04) { hint.textContent = tr('cardStretch', { a: ir.toFixed(2), b: (r.w / r.h).toFixed(2) }); hint.hidden = false; } else hint.hidden = true;
}
function syncCountFields() {
  const n = S.members.length, lk = customerLocked(), e = $('#memN');
  if (document.activeElement !== e) e.value = n;
  e.disabled = lk; $('#cntMinus').disabled = lk || n <= 0; $('#cntPlus').disabled = lk || n >= MAXM;
  $('#lockCount').checked = !!S.meta.lockCount;
}
function bindCardUI() {
  $('#btnBlank').onclick = useBlank;
  $('#boardW').addEventListener('change', e => { const v = parseFloat(e.target.value); if (!(v >= 5)) { syncCardFields(); return; } if (!S.board) useBlank(); const b = S.board, ir = boardRatio(); setBoardSize(v, b.lock && ir ? v / ir : boardRect().h); });
  $('#boardH').addEventListener('change', e => { const v = parseFloat(e.target.value); if (!(v >= 5)) { syncCardFields(); return; } if (!S.board) useBlank(); const b = S.board, ir = boardRatio(); setBoardSize(b.lock && ir ? v * ir : b.wCm, v); });
  $('#boardPreset').addEventListener('change', e => { if (!e.target.value) return; if (!S.board) useBlank(); const [w, h] = e.target.value.split('x').map(Number); if (S.board.asset && !S.board.blank) S.board.lock = false; setBoardSize(w, h); });
  $('#boardLock').addEventListener('change', e => {
    const b = S.board; if (!b || b.blank) return; b.lock = e.target.checked;
    if (b.lock) { b.hCm = b.wCm / boardRatio(); b.sized = false; relayout(); } else { commit(); }
  });
  $('#cardTitle').addEventListener('change', e => { const b = S.board; if (!b || !b.blank) return; b.title = e.target.value.trim(); rebuildBlank(); commit(); });
  $('#cntMinus').onclick = () => setMemberCount(S.members.length - 1);
  $('#cntPlus').onclick = () => setMemberCount(S.members.length + 1);
  $('#memN').addEventListener('change', e => setMemberCount(parseInt(e.target.value, 10)));
  $('#lockCount').addEventListener('change', e => { S.meta.lockCount = e.target.checked; scheduleSave(); });
  $('#fMember').onchange = e => { const f = e.target.files[0], id = pendingPic; e.target.value = ''; pendingPic = null; if (f && id) addFigures([f], id); };
  /* drag pictures from the desktop onto a member, or anywhere on the stage */
  const hasFiles = e => e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files');
  const clear = () => { $$('.mem.drop').forEach(x => x.classList.remove('drop')); $('#stage').classList.remove('dropping'); };
  for (const ev of ['dragenter', 'dragover']) document.addEventListener(ev, e => {
    if (!hasFiles(e)) return; e.preventDefault(); clear();
    const row = e.target.closest && e.target.closest('.mem'); if (row) row.classList.add('drop'); else if (e.target.closest && e.target.closest('#stage')) $('#stage').classList.add('dropping');
  });
  document.addEventListener('dragleave', e => { if (!e.relatedTarget) clear(); });
  document.addEventListener('drop', e => {
    if (!hasFiles(e)) return; e.preventDefault(); clear();
    const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/')); if (!files.length) return;
    const row = e.target.closest && e.target.closest('.mem'); addFigures(files, row ? row.dataset.id : null);
  });
}

/* ---- autosave: the last project stays on this device (IndexedDB), so a closed tab loses nothing ---- */
const idb = {
  db: null,
  open() { return this.db || (this.db = new Promise((res, rej) => { const r = indexedDB.open('fss', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); })); },
  async run(mode, fn) { const db = await this.open(); return new Promise((res, rej) => { const q = fn(db.transaction('kv', mode).objectStore('kv')); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); },
  get(k) { return this.run('readonly', s => s.get(k)); },
  set(k, v) { return this.run('readwrite', s => s.put(v, k)); },
  del(k) { return this.run('readwrite', s => s.delete(k)); }
};
let saveT = 0;
function scheduleSave() { clearTimeout(saveT); saveT = setTimeout(saveDraft, 1500); }
async function saveDraft() {
  try { if (isDemo() || !(S.members.length || S.board)) return; await idb.set('draft', serialize(S.mode === 'customer' ? 'customer' : 'shop')); } catch (e) { /* storage unavailable or full */ }
}
async function restoreDraft() {
  try { const d = await idb.get('draft'); if (!d) return false; await loadProject(d); return true; } catch (e) { return false; }
}
function dropDraft() { clearTimeout(saveT); try { idb.del('draft').catch(() => {}); } catch (e) { /* ignore */ } }
function newProject() {
  S.members = []; S.sel.clear(); S.base = null; S.demo = false; S.rowSizes = null; S.manual = false; S.ghost = false;
  S.meta = { customer: '', note: '', lockCount: false }; S.board = null; S.set.fitF = 1;
  useBlank(); resetHistory(); fitView(); saveDraft();
}
