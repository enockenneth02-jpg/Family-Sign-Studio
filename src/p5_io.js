
/* ------------------------------------------------------- export / project */
let DL = null;
(async () => { try { if (window.claude && window.claude.use) DL = await window.claude.use('downloads'); } catch (e) { DL = null; } })();
const isStandalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
async function saveBlob(name, blob) {
  if (DL) {
    try { await DL.save({ filename: name, data: blob }); toast(tr('saved', { name })); }
    catch (e) { if (e && e.code === 'declined') return; toast(tr('saveFail', { code: (e && e.code) || 'error' }), 4000); }
    return;
  }
  if (isIOS && isStandalone() && navigator.canShare) {   // installed iOS app: downloads are flaky, use the share sheet
    try { const f = new File([blob], name, { type: blob.type || 'application/octet-stream' }); if (navigator.canShare({ files: [f] })) { await navigator.share({ files: [f] }); return; } }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
  catch (e) { toast(tr('noDownload'), 4000); }
}
const canvasBlob = c => new Promise(res => c.toBlob(res, 'image/png'));
const slug = s => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'layout';
function renderExport(o) {
  o = o || {}; const b = sceneBounds(), pad = 1;
  const w = b.x1 - b.x0 + pad * 2, h = b.y1 - b.y0 + pad * 2, k = Math.min(o.k || 70, (o.maxDim || 2600) / Math.max(w, h));
  const c = mkCanvas(w * k, h * k), x = c.getContext('2d');
  x.fillStyle = '#f5f5f8'; x.fillRect(0, 0, c.width, c.height);
  drawScene(x, { k, ox: (pad - b.x0) * k, oy: (pad - b.y0) * k, dpr: 1, names: o.names !== false, ghost: false });
  return c;
}
function specRows() {
  if (S.linksDirty) computeLinks();
  return S.members.slice().sort((a, b) => (Math.abs(a.y - b.y) > 2 ? a.y - b.y : a.x - b.x)).map((m, i) => {
    const l = S.links.find(k => k.child === m), p = l && l.pid !== 'board' ? S.members.find(o => o.id === l.pid) : null;
    return { n: i + 1, name: m.name || tr('member'), h: m.h, x: m.x, y: m.y, hx: l ? l.bx : m.x, hy: l ? l.by : m.y, parent: l ? (p ? p.name : tr('parentCard')) : '-', len: l ? l.len : 0 };
  });
}
function specText() {
  const br = boardRect(), hs = hangSize(), rows = specRows(), L = [];
  L.push(tr('txtTitle'));
  if (S.meta.customer) L.push('Customer: ' + S.meta.customer);
  L.push(tr('txtSummary', { card: `${fmt(br.w)} x ${fmt(br.h)}`, total: `${fmt(hs.w)} x ${fmt(hs.h)}`, n: rows.length }));
  if (S.meta.note) L.push('Note: ' + S.meta.note);
  L.push(tr('txtRef'), '');
  rows.forEach(r => L.push(tr('txtRow', { n: r.n, name: r.name, h: fmt(r.h), x: fmt(r.x), y: fmt(r.y), hx: fmt(r.hx), hy: fmt(r.hy), parent: r.parent, len: fmt(r.len) })));
  return L.join('\n');
}
function renderSheet() {
  const prev = renderExport({ k: 60, maxDim: 1500 }), rows = specRows(), br = boardRect(), hs = hangSize();
  const W = 2000, pvW = Math.min(1060, prev.width), sc = pvW / prev.width, pvH = prev.height * sc, rowH = 44, tableH = 130 + rows.length * rowH;
  const H = Math.max(pvH, tableH) + 250, c = mkCanvas(W, H), x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#1b2336'; x.textBaseline = 'alphabetic'; x.textAlign = 'left';
  x.font = '700 48px "Bricolage Grotesque", Figtree, system-ui, sans-serif'; x.fillText(tr('shTitle'), 50, 78);
  x.font = '500 28px Figtree, system-ui, sans-serif'; x.fillStyle = '#566079';
  x.fillText((S.meta.customer ? tr('shCustomer') + S.meta.customer + '   ·   ' : '') + tr('shLine', { card: `${fmt(br.w)} × ${fmt(br.h)}`, total: `${fmt(hs.w)} × ${fmt(hs.h)}`, n: rows.length }), 50, 124);
  if (S.meta.note) { x.fillText(tr('shNote') + S.meta.note.slice(0, 120), 50, 164); }
  x.drawImage(prev, 50, 200, pvW, pvH);
  const tx = 1160, ty = 210; x.fillStyle = '#566079'; x.font = '700 22px Figtree, system-ui, sans-serif';
  const cols = [[tx, '#'], [tx + 44, tr('shColName')], [tx + 250, tr('shColH')], [tx + 345, tr('shColHole')], [tx + 530, tr('shColParent')], [tx + 685, tr('shColChain')]];
  cols.forEach(([cx0, t]) => x.fillText(t, cx0, ty)); x.fillRect(tx, ty + 12, 780, 2);
  x.font = '500 24px Figtree, system-ui, sans-serif'; x.fillStyle = '#1b2336';
  rows.forEach((r, i) => {
    const y = ty + 52 + i * rowH; if (i % 2) { x.fillStyle = '#f4f5f9'; x.fillRect(tx - 8, y - 30, 796, rowH); x.fillStyle = '#1b2336'; }
    x.fillText(String(r.n), tx, y); x.fillText(r.name.slice(0, 13), tx + 44, y); x.fillText(fmt(r.h) + ' cm', tx + 250, y);
    x.fillText(`${fmt(r.hx)}, ${fmt(r.hy)}`, tx + 345, y); x.fillText(r.parent.slice(0, 9), tx + 530, y); x.fillText(fmt(r.len) + ' cm', tx + 685, y);
  });
  x.fillStyle = '#566079'; x.font = '500 22px Figtree, system-ui, sans-serif';
  x.fillText(tr('shFoot'), 50, H - 36);
  return c;
}
function serialize(openAs) {
  const used = new Set(S.members.map(m => m.asset.id)); if (S.board && !S.board.blank) used.add(S.board.asset.id);
  const A = {}; used.forEach(id => { const a = assets.get(id); A[id] = { name: a.name, url: a.png || (a.png = a.canvas.toDataURL('image/png')), ph: a.ph ? 1 : 0 }; });
  if (S.mode === 'shop' && openAs === 'customer') S.base = { fitF: S.set.fitF, m: Object.fromEntries(S.members.map(m => [m.id, { x: m.x, y: m.y, h: m.h, sz: m.sz, parent: m.parent }])) };
  return JSON.stringify({
    app: 'family-sign-studio', v: 1, openAs, savedAt: new Date().toISOString(),
    board: S.board ? { a: S.board.blank ? null : S.board.asset.id, wCm: S.board.wCm, hCm: boardRect().h, lock: S.board.lock, sized: S.board.sized, blank: !!S.board.blank, title: S.board.title || '' } : null, assets: A,
    members: S.members.map(m => ({ id: m.id, name: m.name, a: m.asset.id, x: m.x, y: m.y, sz: m.sz, parent: m.parent, gen: m.gen })),
    set: S.set, rowSizes: S.rowSizes, base: S.base, meta: S.meta
  });
}
async function loadProject(text) {
  const o = JSON.parse(text); if (o.app !== 'family-sign-studio') throw new Error(tr('errProject'));
  const map = new Map();
  for (const [id, a] of Object.entries(o.assets)) {
    const im = await loadImage(a.url), c = mkCanvas(im.naturalWidth, im.naturalHeight); c.getContext('2d').drawImage(im, 0, 0);
    const asset = buildAsset(c, a.name, id); if (a.ph) { asset.ph = true; PH = asset; }
    map.set(id, asset);
  }
  const bo = o.board; S.board = null;
  if (bo) {
    const asset = bo.blank ? null : map.get(bo.a);
    if (bo.blank || asset) {
      S.board = { asset, wCm: bo.wCm, hCm: bo.hCm || (asset ? bo.wCm * asset.h / asset.w : bo.wCm * 0.7), lock: bo.lock === undefined ? !bo.blank : bo.lock, sized: !!bo.sized, blank: !!bo.blank, title: bo.title || '' };
      if (bo.blank) rebuildBlank();
    }
  }
  Object.assign(S.set, o.set || {}); S.rowSizes = o.rowSizes || null;
  S.members = o.members.map(m => ({ id: m.id, name: m.name, asset: map.get(m.a), x: m.x, y: m.y, sz: m.sz, h: 0, parent: m.parent, gen: m.gen })).filter(m => m.asset);
  applyHeights(); S.base = o.base || null; S.meta = Object.assign({ customer: '', note: '', lockCount: false }, o.meta || {}); S.demo = false; S.manual = true; S.sel.clear(); S.ghost = false;
  setMode(o.openAs === 'customer' ? 'customer' : 'shop');
  resetHistory(); fitView();
  if (S.mode === 'shop' && S.meta.customer) toast(tr('opened', { who: S.meta.customer }) + (S.base ? tr('openedGhost') : ''), 5000);
}
function revertBase() {
  if (!S.base) return;
  S.set.fitF = S.base.fitF || 1;
  for (const m of S.members) { const b = S.base.m[m.id]; if (b) { m.x = b.x; m.y = b.y; m.sz = b.sz; m.parent = b.parent || 'auto'; } }
  applyHeights(); commit(); toast(tr('reverted'));
}
function setMode(m) {
  S.mode = m; $('#app').dataset.mode = m;
  $('#modeShop').setAttribute('aria-pressed', String(m === 'shop')); $('#modeCust').setAttribute('aria-pressed', String(m === 'customer'));
  refreshUI(); requestAnimationFrame(() => { resizeStage(); });
}
const dlRow = (key, title, sub, btn) => `<div class="dlrow"><div><b>${title}</b><small>${sub}</small></div><button type="button" class="btn" data-dl="${key}">${btn || tr('download')}</button></div>`;
function doDl(key) {
  const nm = slug(S.meta.customer);
  if (key === 'preview') return canvasBlob(renderExport({ k: 70 })).then(b => saveBlob(`sign-preview-${nm}.png`, b));
  if (key === 'sheet') return canvasBlob(renderSheet()).then(b => saveBlob(`sign-specs-${nm}.png`, b));
  if (key === 'projCust') return saveBlob(`sign-for-customer-${nm}.json`, new Blob([serialize('customer')], { type: 'application/json' }));
  if (key === 'projShop') return saveBlob(`sign-project-${nm}.json`, new Blob([serialize('shop')], { type: 'application/json' }));
  if (key === 'projSend') return saveBlob(`sign-from-customer-${nm}.json`, new Blob([serialize('shop')], { type: 'application/json' }));
  if (key === 'copy') {
    const t = specText(); const ta = $('#specTa'); if (ta) { ta.value = t; ta.hidden = false; ta.select(); }
    try { return navigator.clipboard.writeText(t).then(() => toast(tr('copied')), () => toast(tr('copyManual'))); } catch (e) { toast(tr('copyManual')); }
  }
}
function bindModal(root) {
  root.addEventListener('click', e => { const b = e.target.closest('[data-dl]'); if (b) doDl(b.dataset.dl); });
  const n = $('#mCust', root), t = $('#mNote', root);
  if (n) n.addEventListener('input', () => { S.meta.customer = n.value; });
  if (t) t.addEventListener('input', () => { S.meta.note = t.value; });
}
function exportModal() {
  computeChecks(); const bad = S.issues.filter(i => i.lvl === 'err').length;
  openModal(tr('exportTitle'), `
    ${bad ? `<div class="iss err" style="cursor:default"><b>${tr('lvlErr')}</b><span>${tr('exportBad', { n: bad })}</span></div>` : ''}
    <label class="fld" for="mCust">${tr('custName')}<input id="mCust" class="txt" value="${esc(S.meta.customer)}" placeholder="${tr('custNamePh')}"></label>
    <label class="fld" for="mNote">${tr('noteProd')}<input id="mNote" class="txt" value="${esc(S.meta.note)}" placeholder="${tr('noteProdPh')}"></label>
    ${dlRow('preview', tr('dlPreview'), tr('dlPreviewSub'))}
    ${dlRow('sheet', tr('dlSheet'), tr('dlSheetSub'))}
    ${dlRow('projCust', tr('dlProjCust'), tr('dlProjCustSub'))}
    ${dlRow('projShop', tr('dlProjShop'), tr('dlProjShopSub'))}
    ${dlRow('copy', tr('dlCopy'), tr('dlCopySub'), tr('copyBtn'))}
    <textarea class="txt" id="specTa" hidden readonly aria-label="${tr('specsAria')}"></textarea>
    <p class="hint">${tr('exportHint')}</p>`, bindModal);
}
function sendModal() {
  computeChecks(); const bad = S.issues.filter(i => i.lvl === 'err').length;
  const pv = renderExport({ k: 28, maxDim: 900 }).toDataURL('image/png');
  openModal(tr('sendTitle'), `
    ${bad ? `<div class="iss warn" style="cursor:default"><b>${tr('lvlWarn')}</b><span>${tr('sendBad', { n: bad })}</span></div>` : ''}
    <img class="pv" src="${pv}" alt="${tr('sendPvAlt')}">
    <label class="fld" for="mCust">${tr('yourName')}<input id="mCust" class="txt" value="${esc(S.meta.customer)}" placeholder="${tr('yourNamePh')}"></label>
    <label class="fld" for="mNote">${tr('noteShop')}<input id="mNote" class="txt" value="${esc(S.meta.note)}" placeholder="${tr('noteShopPh')}"></label>
    ${dlRow('projSend', tr('dlProjSend'), tr('dlProjSendSub'))}
    ${dlRow('preview', tr('dlPreviewMine'), tr('dlPreviewMineSub'))}
    ${dlRow('copy', tr('dlSummary'), tr('dlSummarySub'), tr('copyBtn'))}
    <textarea class="txt" id="specTa" hidden readonly aria-label="${tr('summaryAria')}"></textarea>
    <p class="hint">${tr('sendHint')}</p>`, bindModal);
}
function confirmModal(msg, yes) {
  openModal(tr('sure'), `<p style="margin:0">${msg}</p><div class="row"><button type="button" class="btn" id="cNo">${tr('no')}</button><button type="button" class="btn primary" id="cYes">${tr('yesGo')}</button></div>`, root => {
    $('#cNo', root).onclick = closeModal; $('#cYes', root).onclick = () => { closeModal(); yes(); };
  });
}
function refreshAfterLang(old) {
  if (isDemo()) S.members.forEach(m => { const i = DEMO_KEYS.findIndex(k => D[k][old === 'en' ? 1 : 0] === m.name); if (i >= 0) m.name = tr(DEMO_KEYS[i]); });
  closeModal(); refreshUI(); computeChecks(); renderChecks(); updateSpecs(); requestRender();
}

/* installable app + offline cache */
let installEvt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; const b = document.getElementById('btnInstall'); if (b) b.hidden = false; });
window.addEventListener('appinstalled', () => { installEvt = null; const b = document.getElementById('btnInstall'); if (b) b.hidden = true; });
function installApp() {
  if (!installEvt) return; const e = installEvt; installEvt = null; $('#btnInstall').hidden = true;
  e.prompt(); if (e.userChoice) e.userChoice.catch(() => {});
}
function registerSW() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  const had = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => { toast(tr(had ? 'updated' : 'offlineReady'), had ? 9000 : 3500); });
  navigator.serviceWorker.register('./sw.js').catch(() => { /* offline mode is optional */ });
}

