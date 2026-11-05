/* 本文中の {{…}} トークンを計算値に置き換える。
   書式は CLAUDE.md の「数値トークン」を参照。未知のトークンや計算できない値はビルドを止める。 */
const C = require('../src/core.js');
const {SETS} = require('../src/sets.js');
const CFG = require('../src/report.config.js');
const E = C.E;

const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const LETTER = {hp: 'H', atk: 'A', def: 'B', spa: 'C', spd: 'D', spe: 'S'};
const FMTS = new Set(['pct', 'ko', 'full', 'p1', 'surv', 'range']);
const CHAPTERS = {abstract: '§0 要旨', specimen: '§1 検体', singles: '§2 シングル', doubles: '§3 ダブル', training: '§4 育成論', teams: '§5 パーティ', lab: '§6 実験室', forecast: '§7 予測', archive: '§8 記録庫'};

function fail(msg) { throw new Error('トークン: ' + msg); }
function setOf(id) { const s = SETS[id]; if (!s) fail(`型 ${id} がない（src/sets.js）`); return s; }
function setStats(id) { const s = setOf(id); return C.stats('draffia', s.nat, s.ev); }
function pctStr(p) { const v = Math.round(p * 1000) / 10; return (Number.isInteger(v) ? v.toFixed(0) : v.toFixed(1)) + '%'; }
function range(r) { return `${Math.floor(r.minPct)}〜${Math.ceil(r.maxPct)}%`; }
function ko(r, inline) {
  if (r.max === 0 || r.ko.n === 0) return '無効';
  const k = r.ko;
  if (k.p === null) return `乱数${k.n}発`;
  if (k.p >= 0.9999) return `確定${k.n}発`;
  return inline ? `乱数${k.n}発 ${pctStr(k.p)}` : `乱数${k.n}発（${pctStr(k.p)}）`;
}
function surv(r) {
  if (r.max === 0) return '無効';
  if (r.ko.n >= 2) return '確定で耐える';
  if (r.ko.p >= 0.9999) return '耐えられない';
  return `${pctStr(1 - r.ko.p)}で耐える`;
}
function fmt(r, f) {
  switch (f) {
    case 'pct': return r.max === 0 ? '無効' : range(r);
    case 'ko': return ko(r, false);
    case 'full': return r.max === 0 ? '無効' : `${range(r)}（${ko(r, true)}）`;
    case 'p1': return r.ko.n === 1 ? pctStr(r.ko.p) : '0%';
    case 'surv': return surv(r);
    case 'range': return `${r.min}〜${r.max}`;
  }
  fail('未知の書式 ' + f);
}
/* 素早さの補正：x1.5（スカーフ等）、+1 / -1（ランク） */
function speMod(s, mod) {
  if (!mod) return s;
  if (/^x[\d.]+$/.test(mod)) return Math.floor(s * parseFloat(mod.slice(1)));
  if (/^[+-]\d$/.test(mod)) return E.boost(s, parseInt(mod, 10));
  fail('素早さの補正 ' + mod);
}
function speOf(sp, nat, ev, mod) {
  if (!C.SP[sp]) fail('種族 ' + sp + ' がない');
  if (!C.NAT[nat]) fail('性格 ' + nat + ' がない');
  if (ev === undefined || isNaN(+ev)) fail(`${sp} の素早さ努力値がない`);
  return speMod(C.stats(sp, nat, {spe: +ev}).spe, mod);
}
function setSpeed(id, mod) { const s = setOf(id); const v = setStats(id).spe; return speMod(s.speMul ? Math.floor(v * s.speMul) : v, mod); }
function name(sp) { return C.SP[sp].jp; }
const TYPE_SHORT = {Normal: 'ノーマル', Fire: '炎', Water: '水', Electric: '電気', Grass: '草', Ice: '氷', Fighting: '闘', Poison: '毒', Ground: '地', Flying: '飛行',
  Psychic: '超', Bug: '虫', Rock: '岩', Ghost: '霊', Dragon: '竜', Dark: '悪', Steel: '鋼', Fairy: '妖'};
