/* 「ロンドのない世界線」の考察資料（A4縦2枚、PDF）を作る。
   templates/ifworld.html の <!--@NAME--> を埋め、{{…}} トークンをWeb版と同じ計算で解決し、
   印刷用HTMLを dist/draffia-if.html に、PDF を pdf/draffia-if-no-rondo.pdf に書き出す。
   「ロンドあり」の対面判定（§2.1 tbl-s-match）と習得技の★（§1.6）は templates/body.html から自動で入る。
   使い方: npm run pdf */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const P = (...a) => path.join(ROOT, ...a);
const T = require('./tokens.js');

let html = fs.readFileSync(P('templates/ifworld.html'), 'utf8');
/* §6 の型の表は、シングルの3型（S1・S2・S3）とダブルの2型（D1）の性格・努力値を見出し行で共通にしている */
const {SETS} = require('../src/sets.js');
const same = (a, b) => SETS[a].nat === SETS[b].nat && JSON.stringify(SETS[a].ev) === JSON.stringify(SETS[b].ev);
if (!same('S1', 'S2') || !same('S1', 'S3')) throw new Error('S1・S2・S3 の性格・努力値が揃っていない（templates/ifworld.html §6 の見出し行を直す）');
const body = fs.readFileSync(P('templates/body.html'), 'utf8');

/* ロンドありの対面判定（Web版 §2.1） */
const tbl = body.slice(body.indexOf('id="tbl-s-match"'), body.indexOf('</table>', body.indexOf('id="tbl-s-match"')));
const real = new Map([...tbl.matchAll(/<th class="rowh">([^<]+)<\/th><td><span class="v (v-good|v-mid|v-bad)">([^<]+)<\/span>/g)].map(m => [m[1], {cls: m[2], label: m[3]}]));
if (real.size !== 20) throw new Error('対面表の行数が想定外: ' + real.size);

const CLS = ['v-good', 'v-mid', 'v-bad'], LABEL = {'v-good': '有利', 'v-mid': '五分', 'v-bad': '不利'};
const count = (list) => CLS.map(c => list.filter(x => x === c).length);
const tallyStr = (n) => `有利${n[0]}・五分${n[1]}・不利${n[2]}`;
const cols = {real: [], band: [], scarf: []};
let flips = 0, seen = 0;
html = html.replace(/<tr data-real="([^"]+)">([\s\S]*?)<\/tr>/g, (m, name, inner) => {
  const r = real.get(name);
  if (!r) throw new Error('ロンドありの対面表に ' + name + ' がない');
  seen++;
  const own = [...inner.matchAll(/class="v (v-good|v-mid|v-bad)"/g)].map(x => x[1]);
  if (own.length !== 2) throw new Error(name + ' の行に判定が2つない');
  cols.real.push(r.cls); cols.band.push(own[0]); cols.scarf.push(own[1]);
  const flip = r.cls !== own[0];
  if (flip) flips++;
  return `<tr${flip ? ' class="flip"' : ''}>` + inner.replace('<!--@REAL-->', `<td class="c was"><span class="v ${r.cls}">${r.label}</span></td>`) + '</tr>';
});
if (seen !== 20) throw new Error('ロンドなしの対面表の行数が想定外: ' + seen);

/* 習得技の★（Web版 §1.6） */
const mvStart = body.indexOf('1.6</span>習得技の評価');
const mvTbl = body.slice(body.indexOf('<tbody>', mvStart), body.indexOf('</tbody>', mvStart));
const stars = new Map([...mvTbl.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(m => {
  const c = [...m[1].matchAll(/<(th|td)[^>]*>([\s\S]*?)<\/\1>/g)].map(x => x[2].replace(/<[^>]+>/g, '').trim());
  return [c[0], `${c[2]}／${c[3]}`];
}));
html = html.replace(/<tr data-move="([^"]+)">([\s\S]*?)<\/tr>/g, (m, mv, inner) => {
  if (!stars.has(mv)) throw new Error('習得技の表に ' + mv + ' がない');
  return '<tr>' + inner.replace('<!--@STARS-->', `<td class="c was">${stars.get(mv)}</td>`) + '</tr>';
});

const sprite = `<img src="data:image/png;base64,${fs.readFileSync(P('assets/draffia.png')).toString('base64')}" width="144" height="116" alt="ドラフィアの外観">`;
const nReal = count(cols.real), nBand = count(cols.band), nScarf = count(cols.scarf);
const parts = {SPRITE: sprite, TALLY_REAL: tallyStr(nReal), TALLY_BAND: tallyStr(nBand), TALLY_SCARF: tallyStr(nScarf),
  FLIPS: String(flips), GOOD_REAL: String(nReal[0]), GOOD_BAND: String(nBand[0])};
for (const k in parts) {
  const tag = `<!--@${k}-->`;
  if (!html.includes(tag)) throw new Error('missing placeholder ' + k);
  html = html.split(tag).join(parts[k]);
}
if (/<!--@[A-Z_]+-->/.test(html)) throw new Error('埋まっていない placeholder: ' + html.match(/<!--@[A-Z_]+-->/)[0]);
html = T.resolve(html).html;
fs.writeFileSync(P('dist/draffia-if.html'), html);

(async () => {
  const {chromium} = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + P('dist/draffia-if.html'), {waitUntil: 'networkidle'});
  await page.evaluate(() => document.fonts.ready);
  const fonts = await page.evaluate(() => ['Zen Kaku Gothic New', 'Dela Gothic One', 'IBM Plex Mono'].map(f => [f, document.fonts.check(`12px "${f}"`)]));
  const over = await page.evaluate(() => [...document.querySelectorAll('.page')].map(p => p.scrollHeight - p.clientHeight));
  fs.mkdirSync(P('pdf'), {recursive: true});
  await page.pdf({path: P('pdf/draffia-if-no-rondo.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true});
  await browser.close();
  console.log('fonts', JSON.stringify(fonts));
  console.log('対面', tallyStr(nReal), '→ 鉢巻', tallyStr(nBand), '／ スカーフ', tallyStr(nScarf), '入れ替わり', flips);
  console.log('はみ出し(px)', JSON.stringify(over), over.some(v => v > 0) ? '← ページに収まっていない' : 'OK');
  console.log('written pdf/draffia-if-no-rondo.pdf', (fs.statSync(P('pdf/draffia-if-no-rondo.pdf')).size / 1024).toFixed(1) + 'KB');
})();
