
/* -------------------------------------------------------------------- i18n
   Every user-facing string lives here as key: [Taglish, English].
   HTML uses data-i18n / data-i18n-html / data-i18n-title / data-i18n-aria / data-i18n-ph.
   JS uses tr('key', { var: value }). Placeholders look like {name}. */
const LANG_KEY = 'fss-lang';
let LANG = 'tl';
const D = {
  /* header */
  appTitle: ['Family Sign Studio', 'Family Sign Studio'],
  brandSub: ['Layout ng hanging family sign', 'Hanging family sign layout'],
  modeLbl: ['Mode', 'Mode'],
  langLbl: ['Wika', 'Language'],
  btnOpen: ['Buksan ang project', 'Open project'],
  btnExport: ['I-export', 'Export'],
  btnSend: ['Ipadala sa Shop', 'Send to shop'],
  btnInstall: ['I-install ang app', 'Install app'],

  /* left panel */
  custNote: ['I-drag ang mga figure para ilipat. Gamitin ang Auto-ayos sa ibaba kung gusto mong ibang pagkakahanay. Kapag okay na, pindutin ang <b>Ipadala sa Shop</b>.',
             'Drag the figures to move them. Use Auto-arrange below if you want a different alignment. When you\'re happy with it, press <b>Send to shop</b>.'],
  btnRevert: ['Ibalik sa ayos ng shop', 'Reset to the shop\'s layout'],
  secSetup: ['Card at mga figure', 'Card and figures'],
  btnBoard: ['Pumili ng card image', 'Choose card image'],
  boardW: ['Lapad ng card (cm)', 'Card width (cm)'],
  btnFigs: ['Idagdag ang mga figure', 'Add figures'],
  btnSheet: ['Sheet ng maraming figure', 'Multi-figure sheet'],
  optOutline: ['Lagyan ng puting outline kung inalis ang background', 'Add a white outline when the background is removed'],
  hintUpload: ['Pinakamaganda ang PNG na transparent ang background. Kung puti o solid ang background, kusa itong aalisin. Ang "Sheet" ay isang image na maraming figure. Kusa silang hihiwalayin ayon sa pagkakasunod (taas pababa, kaliwa pakanan).',
               'Transparent-background PNGs work best. If the background is white or solid, it is removed automatically. A "Sheet" is one image with many figures; they are split automatically in order (top to bottom, left to right).'],
  btnDemo: ['Demo', 'Demo'],
  btnNew: ['Bagong project', 'New project'],
  secMembers: ['Mga member', 'Members'],
  hintMembers: ['Ang pagkakasunod sa listahan ang magtatakda kung sino ang mauuna sa kaliwa at sa itaas kapag nag-auto-ayos. Pindutin ang larawan ng member para mag-upload.',
                'The order of this list decides who goes first (left, then top) when auto-arranging. Click a member\'s picture to upload one.'],
  secLayout: ['Auto-ayos', 'Auto-arrange'],
  lmodeLbl: ['Uri ng ayos', 'Layout type'],
  lmRows: ['Mga row', 'Rows'],
  lmGen: ['Henerasyon', 'Generations'],
  lmTree: ['Family tree', 'Family tree'],
  chipLbl: ['Ilang figure sa bawat row', 'Figures per row'],
  chipLblN: ['Ilang figure sa bawat row ({n} lahat)', 'Figures per row ({n} total)'],
  rowCustom: ['Sariling bilang (hal. 5,4)', 'Custom counts (e.g. 5,4)'],
  noteGen: ['Itakda ang <b>Hen.</b> ng bawat member sa listahan (1 = pinakataas, hal. lolo at lola). Isang row ang bawat henerasyon.',
            'Set each member\'s <b>Gen.</b> in the list (1 = top, e.g. grandparents). Each generation becomes one row.'],
  noteTree: ['Piliin sa bawat member ang <b>Sabit kay</b>. Ang mga anak ay ilalagay sa ilalim ng magulang nila. Ang walang pinili ay nakasabit sa card.',
             'For each member, choose <b>Hangs from</b>. Children are placed under their parent. Members with nothing chosen hang from the card.'],
  btnGuess: ['Hulaan mula sa henerasyon', 'Guess from generations'],
  placeLbl: ['Kapag kulang ang bilang sa isang row', 'When a row has fewer figures'],
  placeGrid: ['Sa column, simetriko (may butas sa gitna)', 'Keep columns, symmetric (gap in the middle)'],
  placeBrick: ['Sa gitna, nasa pagitan ng nasa itaas', 'Centered, between the figures above'],
  placeLeft: ['Sa kaliwa', 'Align left'],
  placeRight: ['Sa kanan', 'Align right'],
  gapLbl: ['Pagitan (cm)', 'Gap (cm)'],
  chainLbl: ['Chain (cm)', 'Chain (cm)'],
  figHLbl: ['Taas ng figure', 'Figure height'],
  fitLbl: ['Paliitin kung lalampas sa lapad ng card', 'Shrink if wider than the card'],
  maxKidsLbl: ['Max na chain sa baba ng isang figure', 'Max chains under one figure'],
  btnLayout: ['Ayusin ulit', 'Re-arrange'],
  hintLayout: ['Binabalik ng "Ayusin ulit" ang lahat sa awtomatikong pwesto. Gumagana ang Undo.',
               '"Re-arrange" puts everything back in its automatic position. Undo works.'],

  /* stage */
  stageLbl: ['Preview ng sign', 'Sign preview'],
  canvasLbl: ['Preview ng hanging sign. I-drag ang mga figure para ilipat.', 'Hanging sign preview. Drag the figures to move them.'],
  emptyStage: ['Pumili ng card (o blank card) sa kaliwa at itakda ang bilang ng member, o pindutin ang Demo.', 'Choose a card (or a blank card) on the left and set the number of members, or press Demo.'],
  emptyMembers: ['Itakda ang bilang ng member sa kaliwa para makita ang ayos.', 'Set the number of members on the left to see the arrangement.'],
  alL: ['I-align sa kaliwa', 'Align left'],
  alC: ['I-align sa gitna (pahalang)', 'Align center (horizontal)'],
  alR: ['I-align sa kanan', 'Align right'],
  alT: ['I-align sa itaas', 'Align top'],
  alM: ['I-align sa gitna (patayo)', 'Align middle (vertical)'],
  alB: ['I-align sa baba', 'Align bottom'],
  alDh: ['Pantay na pagitan (pahalang)', 'Distribute horizontally'],
  alDv: ['Pantay na pagitan (patayo)', 'Distribute vertically'],
  alSwap: ['Magpalit ng pwesto (piliin ang 2)', 'Swap positions (select 2)'],
  alCard: ['Ilagay sa gitna ng card', 'Center on card'],
  chkGuides: ['Guides', 'Guides'],
  chkNames: ['Pangalan', 'Names'],
  chkGhost: ['Ipakita ang orihinal na ayos', 'Show the original layout'],
  nSelected: ['{n} napili', '{n} selected'],

  /* right panel */
  secSelected: ['Napili', 'Selected'],
  secChecks: ['Production check', 'Production check'],
  secSizes: ['Sukat', 'Measurements'],
  close: ['Isara', 'Close'],

  /* members list */
  memberNameN: ['Pangalan ng member {n}', 'Member {n} name'],
  memUp: ['Itaas sa listahan', 'Move up in the list'],
  memDown: ['Ibaba sa listahan', 'Move down in the list'],
  memDel: ['Alisin', 'Remove'],
  hangsFrom: ['Sabit kay', 'Hangs from'],
  hangsFromAria: ['Nakasabit kay', 'Hangs from'],
  genShort: ['Hen.', 'Gen.'],
  genAria: ['Henerasyon', 'Generation'],
  parentAuto: ['Auto', 'Auto'],
  parentCard: ['Card', 'Card'],
  member: ['Member', 'Member'],
  noFigures: ['Wala pang figure. Magdagdag sa itaas o pindutin ang Demo.', 'No figures yet. Add some above or press Demo.'],

  /* layout panel */
  addFiguresFirst: ['Magdagdag muna ng figures.', 'Add figures first.'],
  toastTreeHelp: ['Piliin ang "Sabit kay" ng bawat member, o pindutin ang Hulaan mula sa henerasyon.', 'Choose "Hangs from" for each member, or press Guess from generations.'],
  toastRowNums: ['Maglagay ng mga numero, hal. 5,4', 'Enter numbers, e.g. 5,4'],
  toastRowSum: ['Dapat {want} ang kabuuan. Ngayon ay {got}.', 'The total must be {want}. Right now it is {got}.'],

  /* inspector */
  inspEmpty: ['Pumili ng figure sa stage o sa listahan para i-edit ang pwesto at laki. Shift+click o Shift+drag para pumili ng marami. Arrow keys para sa maliliit na galaw (Shift = 1 cm). Space+drag o drag sa walang laman para ilipat ang view.',
              'Select a figure on the stage or in the list to edit its position and size. Shift+click or Shift+drag to select several. Arrow keys nudge it a little (Shift = 1 cm). Space+drag, or drag on empty space, to move the view.'],
  inspMulti: ['Gamitin ang toolbar sa taas ng stage para mag-align, magpantay ng pagitan, o magpalit ng pwesto.', 'Use the toolbar above the stage to align, even out the spacing, or swap positions.'],
  inspName: ['Pangalan', 'Name'],
  inspHeight: ['Taas (cm)', 'Height (cm)'],
  inspHangs: ['Nakasabit kay <b>{who}</b>. Haba ng chain: <b>{len} cm</b>.', 'Hangs from <b>{who}</b>. Chain length: <b>{len} cm</b>.'],
  inspNoParent: ['Walang mapagsabitan.', 'Nothing to hang from.'],
  inspXY: ['Ang X at Y ay mula sa kaliwa-itaas na sulok ng card.', 'X and Y are measured from the top-left corner of the card.'],
  inspStraight: ['Itapat sa ibabaw (tuwid na chain)', 'Line up with the one above (straight chain)'],
  inspCenter: ['Ilagay sa gitna ng card', 'Center on card'],
  card: ['card', 'the card'],

  /* checks */
  lvlErr: ['Ayusin', 'Fix'],
  lvlWarn: ['Tingnan', 'Check'],
  lvlInfo: ['Tip', 'Tip'],
  chkOk: ['Walang nakitang problema. Walang magkapatong, tuwid ang mga chain, at walang tumatama sa card.', 'No problems found. Nothing overlaps, the chains are straight, and nothing touches the card.'],
  chkEmpty: ['Lalabas dito ang mga problema sa pagkakaayos.', 'Problems with the arrangement will show up here.'],
  isNoBoard: ['Wala pang card. Mag-upload ng card o gamitin ang demo.', 'No card yet. Upload a card or use the demo.'],
  isOverlap: ['Magkapatong sina {a} at {b}.', '{a} and {b} overlap.'],
  isHitsBoard: ['Tumatama sa card si {a}.', '{a} touches the card.'],
  isNoAnchor: ['Walang mapagsabitan si {a}. Ilipat sa ilalim ng card o ng ibang figure.', '{a} has nothing to hang from. Move it under the card or another figure.'],
  isAbove: ['Nasa itaas ng nakasabitan si {a} ({p}).', '{a} is above the figure it hangs from ({p}).'],
  isBlocked: ['Dumadaan ang chain ni {a} sa ibang figure.', '{a}\'s chain passes through another figure.'],
  isShort: ['Masyadong maikli ang chain ni {a} ({len} cm).', '{a}\'s chain is too short ({len} cm).'],
  isLong: ['Napakahaba ng chain ni {a} ({len} cm).', '{a}\'s chain is very long ({len} cm).'],
  isSlant: ['Naka-anggulo ang chain ni {a}. Gamitin ang "Itapat sa ibabaw" para tumuwid.', '{a}\'s chain is slanted. Use "Line up with the one above" to straighten it.'],
  isMaxKids: ['{n} chain ang nakasabit kay {a}. Max ay {max}.', '{n} chains hang from {a}. The max is {max}.'],
  isCross: ['Nagkukrus ang chain ni {a} at {b}.', '{a}\'s and {b}\'s chains cross.'],

  /* specs panel */
  specCard: ['Card (cm)', 'Card (cm)'],
  specTotal: ['Buong sukat (cm)', 'Overall size (cm)'],
  specFigs: ['Mga figure', 'Figures'],
  specAvg: ['Avg. chain (cm)', 'Avg. chain (cm)'],
  specHint: ['Ang buong sukat ay mula sa tuktok ng card hanggang sa pinakababang figure.', 'The overall size runs from the top of the card to the lowest figure.'],

  /* importing + project */
  busyBoard: ['Pinoproseso ang card…', 'Processing the card…'],
  busyFigs: ['Pinoproseso ang mga figure…', 'Processing the figures…'],
  busySheet: ['Hinihiwalay ang mga figure sa sheet…', 'Splitting the figures from the sheet…'],
  busyProject: ['Binubuksan ang project…', 'Opening the project…'],
  errGeneric: ['May problema: {msg}', 'Something went wrong: {msg}'],
  errImage: ['Hindi mabasa ang image', 'Could not read the image'],
  errSheet: ['Walang nakitang figure sa sheet. Subukan ang transparent na PNG.', 'No figures found in the sheet. Try a transparent PNG.'],
  errProject: ['Hindi ito project file ng app na ito.', 'This is not a project file from this app.'],
  sheetSplit: ['{n} figure ang nahiwalay. Palitan ang mga pangalan sa listahan.', '{n} figures were found. Rename them in the list.'],
  opened: ['Nabuksan: {who}', 'Opened: {who}'],
  openedGhost: ['. I-on ang "Ipakita ang orihinal na ayos" para makita ang binago.', '. Turn on "Show the original layout" to see what changed.'],
  reverted: ['Naibalik sa ayos ng shop.', 'Reset to the shop\'s layout.'],
  updated: ['May bagong version ng app. I-refresh ang page para ma-update.', 'A new version of the app is ready. Refresh the page to update.'],
  offlineReady: ['Handa na ang app para gamitin kahit walang internet.', 'The app is ready to use offline.'],

  /* export / send */
  saved: ['Na-save: {name}', 'Saved: {name}'],
  saveFail: ['Hindi na-save ang file ({code}).', 'Could not save the file ({code}).'],
  noDownload: ['Hindi makapag-download dito. Kopyahin na lang ang specs.', 'Downloads are not available here. Copy the specs instead.'],
  download: ['I-download', 'Download'],
  copyBtn: ['Kopyahin', 'Copy'],
  copied: ['Nakopya ang specs.', 'Specs copied.'],
  copyManual: ['Piliin at kopyahin ang text sa ibaba.', 'Select and copy the text below.'],
  exportTitle: ['I-export', 'Export'],
  exportBad: ['May {n} problema pa sa Production check. Mas mabuting ayusin bago ipadala.', 'There are still {n} problems in the Production check. Better to fix them before sending.'],
  custName: ['Pangalan ng customer', 'Customer name'],
  custNamePh: ['hal. Larios Family', 'e.g. Larios Family'],
  noteProd: ['Note para sa production', 'Note for production'],
  noteProdPh: ['hal. Matte finish, may glitter', 'e.g. Matte finish, with glitter'],
  dlPreview: ['Preview (PNG)', 'Preview (PNG)'],
  dlPreviewSub: ['Larawan ng buong sign na ipapakita sa customer.', 'An image of the whole sign to show the customer.'],
  dlSheet: ['Spec sheet (PNG)', 'Spec sheet (PNG)'],
  dlSheetSub: ['Preview kasama ang sukat, butas at haba ng chain ng bawat figure.', 'The preview plus each figure\'s size, hole position and chain length.'],
  dlProjCust: ['Project para sa customer', 'Project for the customer'],
  dlProjCustSub: ['Ipadala sa customer. Pagbukas sa app, simple na editor ang lalabas at makikita nila ang ayos ng shop.', 'Send this to the customer. When they open it in the app, a simple editor appears with the shop\'s layout.'],
  dlProjShop: ['Project file (shop)', 'Project file (shop)'],
  dlProjShopSub: ['Para mabuksan mo ulit ang buong editor mamaya.', 'So you can reopen the full editor later.'],
  dlCopy: ['Specs bilang text', 'Specs as text'],
  dlCopySub: ['Kopyahin para i-paste sa chat o ClickUp.', 'Copy it to paste into a chat or ClickUp.'],
  specsAria: ['Specs na text', 'Specs as text'],
  exportHint: ['Kapag hindi nag-download, pindutin ang Preview at i-save mula sa lalabas na kahon.', 'If the download does not start, press Preview and save it from the box that appears.'],
  sendTitle: ['Ipadala sa Shop', 'Send to shop'],
  sendBad: ['May {n} bagay na maaaring hindi magawa. Tingnan ang Production check sa kanan.', '{n} things may not be possible to make. Check the Production check on the right.'],
  sendPvAlt: ['Preview ng ayos ng sign', 'Preview of the sign layout'],
  yourName: ['Pangalan mo', 'Your name'],
  yourNamePh: ['hal. Juan Larios', 'e.g. Juan Larios'],
  noteShop: ['Note para sa shop (opsyonal)', 'Note for the shop (optional)'],
  noteShopPh: ['hal. Gusto ko si Lolo sa gitna', 'e.g. I want Grandpa in the middle'],
  dlProjSend: ['Project file ng ayos mo', 'Your layout project file'],
  dlProjSendSub: ['Ito ang ipapadala sa shop. Dito nakasave ang eksaktong pwesto ng bawat figure.', 'This is what you send to the shop. It stores the exact position of every figure.'],
  dlPreviewMine: ['Preview (PNG)', 'Preview (PNG)'],
  dlPreviewMineSub: ['Larawan ng ayos mo, para madaling makita ng shop.', 'A picture of your layout so the shop can see it easily.'],
  dlSummary: ['Buod bilang text', 'Summary as text'],
  dlSummarySub: ['Kopyahin para i-paste sa Messenger o Viber.', 'Copy it to paste into Messenger or Viber.'],
  summaryAria: ['Buod ng ayos', 'Layout summary'],
  sendHint: ['Ipadala ang project file at ang preview sa shop sa Messenger, Viber o email.', 'Send the project file and the preview to the shop through Messenger, Viber or email.'],
  sure: ['Sigurado ka ba?', 'Are you sure?'],
  no: ['Hindi', 'No'],
  yesGo: ['Oo, ituloy', 'Yes, continue'],
  confirmDemo: ['Papalitan ng demo ang kasalukuyang layout.', 'The demo will replace the current layout.'],
  confirmNew: ['Buburahin ang card, mga figure at ayos para magsimula ulit.', 'This clears the card, figures and layout so you can start over.'],

  /* spec text + spec sheet */
  txtTitle: ['HANGING FAMILY SIGN: SPECS', 'HANGING FAMILY SIGN: SPECS'],
  txtSummary: ['Card: {card} cm | Buong sukat: {total} cm | {n} figure', 'Card: {card} cm | Overall size: {total} cm | {n} figures'],
  txtRef: ['Lahat ng sukat ay mula sa kaliwa-itaas na sulok ng card.', 'All measurements are from the top-left corner of the card.'],
  txtRow: ['{n}. {name}: taas {h} cm, kaliwa-itaas ({x}, {y}), butas sa itaas ({hx}, {hy}), nakasabit kay {parent}, chain {len} cm',
           '{n}. {name}: height {h} cm, top-left ({x}, {y}), top hole ({hx}, {hy}), hangs from {parent}, chain {len} cm'],
  shTitle: ['Hanging Family Sign: Layout', 'Hanging Family Sign: Layout'],
  shLine: ['Card {card} cm   ·   Buong sukat {total} cm   ·   {n} figure', 'Card {card} cm   ·   Overall size {total} cm   ·   {n} figures'],
  shCustomer: ['Customer: ', 'Customer: '],
  shNote: ['Note: ', 'Note: '],
  shColName: ['Pangalan', 'Name'],
  shColH: ['Taas', 'Height'],
  shColHole: ['Butas (X, Y)', 'Hole (X, Y)'],
  shColParent: ['Sabit kay', 'Hangs from'],
  shColChain: ['Chain', 'Chain'],
  shFoot: ['Ang butas (X, Y) ay ang pwesto ng butas sa itaas ng figure, sukat sa cm mula sa kaliwa-itaas na sulok ng card.', 'The hole (X, Y) is the position of the hole at the top of each figure, in cm from the top-left corner of the card.'],

  /* card size, member count, pictures */
  btnBlank: ['Blank card', 'Blank card'],
  boardH: ['Taas ng card (cm)', 'Card height (cm)'],
  presetLbl: ['Karaniwang sukat', 'Common sizes'],
  presetCustom: ['Sariling sukat', 'Custom size'],
  lockRatio: ['Sundin ang ratio ng image', 'Match the image ratio'],
  cardStretch: ['Naka-stretch ang image dahil iba ang ratio nito ({a}) sa size ng card ({b}). I-tick ang "Sundin ang ratio ng image" para ayusin.',
                'The image is stretched because its ratio ({a}) differs from the card size ({b}). Tick "Match the image ratio" to fix it.'],
  cardTitleLbl: ['Pangalan ng pamilya sa blank card', 'Family name on the blank card'],
  cardTitlePh: ['hal. Dela Cruz', 'e.g. Dela Cruz'],
  countLbl: ['Ilang member', 'Number of members'],
  countMinus: ['Bawasan ang member', 'Fewer members'],
  countPlus: ['Dagdagan ang member', 'More members'],
  countHint: ['Hanggang 20 ang pwede. Lalabas agad ang ayos kahit wala pang larawan.', 'Up to 20. The arrangement shows right away, even without pictures yet.'],
  lockCountLbl: ['Hindi mapapalitan ng customer ang bilang ng member', 'The customer cannot change the number of members'],
  imgModeLbl: ['Kapag walang transparent na background ang larawan', 'When a picture has no transparent background'],
  imgAuto: ['Auto (hulaan)', 'Auto (detect)'],
  imgCut: ['Alisin ang background (cutout)', 'Remove the background (cutout)'],
  imgPhoto: ['Gamitin bilang photo (walang cutout)', 'Use as a photo (no cutout)'],
  btnUploadPics: ['Mag-upload ng mga larawan', 'Upload pictures'],
  hintUploadPics: ['Mapupunta ang mga larawan sa mga member na wala pang larawan, ayon sa pagkakasunod. Pwede ring i-drag ang larawan sa isang member o sa stage. Kahit anong picture muna ang pwede; palitan na lang ng chibi mamaya.',
                   'Pictures go to the members that have none yet, in order. You can also drag a picture onto a member or onto the stage. Any picture works for now; swap in the chibi later.'],
  memPic: ['Lagyan o palitan ang larawan', 'Add or replace the picture'],
  inspPic: ['Lagyan o palitan ang larawan', 'Add or replace the picture'],
  isEmptySlots: ['{n} member pa ang walang larawan.', '{n} members still have no picture.'],
  isTight: ['Napaliit ang mga figure sa {h} cm para magkasya sa card. Palakihin ang card o gumamit ng mas maraming row.', 'The figures had to shrink to {h} cm to fit the card. Make the card wider or use more rows.'],
  maxReached: ['Hanggang {max} lang ang member. {n} na larawan ang hindi nadagdag.', 'The limit is {max} members. {n} pictures were not added.'],
  countLocked: ['Naka-lock ng shop ang bilang ng member. Sa mga bakanteng slot lang napunta ang mga larawan; {n} ang hindi nadagdag.', 'The shop locked the number of members. Pictures only went into empty slots; {n} were not added.'],
  countRemoved: ['Naalis ang {n} member na may larawan. Gamitin ang Undo kung nagkamali.', '{n} members with pictures were removed. Use Undo if that was a mistake.'],
  draftRestored: ['Naibalik ang huling gawa mo sa device na ito.', 'Restored your last work on this device.'],
  nameSuggest: ['Lolo,Lola,Tatay,Nanay,Kuya,Ate,Bunso,Baby,Tito,Tita,Anak,Apo,Pamangkin,Aso,Pusa', 'Grandpa,Grandma,Dad,Mom,Brother,Sister,Baby,Uncle,Aunt,Son,Daughter,Grandchild,Nephew,Niece,Dog,Cat'],

  /* demo */
  demoCard: ['Demo card', 'Demo card'],
  demoLolo: ['Lolo', 'Grandpa'], demoLola: ['Lola', 'Grandma'], demoTatay: ['Tatay', 'Dad'], demoNanay: ['Nanay', 'Mom'],
  demoTito: ['Tito', 'Uncle'], demoKuya: ['Kuya', 'Big bro'], demoAte: ['Ate', 'Big sis'], demoBunso: ['Bunso', 'Youngest'], demoBaby: ['Baby', 'Baby']
};
const tr = (key, v) => {
  const e = D[key]; let s = e ? e[LANG === 'en' ? 1 : 0] : key;
  if (v) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));
  return s;
};
const DEMO_KEYS = ['demoLolo', 'demoLola', 'demoTatay', 'demoNanay', 'demoTito', 'demoKuya', 'demoAte', 'demoBunso', 'demoBaby'];
function applyStaticLang() {
  document.documentElement.lang = LANG === 'en' ? 'en' : 'fil';
  document.title = tr('appTitle');
  $$('[data-i18n]').forEach(el => { el.textContent = tr(el.dataset.i18n); });
  $$('[data-i18n-html]').forEach(el => { el.innerHTML = tr(el.dataset.i18nHtml); });
  for (const [attr, set] of [['title', 'i18nTitle'], ['aria-label', 'i18nAria'], ['placeholder', 'i18nPh']]) {
    $$('[data-' + set.replace(/[A-Z]/g, c => '-' + c.toLowerCase()) + ']').forEach(el => { el.setAttribute(attr, tr(el.dataset[set])); });
  }
  $$('#langSeg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === LANG)));
  const dl = $('#nameList'); if (dl) dl.innerHTML = tr('nameSuggest').split(',').map(n => `<option value="${esc(n.trim())}"></option>`).join('');
}
function setLang(l, persist) {
  const old = LANG; LANG = l === 'en' ? 'en' : 'tl';
  if (persist !== false) { try { localStorage.setItem(LANG_KEY, LANG); } catch (e) { /* private mode */ } }
  applyStaticLang();
  if (old !== LANG && typeof refreshAfterLang === 'function') refreshAfterLang(old);
}
function detectLang() {
  try { const q = new URLSearchParams(location.search).get('lang'); if (q === 'en' || q === 'tl') { try { localStorage.setItem(LANG_KEY, q); } catch (e) { /* ignore */ } return q; } } catch (e) { /* ignore */ }
  try { const s = localStorage.getItem(LANG_KEY); if (s === 'en' || s === 'tl') return s; } catch (e) { /* ignore */ }
  return 'tl';
}
