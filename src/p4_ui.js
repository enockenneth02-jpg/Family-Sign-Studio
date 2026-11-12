
/* ------------------------------------------------------------------ icons */
const SV = (p, extra) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra || ''}>${p}</svg>`;
const IC = {
  undo: SV('<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>'),
  redo: SV('<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>'),
  open: SV('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
  export: SV('<path d="M12 4v11"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/>'),
  send: SV('<path d="M21 3 10 14"/><path d="M21 3 14 21l-4-7-7-4z"/>'),
  'al-l': SV('<path d="M4 3v18"/><rect x="8" y="6" width="12" height="4" rx="1"/><rect x="8" y="14" width="7" height="4" rx="1"/>'),
  'al-c': SV('<path d="M12 3v18"/><rect x="5" y="6" width="14" height="4" rx="1"/><rect x="8" y="14" width="8" height="4" rx="1"/>'),
  'al-r': SV('<path d="M20 3v18"/><rect x="4" y="6" width="12" height="4" rx="1"/><rect x="9" y="14" width="7" height="4" rx="1"/>'),
  'al-t': SV('<path d="M3 4h18"/><rect x="6" y="8" width="4" height="12" rx="1"/><rect x="14" y="8" width="4" height="7" rx="1"/>'),
  'al-m': SV('<path d="M3 12h18"/><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="8" width="4" height="8" rx="1"/>'),
  'al-b': SV('<path d="M3 20h18"/><rect x="6" y="4" width="4" height="12" rx="1"/><rect x="14" y="9" width="4" height="7" rx="1"/>'),
  'dist-h': SV('<path d="M4 3v18M20 3v18"/><rect x="9.5" y="7" width="5" height="10" rx="1"/>'),
  'dist-v': SV('<path d="M3 4h18M3 20h18"/><rect x="7" y="9.5" width="10" height="5" rx="1"/>'),
  swap: SV('<path d="m7 4-4 4 4 4"/><path d="M3 8h14"/><path d="m17 20 4-4-4-4"/><path d="M21 16H7"/>'),
  center: SV('<path d="M12 2v20" stroke-dasharray="2 2.5"/><rect x="6" y="7" width="12" height="10" rx="2"/>'),
  up: SV('<path d="m6 15 6-6 6 6"/>'), down: SV('<path d="m6 9 6 6 6-6"/>'),
  install: SV('<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><rect x="3" y="17" width="18" height="4" rx="1.5"/>'),
  camera: SV('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
  upload: SV('<path d="M12 16V5"/><path d="m7 9 5-5 5 5"/><path d="M5 20h14"/>'),
  trash: SV('<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="m6 7 1 13h10l1-13"/>')
};
function toast(msg, ms) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, ms || 2800); }
function openModal(title, html, mount) { $('#mTitle').textContent = title; $('#mBody').innerHTML = html; $('#modal').hidden = false; if (mount) mount($('#mBody')); }
function closeModal() { $('#modal').hidden = true; }
function thumb(a) {
  if (a.thumb) return a.thumb;
  const s = 96 / Math.max(a.w, a.h), c = mkCanvas(a.w * s, a.h * s); c.getContext('2d').drawImage(a.canvas, 0, 0, c.width, c.height);
  return (a.thumb = c.toDataURL('image/png'));
}

/* ----------------------------------------------------- UI refresh plumbing */
let chkTimer = 0;
function scheduleChecks() { clearTimeout(chkTimer); chkTimer = setTimeout(() => { computeChecks(); renderChecks(); updateSpecs(); requestRender(); }, 140); }
function changed(ui) {
  S.linksDirty = true; if (ui) refreshUI(); scheduleChecks(); requestRender(); scheduleSave();
}
function refreshUI() {
  renderMembers(); renderInspector(); updateLayoutPanel(); updateTools(); updateTop();
  $('#demoPill').hidden = !isDemo();
  $('#ghostWrap').hidden = !S.base; if (!S.base) { S.ghost = false; $('#chkGhost').checked = false; }
  $('#btnRevert').disabled = !S.base;
}
function updateTop() { $('#btnUndo').disabled = Hist.idx <= 0; $('#btnRedo').disabled = Hist.idx >= Hist.stack.length - 1; }
function syncSel() {
  $$('#memList .mem').forEach(el => el.classList.toggle('sel', S.sel.has(el.dataset.id)));
  renderInspector(); updateTools(); requestRender();
}
function updateTools() {
  const n = S.sel.size, t = $('#tools'); t.hidden = n === 0;
  $$('button', t).forEach(b => {
    const k = b.dataset.al;
    b.disabled = (['l', 'c', 'r', 't', 'm', 'b'].includes(k) && n < 2) || ((k === 'dh' || k === 'dv') && n < 3) || (k === 'swap' && n !== 2);
  });
}
function updatePosFields() {
  const ms = selMembers();
  const px = $('#posInfo');
  if (ms.length === 1) {
    const m = ms[0]; px.textContent = `X ${fmt(m.x)} · Y ${fmt(m.y)} cm`;
    for (const [id, v] of [['inX', m.x], ['inY', m.y]]) { const e = $('#' + id); if (e && document.activeElement !== e) e.value = fmt(v); }
  } else px.textContent = ms.length > 1 ? tr('nSelected', { n: ms.length }) : '';
}

/* ------------------------------------------------------------ members list */
function renderMembers() {
  $('#memCount').textContent = S.members.length;
  const genOpts = [1, 2, 3, 4, 5, 6].map(g => `<option value="${g}">${g}</option>`).join('');
  $('#memList').innerHTML = S.members.map((m, i) => {
    const po = `<option value="auto">${tr('parentAuto')}</option><option value="board">${tr('parentCard')}</option>` + S.members.filter(o => o !== m).map(o => `<option value="${o.id}">${esc(o.name || tr('member'))}</option>`).join('');
    return `<div class="mem${S.sel.has(m.id) ? ' sel' : ''}" data-id="${m.id}">
      <button type="button" class="th" data-a="img" title="${tr('memPic')}" aria-label="${tr('memPic')}"><img alt="" src="${thumb(m.asset)}"><span class="cam">${IC.camera}</span></button>
      <input class="nm" data-f="name" list="nameList" value="${esc(m.name)}" aria-label="${tr('memberNameN', { n: i + 1 })}">
      <div class="mb"><button type="button" data-a="up" title="${tr('memUp')}" aria-label="${tr('memUp')}"${i ? '' : ' disabled'}>${IC.up}</button><button type="button" data-a="down" title="${tr('memDown')}" aria-label="${tr('memDown')}"${i < S.members.length - 1 ? '' : ' disabled'}>${IC.down}</button><button type="button" class="shop-only" data-a="del" title="${tr('memDel')}" aria-label="${tr('memDel')}">${IC.trash}</button></div>
      <div class="mm"><span>${tr('hangsFrom')}</span><select data-f="parent" aria-label="${tr('hangsFromAria')}">${po}</select><span>${tr('genShort')}</span><select class="g" data-f="gen" aria-label="${tr('genAria')}">${genOpts}</select></div>
    </div>`;
  }).join('') || `<p class="hint">${tr('noFigures')}</p>`;
  $$('#memList .mem').forEach(el => {
    const m = S.members.find(x => x.id === el.dataset.id);
    el.querySelector('[data-f=parent]').value = (m.parent === 'auto' || m.parent === 'board' || S.members.some(o => o.id === m.parent)) ? m.parent : 'auto';
    el.querySelector('[data-f=gen]').value = m.gen;
  });
}
function removeMembers(ids) {
  S.members = S.members.filter(m => !ids.includes(m.id));
  for (const m of S.members) if (ids.includes(m.parent)) m.parent = 'auto';
  ids.forEach(id => S.sel.delete(id)); commit();
}
function bindMembers() {
  const L = $('#memList');
  L.addEventListener('click', e => {
    const row = e.target.closest('.mem'); if (!row) return; const id = row.dataset.id, i = S.members.findIndex(m => m.id === id), b = e.target.closest('button[data-a]');
    if (b) {
      const a = b.dataset.a;
      if (a === 'img') pickMemberImage(id);
      else if (a === 'del') removeMembers([id]);
      else { const j = a === 'up' ? i - 1 : i + 1; if (j < 0 || j >= S.members.length) return; [S.members[i], S.members[j]] = [S.members[j], S.members[i]]; if (S.set.lmode !== 'tree') autoLayout(); else commit(); }
      return;
    }
    if (e.target.closest('input,select')) return;
    if (!e.shiftKey) S.sel.clear(); if (S.sel.has(id) && e.shiftKey) S.sel.delete(id); else S.sel.add(id); syncSel();
  });
  L.addEventListener('focusin', e => { const row = e.target.closest('.mem'); if (row && e.target.matches('input') && !S.sel.has(row.dataset.id)) { S.sel = new Set([row.dataset.id]); $$('#memList .mem').forEach(el => el.classList.toggle('sel', S.sel.has(el.dataset.id))); renderInspector(); updateTools(); requestRender(); } });
  L.addEventListener('input', e => { const row = e.target.closest('.mem'); if (!row || !e.target.matches('[data-f=name]')) return; const m = S.members.find(x => x.id === row.dataset.id); m.name = e.target.value; requestRender(); const n = $('#inName'); if (n && S.sel.has(m.id) && document.activeElement !== n) n.value = m.name; });
  L.addEventListener('change', e => {
    const row = e.target.closest('.mem'); if (!row) return; const m = S.members.find(x => x.id === row.dataset.id), f = e.target.dataset.f;
    if (f === 'name') commit();
    else if (f === 'parent') { m.parent = e.target.value; if (S.set.lmode === 'tree' && m.parent !== 'auto') autoLayout(); else commit(); }
    else if (f === 'gen') { m.gen = +e.target.value; if (S.set.lmode === 'gen') autoLayout(); else commit(); }
  });
}

/* --------------------------------------------------------- layout panel UI */
function updateLayoutPanel() {
  const st = S.set, n = S.members.length;
  $('#layBody').dataset.lm = st.lmode;
  $$('#lmode button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lm === st.lmode)));
  for (const k of ['gap', 'chain', 'figH', 'maxKids']) { const e = $('#' + k); if (document.activeElement !== e) e.value = st[k]; }
  $('#fit').checked = st.fit; $('#place').value = st.place; syncCardFields(); syncCountFields();
  $('#chkGuides').checked = st.guides; $('#chkNames').checked = st.names;
  const cur = (S.rowSizes && S.rowSizes.reduce((a, b) => a + b, 0) === n ? S.rowSizes : defaultSizes(n));
  const opts = sizeOptions(n);
  $('#chips').innerHTML = n < 2 ? `<span class="hint">${tr('addFiguresFirst')}</span>` : opts.map(o => `<button type="button" class="chip" data-s="${o.join(',')}" aria-pressed="${o.join('+') === cur.join('+')}">${o.join(' + ')}</button>`).join('');
  $('#chipLbl').textContent = tr('chipLblN', { n });
  const rc = $('#rowCustom'); if (document.activeElement !== rc) rc.value = cur.join(',');
}
function bindLayout() {
  $$('#lmode button').forEach(b => b.addEventListener('click', () => {
    S.set.lmode = b.dataset.lm;
    if (S.set.lmode === 'tree' && !S.members.some(m => m.parent !== 'auto' && m.parent !== 'board')) { commit(); toast(tr('toastTreeHelp'), 4200); }
    else autoLayout();
  }));
  $('#chips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; S.rowSizes = b.dataset.s.split(',').map(Number); S.set.lmode = 'rows'; autoLayout(); });
  $('#rowCustom').addEventListener('change', e => {
    const a = e.target.value.split(/[^0-9]+/).filter(Boolean).map(Number);
    if (!a.length || a.some(v => v < 1 || v > 12)) { toast(tr('toastRowNums')); updateLayoutPanel(); return; }
    if (a.reduce((s, v) => s + v, 0) !== S.members.length) { toast(tr('toastRowSum', { want: S.members.length, got: a.reduce((s, v) => s + v, 0) }), 3500); updateLayoutPanel(); return; }
    S.rowSizes = a; S.set.lmode = 'rows'; autoLayout();
  });
  $('#place').addEventListener('change', e => { S.set.place = e.target.value; autoLayout(); });
  for (const k of ['gap', 'chain', 'figH']) $('#' + k).addEventListener('change', e => { const v = parseFloat(e.target.value); if (!(v > 0)) { updateLayoutPanel(); return; } S.set[k] = v; autoLayout(); });
  $('#fit').addEventListener('change', e => { S.set.fit = e.target.checked; autoLayout(); });
  $('#maxKids').addEventListener('change', e => { S.set.maxKids = Math.max(1, parseInt(e.target.value) || 2); commit(); });
  $('#btnLayout').addEventListener('click', autoLayout);
  $('#btnGuess').addEventListener('click', () => { guessTree(); S.set.lmode = 'tree'; autoLayout(); });
  $('#chkGuides').addEventListener('change', e => { S.set.guides = e.target.checked; });
  $('#chkNames').addEventListener('change', e => { S.set.names = e.target.checked; requestRender(); });
  $('#chkGhost').addEventListener('change', e => { S.ghost = e.target.checked; requestRender(); });
}

/* --------------------------------------------------- inspector / checks */
function renderInspector() {
  const el = $('#inspector'), ms = selMembers();
  if (!ms.length) { el.innerHTML = `<p class="hint">${tr('inspEmpty')}</p>`; return; }
  if (ms.length > 1) { el.innerHTML = `<div class="stat"><b>${tr('nSelected', { n: ms.length })}</b><span>${tr('inspMulti')}</span></div>`; return; }
  const m = ms[0]; if (S.linksDirty) computeLinks();
  const l = S.links.find(k => k.child === m), p = l && l.pid !== 'board' ? S.members.find(o => o.id === l.pid) : null;
  el.innerHTML = `<label class="fld" for="inName">${tr('inspName')}<input id="inName" list="nameList" value="${esc(m.name)}"></label>
    <div class="kv"><label class="fld" for="inH">${tr('inspHeight')}<input id="inH" type="number" step="0.5" min="2" max="40" value="${fmt(m.h)}"></label><span></span>
    <label class="fld" for="inX">X (cm)<input id="inX" type="number" step="0.1" value="${fmt(m.x)}"></label>
    <label class="fld" for="inY">Y (cm)<input id="inY" type="number" step="0.1" value="${fmt(m.y)}"></label></div>
    <p class="hint">${l ? tr('inspHangs', { who: p ? esc(p.name) : tr('card'), len: fmt(l.len) }) : tr('inspNoParent')} ${tr('inspXY')}</p>
    <button type="button" class="btn" data-act="straight">${tr('inspStraight')}</button>
    <button type="button" class="btn" data-act="cardc">${tr('inspCenter')}</button>
    <button type="button" class="btn" data-act="img">${tr('inspPic')}</button>`;
}
function bindInspector() {
  const el = $('#inspector');
  el.addEventListener('input', e => { if (e.target.id === 'inName') { const m = selMembers()[0]; if (m) { m.name = e.target.value; requestRender(); const r = $(`#memList .mem[data-id="${m.id}"] .nm`); if (r) r.value = m.name; } } });
  el.addEventListener('change', e => {
    const m = selMembers()[0]; if (!m) return; const v = parseFloat(e.target.value), id = e.target.id;
    if (id === 'inName') commit();
    else if (id === 'inH' && v > 0) { const base = S.set.figH * S.set.fitF; m.sz = v / base; m.h = v; S.manual = true; commit(); }
    else if (id === 'inX' && !isNaN(v)) { m.x = v; S.manual = true; commit(); }
    else if (id === 'inY' && !isNaN(v)) { m.y = v; S.manual = true; commit(); }
  });
  el.addEventListener('click', e => {
    const b = e.target.closest('button[data-act]'); if (!b) return; const m = selMembers()[0]; if (!m) return;
    if (b.dataset.act === 'straight') hangStraight(m); else if (b.dataset.act === 'cardc') alignSel('cardc'); else if (b.dataset.act === 'img') pickMemberImage(m.id);
  });
}
function renderChecks() {
  const box = $('#checks'), is = S.issues;
  const er = is.filter(i => i.lvl === 'err').length, wr = is.filter(i => i.lvl === 'warn').length;
  $('#chkBadge').innerHTML = er ? `<span class="badge err">${er}</span>` : wr ? `<span class="badge warn">${wr}</span>` : S.members.length ? '<span class="badge ok">OK</span>' : '';
  if (!is.length) { box.innerHTML = S.members.length ? `<div class="okbox">${tr('chkOk')}</div>` : `<p class="hint">${tr('chkEmpty')}</p>`; return; }
  const lbl = { err: tr('lvlErr'), warn: tr('lvlWarn'), info: tr('lvlInfo') };
  box.innerHTML = is.map((i, k) => `<button type="button" class="iss ${i.lvl}" data-k="${k}"><b>${lbl[i.lvl]}</b><span>${esc(i.msg)}</span></button>`).join('');
}
function bindChecks() {
  $('#checks').addEventListener('click', e => { const b = e.target.closest('.iss'); if (!b) return; const i = S.issues[+b.dataset.k]; if (i && i.ids.length) { S.sel = new Set(i.ids); syncSel(); } });
}
function updateSpecs() {
  const br = boardRect(), hs = hangSize(); if (S.linksDirty) computeLinks();
  const lens = S.links.map(l => l.len), avg = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
  $('#specs').innerHTML = `<div class="stats">
    <div class="stat"><b>${S.board ? fmt(br.w) + ' × ' + fmt(br.h) : '-'}</b><span>${tr('specCard')}</span></div>
    <div class="stat"><b>${S.members.length ? fmt(hs.w) + ' × ' + fmt(hs.h) : '-'}</b><span>${tr('specTotal')}</span></div>
    <div class="stat"><b>${S.members.length}</b><span>${tr('specFigs')}</span></div>
    <div class="stat"><b>${lens.length ? fmt(avg) : '-'}</b><span>${tr('specAvg')}</span></div></div>
    <p class="hint">${tr('specHint')}</p>`;
  updatePosFields();
}