const STAT_JP = ['HP', '攻撃', '防御', '特攻', '特防', '素早さ'];

function dmg(args) {
  const [id, move, tk, ...rest] = args;
  const s = setOf(id), st = setStats(id), t0 = C.target(tk);
  if (!C.DM[move]) fail('技 ' + move + ' がない');
  if (!t0) fail('相手 ' + tk + ' がない（TARGETS）');
  const o = {st, skin: s.skin, move, item: s.item || '', tera: s.tera || null, atkStage: s.atkStage || 0, stellar: true};
  const tgt = {sp: t0.sp, st: t0.st, final: t0.final, defStage: t0.defStage || 0};
  let f = 'pct';
  for (const a of rest) {
    if (FMTS.has(a)) f = a;
    else if (a.startsWith('tt=')) tgt.tera = a.slice(3);
    else if (a.startsWith('stage=')) o.atkStage = +a.slice(6);
    else if (a.startsWith('item=')) o.item = a.slice(5);
    else if (a.startsWith('tera=')) o.tera = a.slice(5) || null;
    else if (a === 'unaware') o.atkStage = 0;
    else if (a === 'hh') o.hh = true;
    else if (a === 'burn') { o.burn = true; o.statused = true; }
    else if (a === 'st') o.statused = true;
    else if (a === 'crit') o.crit = true;
    else if (a === 'dbl') o.doubles = true;
    else if (a === 'ruin') tgt.ruin = true;
    else fail('dmg の指定 ' + a);
  }
  o.target = tgt;
  const r = C.drfAtk(o);
  if (!r) fail(`${id} の ${move} はダメージ技ではない`);
  return fmt(r, f);
}
function hit(args) {
  const [id, ak, ...rest] = args;
  const s = setOf(id), p = C.attack(ak);
  if (!p) fail('攻撃 ' + ak + ' がない（ATTACKS）');
  const d = {st: setStats(id), intim: !!s.intim};
  let f = 'pct';
  for (const a of rest) {
    if (FMTS.has(a)) f = a;
    else if (a === 'intim') d.intim = true;
    else if (a === 'nointim') d.intim = false;
    else if (a === 'haban') d.haban = true;
    else if (a === 'av') d.av = true;
    else if (a.startsWith('tera=')) d.tera = a.slice(5) || null;
    else fail('hit の指定 ' + a);
  }
  return fmt(C.vsDrf(p, d), f);
}
function stat(args) {
  const [id, key = 'line'] = args;
  const st = setStats(id);
  if (key === 'line') return `${st.hp}-${st.atk}-${st.def}-×-${st.spd}-${st.spe}`;
  if (key === 'hp2') return String(Math.floor(st.hp / 2));
  if (key === 'hp4') return String(Math.floor(st.hp / 4));
  if (STAT_KEYS.includes(key)) return String(st[key]);
  fail('stat の指定 ' + key);
}
function base(args) {
  let sp = 'draffia', key = 'line';
  for (const a of args) { if (C.SP[a]) sp = a; else key = a; }
  const b = C.SP[sp].b;
  if (key === 'line') return STAT_KEYS.map((k, i) => LETTER[k] + b[i]).join(' ') + ' ／ ' + b.reduce((x, y) => x + y, 0);
  if (key === 'total') return String(b.reduce((x, y) => x + y, 0));
  if (key === 'top2') return b.map((v, i) => [v, i]).sort((x, y) => y[0] - x[0] || x[1] - y[1]).slice(0, 2).map(([v, i]) => STAT_JP[i] + v).join('・');
  const i = STAT_KEYS.indexOf(key); if (i < 0) fail('base の指定 ' + key);
  return String(b[i]);
}
function bp(args) {
  const [move, ...opt] = args; const m = C.DM[move];
  if (!m) fail('技 ' + move + ' がない');
  let v = m.bp;
  for (const a of opt) {
    if (a === 'skin') { if (m.skin) v = E.pokeRound(v * 4915 / 4096); }
    else if (/^x[\d.]+$/.test(a)) v = Math.floor(v * parseFloat(a.slice(1)));
    else fail('bp の指定 ' + a);
  }
  return String(v);
}
function spcmp(args) {
  const [id, sp, nat, ev, mod] = args;
  const me = setSpeed(id), you = speOf(sp, nat, ev, mod);
  if (me === you) return `同速（${me}）`;
  return me > you ? `こちらが先手（${me}対${you}）` : `相手が先手（${you}対${me}）`;
}
/* 複数の相手との素早さ比較を文にする。相手は 種族/性格[/努力値[/補正]]（努力値の省略は252） */
function spvs(args) {
  const [id, ...list] = args;
  if (!list.length) fail('spvs の相手がない');
  const me = setSpeed(id), g = {lt: [], eq: [], gt: []};
  for (const x of list) {
    const [sp, nat, ev = '252', mod] = x.split('/');
    const v = speOf(sp, nat, ev, mod);
    (v < me ? g.lt : v === me ? g.eq : g.gt).push(`${name(sp)}（${v}）`);
  }
  const parts = [];
  if (g.lt.length) parts.push([g.lt.join('、') + 'より速', 'く', 'い']);
  if (g.eq.length) parts.push([g.eq.join('、') + 'と同速', 'で', '']);
  if (g.gt.length) parts.push([g.gt.join('、') + 'より遅', 'く', 'い']);
  return parts.map((p, i) => p[0] + (i < parts.length - 1 ? p[1] : p[2])).join('、');
}
function effList(args) {
  const t = C.SP.draffia.t, pick = (f) => E.TYPES.filter(a => f(E.eff(a, t)));
  const L = {weak: pick(v => v > 1), resist: pick(v => v > 0 && v < 1), immune: pick(v => v === 0)}[args[0]];
  if (!L) fail('eff の指定 ' + args[0]);
  return L.length ? L.map(a => TYPE_SHORT[a]).join('・') : 'なし';
}
function fasterlist(args) {
  const [id, ...list] = args;
  const me = setSpeed(id);
  const out = list.map(x => { const [sp, nat] = x.split('/'); return [sp, speOf(sp, nat, 252)]; }).filter(([, v]) => v > me).map(([sp]) => name(sp));
  return out.length ? out.join('、') : '（該当なし）';
}
function kolist(args) {
  const [id, move, ...rest] = args;
  const tks = rest.filter(a => C.target(a)), opts = rest.filter(a => !C.target(a));
  const groups = [];
  for (const tk of tks) {
    const k = dmg([id, move, tk, ...opts, 'ko']);
    const g = groups.find(x => x.k === k);
    if (g) g.n.push(name(C.target(tk).sp)); else groups.push({k, n: [name(C.target(tk).sp)]});
  }
  const names = (n) => n.length === 2 ? n.join('と') : n.join('、');
  return groups.map(g => `${names(g.n)}は${g.k}`).join('、');
}
function rondoflip(args) {
  const [id, key = 'stage'] = args;
  const st = setStats(id);
  if (key === 'spa') return String(st.spa);
  for (let s = 0; s >= -6; s--) if (E.boost(st.atk, s) <= st.spa) return String(s);
  return '（-6でも物理）';
}
function tally(args, html) {
  const id = args[0];
  const i = html.indexOf(`id="${id}"`); if (i < 0) fail('表 ' + id + ' がない');
  const seg = html.slice(i, html.indexOf('</table>', i));
  const c = (cls) => (seg.match(new RegExp(`class="v ${cls}"`, 'g')) || []).length;
  return `有利${c('v-good')}・五分${c('v-mid')}・不利${c('v-bad')}`;
}

