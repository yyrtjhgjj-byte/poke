/* 主要な計算結果をMarkdownに書き出す。性能を変えたら再実行し、git diff で数値の変化を確認する。 */
const fs = require('fs');
const path = require('path');
const C = require('../src/core.js');
const E = C.E, JP = E.JP;
const OUT = path.join(__dirname, '..', 'notes', 'calc-snapshot.md');

const pct = (r) => !r ? '—' : (r.max === 0 ? '無効' : `${r.minPct.toFixed(1)}–${r.maxPct.toFixed(1)}% ${r.ko.text}`);
const sp = C.SP.draffia;

const SETS = {
  'S-1 陽気AS ハチマキ': {ev: {hp: 4, atk: 252, spe: 252}, nat: 'jolly', o: {skin: true, item: 'band'}},
  'S-1変形 意地AS ハチマキ': {ev: {hp: 4, atk: 252, spe: 252}, nat: 'adamant', o: {skin: true, item: 'band'}},
  'S-2 陽気AS 補正なし': {ev: {hp: 4, atk: 252, spe: 252}, nat: 'jolly', o: {skin: true}},
  'S-3 陽気AS 珠+1 テラス竜': {ev: {hp: 4, atk: 252, spe: 252}, nat: 'jolly', o: {skin: true, item: 'lo', atkStage: 1, tera: 'Dragon'}},
};
const BULK = {
  'S-1 陽気 H4': {ev: {hp: 4, atk: 252, spe: 252}, nat: 'jolly'},
  'S-4 わんぱく HB（物理いかく込み）': {ev: {hp: 252, def: 252, spd: 4}, nat: 'impish', intim: true},
  'D-1 しんちょう H252 B60 D196（物理いかく込み）': {ev: {hp: 252, def: 60, spd: 196}, nat: 'careful', intim: true},
};
const MOVES = ['rondo', 'doubleedge', 'bodyslam', 'crunch', 'irontail', 'trailblaze'];

let md = `# 計算スナップショット\n\n`;
md += `> \`npm run snapshot\` で自動生成。手で編集しない。性能を変えたら再生成し、\`git diff notes/calc-snapshot.md\` で変化を確認する。\n\n`;
md += `## 検体\n\n- 種族値 H${sp.b.join('/')}（合計 ${sp.b.reduce((a, b) => a + b, 0)}）\n- タイプ ${sp.t.map(t => JP[t]).join('/')}\n- スキン変換先 ${JP[sp.skin]}\n\n`;

md += `## 実数値\n\n| 型 | 性格 | 努力値 | H-A-B-C-D-S |\n|---|---|---|---|\n`;
for (const [n, s] of Object.entries(Object.assign({}, SETS, BULK))) {
  const st = C.stats('draffia', s.nat, s.ev);
  md += `| ${n} | ${C.NAT[s.nat].jp} | ${Object.entries(s.ev).map(([k, v]) => k.toUpperCase() + v).join(' ')} | ${['hp', 'atk', 'def', 'spa', 'spd', 'spe'].map(k => st[k]).join('-')} |\n`;
}

md += `\n## 与ダメージ（ドラフィア → 相手）\n\n`;
for (const [n, s] of Object.entries(SETS)) {
  const st = C.stats('draffia', s.nat, s.ev);
  md += `### ${n}\n\n| 相手 | ${MOVES.map(m => C.DM[m].jp).join(' | ')} |\n|---|${MOVES.map(() => '---').join('|')}|\n`;
  for (const t of C.TARGETS) {
    const tg = {sp: t.sp, st: t.st, final: t.final, defStage: t.defStage || 0};
    md += `| ${t.label} | ${MOVES.map(m => pct(C.drfAtk(Object.assign({st, move: m, target: tg}, s.o)))).join(' | ')} |\n`;
  }
  md += '\n';
}

md += `## 被ダメージ（相手 → ドラフィア）\n\n| 相手の攻撃 | ${Object.keys(BULK).join(' | ')} |\n|---|${Object.keys(BULK).map(() => '---').join('|')}|\n`;
for (const p of C.ATTACKS) {
  md += `| ${p.label} | ${Object.values(BULK).map(b => pct(C.vsDrf(p, {st: C.stats('draffia', b.nat, b.ev), intim: !!b.intim}))).join(' | ')} |\n`;
}

md += `\n## すばやさ\n\n`;
for (const [n, nat, ev] of [['最速', 'jolly', 252], ['準速', 'hardy', 252], ['無振り', 'hardy', 0]]) {
  const s = C.stats('draffia', nat, {spe: ev}).spe;
  md += `- ${n}: ${s}（スカーフ・+1で ${Math.floor(s * 1.5)}）\n`;
}

fs.mkdirSync(path.dirname(OUT), {recursive: true});
fs.writeFileSync(OUT, md);
console.log('written', path.relative(process.cwd(), OUT), (md.length / 1024).toFixed(1) + 'KB');