/* --------------------------------------------------------------- importing */
function baseName(f) { return f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').slice(0, 24) || tr('member'); }
async function busy(msg, fn) {
  toast(msg, 60000);
  try { await fn(); } catch (e) { console.error(e); toast(tr('errGeneric', { msg: (e && e.message) || e }), 5000); return; }
  if ($('#toast').textContent === msg) $('#toast').hidden = true;
}
function newMember(canvas, name, gen) {
  const a = buildAsset(canvas, name);
  return { id: uid(), name, asset: a, x: 0, y: 0, sz: 1, h: S.set.figH, parent: 'auto', gen: gen || 1 };
}
const isDemo = () => !!((S.board && S.board.asset.demo) || S.members.some(m => m.asset.demo));
function dropDemo() { if (S.members.some(m => m.asset.demo)) { S.members = S.members.filter(m => !m.asset.demo); S.base = null; S.rowSizes = null; S.sel.clear(); } }

/* -------------------------------------------------------------------- demo */
function demoFigure(kind, skin, hair, cloth, hairStyle) {
  const c = mkCanvas(300, 520), x = c.getContext('2d'), dress = kind === 'w' || kind === 'g';
  const rr = (a, b, w, h, r, f) => { x.beginPath(); x.roundRect(a, b, w, h, r); x.fillStyle = f; x.fill(); };
  if (hairStyle === 'long') rr(58, 60, 184, 210, 70, hair);
  if (dress) {
    x.fillStyle = cloth; x.beginPath(); x.moveTo(100, 212); x.lineTo(200, 212); x.lineTo(196, 300); x.lineTo(236, 482); x.lineTo(64, 482); x.lineTo(104, 300); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(120,90,40,.35)'; x.lineWidth = 3; x.beginPath(); x.moveTo(150, 215); x.lineTo(150, 480); x.stroke();
    x.fillStyle = cloth; for (const sx of [86, 214]) { x.beginPath(); x.arc(sx, 238, 30, 0, 6.3); x.fill(); }
    x.fillStyle = skin; for (const sx of [74, 226]) { x.beginPath(); x.arc(sx, 330, 17, 0, 6.3); x.fill(); }
    rr(66, 262, 20, 62, 10, skin); rr(214, 262, 20, 62, 10, skin);
    x.fillStyle = '#e8d3a6'; x.beginPath(); x.ellipse(120, 486, 30, 12, 0, 0, 6.3); x.ellipse(180, 486, 30, 12, 0, 0, 6.3); x.fill();
  } else {
    rr(94, 358, 54, 112, 12, '#1d1d22'); rr(152, 358, 54, 112, 12, '#1d1d22');
    x.fillStyle = '#0d0d10'; x.beginPath(); x.ellipse(120, 478, 36, 14, 0, 0, 6.3); x.ellipse(180, 478, 36, 14, 0, 0, 6.3); x.fill();
    x.fillStyle = cloth; x.beginPath(); x.moveTo(92, 214); x.lineTo(208, 214); x.lineTo(218, 366); x.lineTo(82, 366); x.closePath(); x.fill();
    rr(54, 222, 40, 140, 18, cloth); rr(206, 222, 40, 140, 18, cloth);
    x.strokeStyle = 'rgba(120,90,40,.4)'; x.lineWidth = 3; x.beginPath(); x.moveTo(150, 216); x.lineTo(150, 364); x.stroke();
    for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(150, 240 + i * 28, 3.5, 0, 6.3); x.stroke(); }
    x.fillStyle = skin; for (const sx of [74, 226]) { x.beginPath(); x.arc(sx, 372, 20, 0, 6.3); x.fill(); }
  }
  x.fillStyle = skin; x.beginPath(); x.arc(150, 125, 90, 0, 6.3); x.fill();
  x.fillStyle = hair; x.beginPath();
  if (hairStyle === 'bald') { x.globalAlpha = 0; } else if (hairStyle === 'long') x.ellipse(150, 98, 92, 74, 0, Math.PI, 6.2832); else x.ellipse(150, 94, 91, 60, 0, Math.PI, 6.2832);
  x.fill(); x.globalAlpha = 1;
  x.fillStyle = '#2a1d17'; for (const ex of [118, 182]) { x.beginPath(); x.arc(ex, 132, 7, 0, 6.3); x.fill(); }
  x.strokeStyle = '#2a1d17'; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.arc(150, 150, 28, 0.25, Math.PI - 0.25); x.stroke();
  x.fillStyle = 'rgba(220,100,100,.3)'; for (const ex of [96, 204]) { x.beginPath(); x.arc(ex, 156, 13, 0, 6.3); x.fill(); }
  return trim(c, 0);
}
function demoBoard() {
  const c = mkCanvas(1500, 1050), x = c.getContext('2d');
  const rr = (a, b, w, h, r, f) => { x.beginPath(); x.roundRect(a, b, w, h, r); x.fillStyle = f; x.fill(); };
  rr(10, 10, 1480, 1030, 110, '#fff');
  const g = x.createLinearGradient(0, 0, 1500, 1050); g.addColorStop(0, '#f0c45a'); g.addColorStop(.5, '#b9822a'); g.addColorStop(1, '#e8b947');
  rr(34, 34, 1432, 982, 90, g); rr(76, 76, 1348, 898, 60, '#fbf2d9');
  x.save(); x.beginPath(); x.roundRect(76, 76, 1348, 898, 60); x.clip();
  for (let i = 0; i < 40; i++) { x.fillStyle = i % 2 ? '#b8312f' : '#2a3f8f'; x.fillRect(76 + i * 34, 940, 34, 34); x.fillRect(76 + i * 34, 76, 34, 24); }
  x.restore();
  x.textAlign = 'center'; x.fillStyle = '#5a3a1a'; x.font = 'italic 700 110px Georgia, serif'; x.fillText('Welcome to', 750, 260);
  x.font = '900 200px Georgia, serif'; x.lineWidth = 12; x.strokeStyle = '#d9a63a'; x.strokeText('DELA CRUZ', 750, 500); x.fillStyle = '#1f3a8a'; x.fillText('DELA CRUZ', 750, 500);
  x.fillStyle = '#a3262a'; x.beginPath(); x.moveTo(300, 560); x.lineTo(1200, 560); x.lineTo(1250, 650); x.lineTo(1200, 740); x.lineTo(300, 740); x.lineTo(250, 650); x.closePath(); x.fill();
  x.fillStyle = '#fff'; x.font = 'italic 700 120px Georgia, serif'; x.fillText('Family', 750, 690);
  x.fillStyle = '#1f3a8a'; x.font = '700 50px Georgia, serif'; x.fillText('Joshua 24:15', 750, 810);
  x.fillStyle = '#2a2018'; x.font = 'italic 52px Georgia, serif'; x.fillText('"But as for me and my household,', 750, 870); x.fillText('we will serve the Lord."', 750, 925);
  for (const [fx, fy] of [[150, 150], [1350, 150], [150, 890], [1350, 890]]) { x.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { x.beginPath(); x.ellipse(fx + Math.cos(i * 1.2566) * 34, fy + Math.sin(i * 1.2566) * 34, 34, 22, i * 1.2566, 0, 6.3); x.fill(); } x.fillStyle = '#f0b429'; x.beginPath(); x.arc(fx, fy, 16, 0, 6.3); x.fill(); }
  return c;
}
function loadDemo() {
  const skins = ['#f0c9a4', '#e6b88f', '#d9a87c', '#f3d2b0'];
  const defs = [
    [tr('demoLolo'), 'm', 0, '#4a4a4a', '#efe0bf', 'short', 1, 1], [tr('demoLola'), 'w', 1, '#8a8a8a', '#e9d3ab', 'long', 1, 1],
    [tr('demoTatay'), 'm', 2, '#1c1410', '#f1e2c2', 'short', 2, 1], [tr('demoNanay'), 'w', 0, '#241812', '#ead6b0', 'long', 2, 1],
    [tr('demoTito'), 'm', 3, '#2a1d17', '#efdfbc', 'bald', 2, 1], [tr('demoKuya'), 'm', 1, '#1c1410', '#f1e2c2', 'short', 3, 0.9],
    [tr('demoAte'), 'g', 2, '#2a1d17', '#e7c8c0', 'long', 3, 0.88], [tr('demoBunso'), 'm', 0, '#1c1410', '#efe0bf', 'short', 3, 0.78], [tr('demoBaby'), 'g', 3, '#2a1d17', '#e9d3ab', 'long', 3, 0.72]
  ];
  S.board = { asset: buildAsset(demoBoard(), tr('demoCard')), wCm: 30, hCm: 21, lock: true, sized: false, blank: false, title: '' }; S.board.asset.demo = true;
  S.members = defs.map(d => { const m = newMember(demoFigure(d[1], skins[d[2]], d[3], d[4], d[5]), d[0], d[6]); m.asset.demo = true; m.sz = d[7]; return m; });
  S.rowSizes = null; S.base = null; S.sel.clear(); S.manual = false; S.meta = { customer: '', note: '', lockCount: false };
  Object.assign(S.set, { gap: 0.8, chain: 3, figH: 9, fitF: 1, fit: true, maxKids: 2, lmode: 'rows', place: 'grid' });
  applyHeights(); layoutRows(); resetHistory(); fitView();
}