/* -------------------------------------------------------------------- init */
function init() {
  $$('[data-ic]').forEach(el => { el.innerHTML = IC[el.dataset.ic] || ''; });
  LANG = detectLang(); applyStaticLang();
  $$('#langSeg button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
  $('#btnInstall').onclick = installApp;
  cv = $('#cv'); cx = cv.getContext('2d');
  const cs = getComputedStyle(document.documentElement); COL.stage = cs.getPropertyValue('--stage').trim() || COL.stage; COL.acc = cs.getPropertyValue('--acc').trim() || COL.acc;
  resizeStage(); initPointer(); bindMembers(); bindLayout(); bindInspector(); bindChecks();
  new ResizeObserver(() => { resizeStage(); if (!S.view.moved) fitView(); }).observe(cv.parentElement);
  $('#modeShop').onclick = () => setMode('shop'); $('#modeCust').onclick = () => setMode('customer');
  $('#btnUndo').onclick = undo; $('#btnRedo').onclick = redo;
  $('#btnOpen').onclick = () => $('#fProject').click();
  $('#btnExport').onclick = exportModal; $('#btnSend').onclick = sendModal; $('#btnRevert').onclick = revertBase;
  $('#mClose').onclick = closeModal; $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });
  $('#btnBoard').onclick = () => $('#fBoard').click(); $('#btnFigs').onclick = () => $('#fFigs').click(); $('#btnSheet').onclick = () => $('#fSheet').click();
  $('#fBoard').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) addBoard(f); };
  $('#fFigs').onchange = e => { const fs = [...e.target.files]; e.target.value = ''; if (fs.length) addFigures(fs); };
  $('#fSheet').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) addSheet(f); };
  $('#fProject').onchange = async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; await busy(tr('busyProject'), async () => loadProject(await f.text())); };
  $('#btnDemo').onclick = () => confirmModal(tr('confirmDemo'), () => { loadDemo(); dropDraft(); });
  $('#btnNew').onclick = () => confirmModal(tr('confirmNew'), newProject);
  $('#zIn').onclick = () => zoomAt(VW / 2, VH / 2, 1.25); $('#zOut').onclick = () => zoomAt(VW / 2, VH / 2, 0.8); $('#zFit').onclick = fitView;
  $('#tools').addEventListener('click', e => { const b = e.target.closest('button[data-al]'); if (b && !b.disabled) alignSel(b.dataset.al); });
  bindCardUI(); registerSW();
  restoreDraft().then(ok => { if (ok) toast(tr('draftRestored'), 3500); else loadDemo(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => requestRender());
  window.__app = { tr, setLang, setMemberCount, setBoardSize, useBlank, placeItems, phAsset, newProject, addFigures, customerLocked, saveDraft, restoreDraft, boardRect, MAXM, D, sizeOptions, S, computeChecks, layoutRows, layoutTree, autoLayout, assets, splitSheet, removeBg, trim, buildAsset, loadProject, serialize, renderSheet, renderExport, setMode, addSheet, addBoard, addFigures };
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
