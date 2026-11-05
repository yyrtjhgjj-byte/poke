/* A4縦2枚の資料（PDF）を作る。
   templates/a4.html の <!--@NAME--> を埋め、{{…}} トークンをWeb版と同じ計算で解決し、
   dist/draffia-a4.html と dist/draffia-a4.pdf を書き出す（PDF はヘッドレス Chromium で印刷）。
   使い方: npm run pdf */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const P = (...a) => path.join(ROOT, ...a);
const T = require('./tokens.js');
const CFG = require('../src/report.config.js');

let html = fs.readFileSync(P('templates/a4.html'), 'utf8');

/* 対面表（Web版 §2.1 の tbl-s-match）から判定ごとの相手を集める */
const body = fs.readFileSync(P('templates/body.html'), 'utf8');
const tbl = body.slice(body.indexOf('id="tbl-s-match"'), body.indexOf('</table>', body.indexOf('id="tbl-s-match"')));
const rows = [...tbl.matchAll(/<th class="rowh">([^<]+)<\/th><td><span class="v (v-good|v-mid|v-bad)">([^<]+)<\/span>/g)].map(m => ({name: m[1], cls: m[2], label: m[3]}));
if (rows.length !== 20) throw new Error('対面表の行数が想定外: ' + rows.length);
const groups = ['v-good', 'v-mid', 'v-bad'].map(c => rows.filter(r => r.cls === c));
const tally = groups.map(g => g.length ? `${g[0].label}${g.length}` : '').filter(Boolean).join('・');
const list = groups.filter(g => g.length).map(g => `<p><span class="v ${g[0].cls}">${g[0].label}</span>${g.map(r => r.name).join('、')}</p>`).join('\n      ');

/* 採用率の推計（report.config.js）から各項目の1位 */
const top = (grp, key) => { const g = grp.find(x => x[0] === key); return g ? `${g[1][0][0]}（${g[1][0][1]}%）` : '—'; };
let adopt = '<table><thead><tr><th></th><th>シングル</th><th>ダブル</th></tr></thead><tbody>';
for (const k of ['特性', '型', '持ち物', 'テラスタル']) adopt += `<tr><th>${k}</th><td>${top(CFG.adoptS, k)}</td><td>${top(CFG.adoptD, k)}</td></tr>`;
adopt += '</tbody></table>';

const sprite = `<img src="data:image/png;base64,${fs.readFileSync(P('assets/draffia.png')).toString('base64')}" width="150" height="121" alt="ドラフィアの外観">`;
const parts = {SPRITE: sprite, MATCH_TALLY: tally, MATCH_LIST: list, ADOPT_TOP: adopt};
for (const k in parts) {
  const tag = `<!--@${k}-->`;
  if (!html.includes(tag)) throw new Error('missing placeholder ' + k);
  html = html.split(tag).join(parts[k]);
}
html = T.resolve(html).html;
fs.writeFileSync(P('dist/draffia-a4.html'), html);

(async () => {
  const {chromium} = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + P('dist/draffia-a4.html'), {waitUntil: 'networkidle'});
  await page.evaluate(() => document.fonts.ready);
  const fonts = await page.evaluate(() => ['Zen Kaku Gothic New', 'Dela Gothic One', 'IBM Plex Mono'].map(f => [f, document.fonts.check(`12px "${f}"`)]));
  const over = await page.evaluate(() => [...document.querySelectorAll('.page')].map(p => p.scrollHeight - p.clientHeight));
  await page.pdf({path: P('dist/draffia-a4.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true});
  await browser.close();
  console.log('fonts', JSON.stringify(fonts));
  console.log('はみ出し(px)', JSON.stringify(over), over.some(v => v > 0) ? '← ページに収まっていない' : 'OK');
  console.log('written dist/draffia-a4.pdf', (fs.statSync(P('dist/draffia-a4.pdf')).size / 1024).toFixed(1) + 'KB');
})();