function evalToken(src, html) {
  const [kind, ...args] = src.trim().split(/\s+/);
  switch (kind) {
    case 'dmg': return dmg(args);
    case 'hit': return hit(args);
    case 'stat': return stat(args);
    case 'ev': {
      const s = setOf(args[0]);
      if (args[1]) { if (!STAT_KEYS.includes(args[1])) fail('ev の指定 ' + args[1]); return String(s.ev[args[1]] || 0); }
      return STAT_KEYS.filter(k => s.ev[k]).map(k => LETTER[k] + s.ev[k]).join(' ');
    }
    case 'nat': return C.NAT[setOf(args[0]).nat].jp;
    case 'spe': return String(speOf(args[0], args[1], args[2], args[3]));
    case 'setspe': return String(setSpeed(args[0], args[1]));
    case 'spcmp': return spcmp(args);
    case 'spvs': return spvs(args);
    case 'eff': return effList(args);
    case 'fasterlist': return fasterlist(args);
    case 'kolist': return kolist(args);
    case 'base': return base(args);
    case 'bp': return bp(args);
    case 'rondoflip': return rondoflip(args);
    case 'grade': return CFG.grade[args[0]] || fail('grade ' + args[0]);
    case 'rank': { const r = (CFG.rank[args[0]] || {})[args[1]]; if (!r) fail('rank ' + args.join(' ')); return `${r[0]}〜${r[1]}位`; }
    case 'tally': return tally(args, html);
  }
  fail('未知の種類 ' + kind);
}

