/* 主要な計算結果をMarkdownに書き出す。性能を変えたら再実行し、git diff で数値の変化を確認する。 */
const fs = require('fs');
const path = require('path');
const C = require('../src/core.js');
const E = C.E, JP = E.JP;
const OUT = path.join(__dirname, '..', 'notes', 'calc-snapshot.md');

const pct = (r) => !r ? '—' : (r.max === 0 ? '無効' : `${r.minPct.toFixed(1)}–${r.maxPct.toFixed(1)}% ${r.ko.text}`);
const sp = C.SP.draffia;

/* 型は src/sets.js から取る（本文・生成表と同じ定義） */
const {SETS} = require('../src/sets.js');
const OFF = ['S1', 'S1A', 'AS', 'S3'];   // 与ダメージを並べる型
const DEF = ['S1', 'S4', 'D1'];          // 被ダメージを並べる型
const LETTER = {hp: 'H', atk: 'A', def: 'B', spa: 'C', spd: 'D', spe: 'S'};
const evStr = (ev) => ['hp', 'atk', 'def', 'spa', 'spd', 'spe'].filter(k => ev[k]).map(k => LETTER[k] + ev[k]).join(' ');
const atkOf = (id) => { const s = SETS[id]; return {skin: s.skin, item: s.item || '', tera: s.tera || null, atkStage: s.atkStage || 0}; };
const defLabel = (id) => SETS[id].label + (SETS[id].intim ? '（物理いかく込み）' : '');
const MOVES = ['rondo', 'doubleedge', 'bodyslam', 'crunch', 'irontail', 'trailblaze'];

let md = `# 計算スナップショット\n\n`;
md += `> \`npm run snapshot\` で自動生成。手で編集しない。性能を変えたら再生成し、\`git diff notes/calc-snapshot.md\` で変化を確認する。\n\n`;
md += `## 検体\n\n- 種族値 H${sp.b.join('/')}（合計 ${sp.b.reduce((a, b) => a + b, 0)}）\n- タイプ ${sp.t.map(t => JP[t]).join('/')}\n- スキン変換先 ${JP[sp.skin]}\n\n`;

md += `## 実数値\n\n| 型 | 性格 | 努力値 | H-A-B-C-D-S |\n|---|---|---|---|\n`;
for (const [id, s] of Object.entries(SETS)) {
  const st = C.stats('draffia', s.nat, s.ev);
  md += `| ${id} ${s.label} | ${C.NAT[s.nat].jp} | ${evStr(s.ev)} | ${['hp', 'atk', 'def', 'spa', 'spd', 'spe'].map(k => st[k]).join('-')} |\n`;
}

md += `\n## 与ダメージ（ドラフィア → 相手）\n\n`;
for (const id of OFF) {
  const s = SETS[id], st = C.stats('draffia', s.nat, s.ev);
  md += `### ${s.label}\n\n| 相手 | ${MOVES.map(m => C.DM[m].jp).join(' | ')} |\n|---|${MOVES.map(() => '---').join('|')}|\n`;
  for (const t of C.TARGETS) {
    const tg = {sp: t.sp, st: t.st, final: t.final, defStage: t.defStage || 0};
    md += `| ${t.label} | ${MOVES.map(m => pct(C.drfAtk(Object.assign({st, move: m, target: tg}, atkOf(id))))).join(' | ')} |\n`;
  }
  md += '\n';
}

md += `## 被ダメージ（相手 → ドラフィア）\n\n| 相手の攻撃 | ${DEF.map(defLabel).join(' | ')} |\n|---|${DEF.map(() => '---').join('|')}|\n`;
for (const p of C.ATTACKS) {
  md += `| ${p.label} | ${DEF.map(id => pct(C.vsDrf(p, {st: C.stats('draffia', SETS[id].nat, SETS[id].ev), intim: !!SETS[id].intim}))).join(' | ')} |\n`;
}

md += `\n## すばやさ\n\n`;
for (const [n, nat, ev] of [['最速', 'jolly', 252], ['準速', 'hardy', 252], ['無振り', 'hardy', 0]]) {
  const s = C.stats('draffia', nat, {spe: ev}).spe;
  md += `- ${n}: ${s}（スカーフ・+1で ${Math.floor(s * 1.5)}）\n`;
}

fs.mkdirSync(path.dirname(OUT), {recursive: true});
fs.writeFileSync(OUT, md);
console.log('written', path.relative(process.cwd(), OUT), (md.length / 1024).toFixed(1) + 'KB');
