/* 一般向けのしょうかい資料（A4縦2枚）を作る。
   templates/guide.html の <!--@SPRITE--> <!--@ILLUST--> を埋め、{{…}} トークンを解決して
   印刷用HTMLを dist/draffia-guide.html に、PDF を pdf/draffia-guide.pdf に書き出す（ヘッドレス Chromium で印刷）。
   使い方: npm run pdf（A4資料と続けて作る） */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const P = (...a) => path.join(ROOT, ...a);
const T = require('./tokens.js');

let html = fs.readFileSync(P('templates/guide.html'), 'utf8');
const b64 = (f) => fs.readFileSync(P(f)).toString('base64');
const parts = {
  SPRITE: `<img src="data:image/png;base64,${b64('assets/draffia.png')}" width="144" height="116" alt="ドラフィアのドット絵">`,
  ILLUST: `<img src="data:image/jpeg;base64,${b64('assets/draffia-sylveon.jpg')}" width="1400" height="1074" alt="草むらで寝転ぶニンフィアに、ドラフィアが頬を寄せているイラスト">`,
};
for (const k in parts) {
  const tag = `<!--@${k}-->`;
  if (!html.includes(tag)) throw new Error('missing placeholder ' + k);
  html = html.split(tag).join(parts[k]);
}
html = T.resolve(html).html;
fs.writeFileSync(P('dist/draffia-guide.html'), html);

(async () => {
  const {chromium} = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + P('dist/draffia-guide.html'), {waitUntil: 'networkidle'});
  await page.evaluate(() => document.fonts.ready);
  const fonts = await page.evaluate(() => ['Zen Maru Gothic', 'Dela Gothic One', 'Yomogi'].map(f => [f, document.fonts.check(`12px "${f}"`)]));
  const over = await page.evaluate(() => [...document.querySelectorAll('.page')].map(p => p.scrollHeight - p.clientHeight));
  fs.mkdirSync(P('pdf'), {recursive: true});
  await page.pdf({path: P('pdf/draffia-guide.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true});
  await browser.close();
  console.log('fonts', JSON.stringify(fonts));
  console.log('はみ出し(px)', JSON.stringify(over), over.some(v => v > 0) ? '← ページに収まっていない' : 'OK');
  console.log('written pdf/draffia-guide.pdf', (fs.statSync(P('pdf/draffia-guide.pdf')).size / 1024).toFixed(1) + 'KB');
})();
