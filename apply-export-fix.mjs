// Family Sign Studio: export fix
// 1) one download per click (no stacked click handlers)
// 2) "Names" unchecked -> names are not drawn in the downloaded preview
// Usage (run in the project folder):  node apply-export-fix.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const f = 'src/p5_io.js';
if (!existsSync(f)) { console.error('Wala ang src/p5_io.js. Patakbuhin ito sa mismong project folder.'); process.exit(1); }
let s = readFileSync(f, 'utf8');
if (s.includes('one handler no matter how often')) { console.log('Naka-apply na ang fix.'); process.exit(0); }
const edits = [
  ["  root.addEventListener('click', e => { const b = e.target.closest('[data-dl]'); if (b) doDl(b.dataset.dl); });",
   "  root.onclick = e => { const b = e.target.closest('[data-dl]'); if (b) doDl(b.dataset.dl); }; /* one handler no matter how often the modal opens */"],
  ["names: o.names !== false, ghost: false });",
   "names: o.names === undefined ? S.set.names !== false : o.names, ghost: false });"],
  ["const prev = renderExport({ k: 60, maxDim: 1500 })",
   "const prev = renderExport({ k: 60, maxDim: 1500, names: true })"]
];
for (const [a, b] of edits) {
  if (!s.includes(a)) { console.error('Hindi tugma ang code sa src/p5_io.js, walang binago. Ipadala sa akin ang file na ito.'); process.exit(1); }
  s = s.replace(a, b);
}
writeFileSync(f, s);
console.log('Tapos: na-fix ang src/p5_io.js. Susunod: node build.mjs, tapos i-push sa GitHub.');