/* html 内のトークンを解決し、{html, claims} を返す。claims は本文中の計算値の一覧。
   {{!…}} と、タグの属性の中にあるトークンは値だけ入れて一覧には載せない（計算機の初期値など）。 */
function resolve(html) {
  const vals = [];
  const marked = html.replace(/\{\{([^{}]+)\}\}/g, (m, inner, off) => {
    let src = inner.trim(), quiet = html.lastIndexOf('<', off) > html.lastIndexOf('>', off);
    if (src.startsWith('!')) { quiet = true; src = src.slice(1).trim(); }
    let v;
    try { v = evalToken(src, html); } catch (e) { throw new Error(`${e.message}\n  → {{${inner}}}`); }
    if (v === undefined || /NaN|undefined/.test(v)) fail(`値が不正 {{${inner}}} → ${v}`);
    vals.push({token: src, value: v, quiet});
    return `\u0001${vals.length - 1}\u0002`;
  });
  const out = marked.replace(/\u0001(\d+)\u0002/g, (m, i) => vals[+i].value);
  // claims log
  const secs = [...marked.matchAll(/id="([a-z]+)" data-chapter/g)].map(m => [m.index, m[1]]);
  const text = (s) => s.replace(/<[^>]*>/g, ' ').replace(/<[^>]*$/, ' ').replace(/^[^<]*>/, ' ')
    .replace(/\u0001(\d+)\u0002/g, (m, i) => vals[+i].value).replace(/\s+/g, ' ');
  const claims = [];
  vals.forEach((v, i) => {
    if (v.quiet) return;
    const pos = marked.indexOf(`\u0001${i}\u0002`);
    const sec = secs.filter(([p]) => p < pos).pop();
    const before = text(marked.slice(Math.max(0, pos - 400), pos)).slice(-46).trimStart();
    const after = text(marked.slice(pos + String(i).length + 2, pos + 200)).slice(0, 24).trimEnd();
    claims.push({chapter: sec ? CHAPTERS[sec[1]] || sec[1] : '表紙', value: v.value, token: v.token, context: `${before}【${v.value}】${after}`});
  });
  return {html: out, claims};
}

function claimsMarkdown(claims) {
  const esc = (s) => String(s).replace(/\|/g, '｜');
  let md = '# 本文中の計算値\n\n';
  md += '> `npm run build` で自動生成。手で編集しない。性能を変えたら `git diff notes/claims.md` で、本文のどの記述の数値が変わったかを確認し、前後の判定（有利・不利など）を見直す。\n\n';
  md += '| 章 | 値 | 本文（【】が計算値） | トークン |\n|---|---|---|---|\n';
  for (const c of claims) md += `| ${c.chapter} | ${esc(c.value)} | ${esc(c.context)} | \`${esc(c.token)}\` |\n`;
  return md;
}

module.exports = {resolve, evalToken, claimsMarkdown};
