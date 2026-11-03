/* RONDO LAB のビルド。
   1) 生成表で templates/body.html の <!--@NAME--> を埋める
   2) 本文中の {{…}} トークンを計算値に置き換える（scripts/tokens.js）
   3) dist/draffia.html と notes/claims.md を書き出す */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const P = (...a) => path.join(ROOT, ...a);
const C = require('../src/core.js');
const {SETS} = require('../src/sets.js');
const CFG = require('../src/report.config.js');
const T = require('./tokens.js');
const E = C.E, JP = E.JP;

const fmtPct = (x) => x.toFixed(1);
function shortKO(ko) {
  if (!ko || ko.n === 0) return '効果なし';
  return ko.text.replace('確定', '確').replace('乱数', '乱').replace('発', '').replace('(', ' ').replace(')', '');
}
function koClass(ko) { if (!ko || ko.n !== 1) return ''; return ko.p >= 0.9999 ? 'k1' : 'kr'; }
function cell(r) {
  if (!r) return '<td class="num muted">—</td>';
  if (r.max === 0) return '<td class="num muted">無効</td>';
  return `<td class="num">${fmtPct(r.minPct)}–${fmtPct(r.maxPct)}%<span class="ko ${koClass(r.ko)}">${shortKO(r.ko)}</span></td>`;
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

/* 型（src/sets.js）から実数値と攻撃設定を作る */
const ST = Object.fromEntries(Object.entries(SETS).map(([k, s]) => [k, C.stats('draffia', s.nat, s.ev)]));
const atkOpts = (id, extra) => Object.assign({st: ST[id], skin: SETS[id].skin, item: SETS[id].item || '', tera: SETS[id].tera || null, atkStage: SETS[id].atkStage || 0, stellar: true}, extra || {});
const KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'], LETTER = {hp: 'H', atk: 'A', def: 'B', spa: 'C', spd: 'D', spe: 'S'};
const natJp = (id) => C.NAT[SETS[id].nat].jp;
const evStr = (id, keys) => KEYS.filter(k => SETS[id].ev[k] && (!keys || keys.includes(k))).map(k => LETTER[k] + SETS[id].ev[k]).join(' ') || '無振り';
const statLine = (id) => { const s = ST[id]; return `${s.hp}-${s.atk}-${s.def}-×-${s.spd}-${s.spe}`; };
const setSpe = (id) => SETS[id].speMul ? Math.floor(ST[id].spe * SETS[id].speMul) : ST[id].spe;
const skinBp = (mv) => E.pokeRound(C.DM[mv].bp * 4915 / 4096);
const typeChips = () => C.SP.draffia.t.map(t => `<span class="chip t-${t}">${JP[t]}</span>`).join(' ');
function tgt(key, extra) { const t = C.target(key); return Object.assign({sp: t.sp, st: t.st, final: t.final, defStage: t.defStage || 0, label: t.label}, extra || {}); }
const atk = (o) => C.drfAtk(o);
const MOVE_JP = {rondo: 'ロンド', doubleedge: 'すてみ', bodyslam: 'のしかかり', crunch: 'かみくだく', facade: 'からげんき', lastresort: 'とっておき', irontail: 'アイアンテール', trailblaze: 'くさわけ'};

/* ---------- radar ---------- */
function radar() {
  const labels = CFG.radar.map(r => r[0]), S = CFG.radar.map(r => r[1]), D = CFG.radar.map(r => r[2]);
  const n = labels.length, cx = 180, cy = 160, R = 108;
  const pt = (i, v) => { const a = -Math.PI / 2 + i * Math.PI * 2 / n; return [cx + Math.cos(a) * R * v / 5, cy + Math.sin(a) * R * v / 5]; };
  const aria = `性能プロファイルのレーダーチャート。シングルは${labels.map((l, i) => l + S[i]).join('、')}。ダブルは${labels.map((l, i) => l + D[i]).join('、')}。`;
  let s = `<svg viewBox="0 0 360 320" role="img" aria-label="${aria}">`;
  for (let k = 1; k <= 5; k++) s += `<polygon class="ring" points="${labels.map((_, i) => pt(i, k).map(x => x.toFixed(1)).join(',')).join(' ')}"/>`;
  labels.forEach((_, i) => { const [x, y] = pt(i, 5); s += `<line class="ax" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`; });
  s += `<polygon class="ps" points="${S.map((v, i) => pt(i, v).map(x => x.toFixed(1)).join(',')).join(' ')}"/>`;
  s += `<polygon class="pd" points="${D.map((v, i) => pt(i, v).map(x => x.toFixed(1)).join(',')).join(' ')}"/>`;
  labels.forEach((l, i) => {
    const a = -Math.PI / 2 + i * Math.PI * 2 / n, x = cx + Math.cos(a) * (R + 20), y = cy + Math.sin(a) * (R + 20);
    const anchor = Math.abs(Math.cos(a)) < 0.2 ? 'middle' : (Math.cos(a) > 0 ? 'start' : 'end');
    const dy = Math.sin(a) < -0.5 ? -4 : (Math.sin(a) > 0.5 ? 12 : 4);
    s += `<text class="lbl" x="${x.toFixed(1)}" y="${(y + dy).toFixed(1)}" text-anchor="${anchor}">${l}</text>`;
    s += `<text class="val" x="${x.toFixed(1)}" y="${(y + dy + 13).toFixed(1)}" text-anchor="${anchor}">S${S[i]} / D${D[i]}</text>`;
  });
  return s + '</svg>';
}
function radarTable() {
  let h = '<div class="scroll"><table class="tbl compact"><thead><tr><th>項目</th><th class="num">シングル</th><th class="num">ダブル</th><th>根拠</th></tr></thead><tbody>';
  for (const [l, s, d, why] of CFG.radar) h += `<tr><th class="rowh">${l}</th><td class="num">${s.toFixed(1)}</td><td class="num">${d.toFixed(1)}</td><td>${why}</td></tr>`;
  return h + '</tbody></table></div>';
}

/* ---------- stat bars ---------- */
function statBars() {
  const base = C.SP.draffia.b, names = ['HP', '攻撃', '防御', '特攻', '特防', '素早さ'];
  const keys = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
  const lo = C.stats('draffia', 'hardy', {}), hi = C.stats('draffia', 'hardy', {hp: 252, atk: 252, def: 252, spa: 252, spd: 252, spe: 252});
  const top2 = [...base.slice(1)].sort((a, b) => b - a).slice(0, 2);
  let s = '<div class="bars">';
  keys.forEach((k, i) => {
    const top = k === 'hp' ? hi.hp : Math.floor(hi[k] * 1.1);
    const strong = k !== 'hp' && top2.includes(base[i]);
    s += `<div class="bar"><span class="k">${names[i]}</span><span class="b">${base[i]}</span><span class="track"><span class="fill${strong ? ' hi' : ''}" style="width:${Math.min(100, base[i] / 150 * 100).toFixed(1)}%"></span></span><span class="r">${lo[k]}–${top}</span></div>`;
  });
  s += `<div class="scale"><span></span><span></span><span class="ticks"><span>0</span><span>50</span><span>100</span><span>150</span></span><span></span></div>`;
  s += `<div class="total"><span>合計</span><span>${base.reduce((x, y) => x + y, 0)}</span></div></div>`;
  return s;
}

/* ---------- type chart (defending) ---------- */
function defChart() {
  const t = C.SP.draffia.t;
  const rows = [[4, '×4', 'v-bad'], [2, '×2', 'v-bad'], [0.5, '×½', 'v-good'], [0.25, '×¼', 'v-good'], [0, '×0', 'v-good']];
  return rows.map(([m, lab, cls]) => {
    const ts = E.TYPES.filter(a => E.eff(a, t) === m);
    return ts.length ? `<div class="chips"><span class="v ${cls}">${lab}</span>${ts.map(a => `<span class="chip t-${a}">${JP[a]}</span>`).join('')}</div>` : '';
  }).filter(Boolean).join('\n    ');
}

/* ---------- skin power table ---------- */
function skinTable() {
  const own = C.SP.draffia.t, sk = C.SP.draffia.skin, stab = own.includes(sk) ? 1.5 : 1, tera = own.includes(sk) ? 2 : 1.5;
  const n = (x) => Number.isInteger(x) ? String(x) : x.toFixed(1);
  const sv = (bp) => E.pokeRound(bp * 4915 / 4096);
  const rows = [
    ['doubleedge', '与ダメージの1/3反動'], ['bodyslam', 'まひ30%。反動なし'], [['facade', 'facadest'], '右は状態異常時。やけどの攻撃半減を受けない'],
    ['lastresort', '他の技をすべて使った後のみ'], ['quickattack', '優先度+1。先制技なのでテラスの威力60補正は受けない'],
  ];
  let h = `<div class="scroll" style="margin-top:16px"><table class="tbl"><thead><tr><th>技</th><th class="num">元の威力</th><th class="num">スキン後</th><th class="num">一致込み</th><th class="num">テラス${JP[sk]}</th><th>備考</th></tr></thead><tbody>`;
  for (const [mv, note] of rows) {
    const ms = Array.isArray(mv) ? mv : [mv], f = (fn) => ms.map(m => n(fn(C.DM[m].bp))).join(' / ');
    h += `<tr><th class="rowh">${C.DM[ms[0]].jp}</th><td class="num">${f(b => b)}</td><td class="num">${f(sv)}</td><td class="num">${f(b => sv(b) * stab)}</td><td class="num">${f(b => sv(b) * tera)}</td><td>${note}</td></tr>`;
  }
  const r = C.DM.rondo.bp, rs = C.SP.draffia.t.includes(C.DM.rondo.type) ? [1.5, 2] : [1, 1.5];
  h += `<tr><th class="rowh">${C.DM.rondo.jp}</th><td class="num">—</td><td class="num">${r}</td><td class="num">${n(r * rs[0])}</td><td class="num">${n(r * rs[1])}</td><td>優先度+${C.DM.rondo.pri}。妖・氷に抜群（比較用）</td></tr>`;
  return h + '</tbody></table></div>';
}

/* ---------- singles offense ---------- */
function singlesAtk() {
  const cols = [
    ['陽気ハチマキ<br><span class="muted">S-1</span>', 'S1'],
    ['意地ハチマキ<br><span class="muted">S-1 変形</span>', 'S1A'],
    ['陽気・持ち物なし<br><span class="muted">S-2 スカーフ</span>', 'S2'],
    ['陽気珠 +1 テラス竜<br><span class="muted">S-3 竜舞後</span>', 'S3'],
  ];
  const groups = [
    [`ドラゴニックロンド（優先度+${C.DM.rondo.pri}）`, 'rondo', [
      ['flutter_cs'], ['flutter_cs', {tera: 'Normal'}, 'テラスノーマル'], ['chienpao_as', null, 'タスキ除く'], ['miraidon_cs'], ['miraidon_cs', {tera: 'Fairy'}, 'テラスフェアリー'],
      ['koraidon_as'], ['koraidon_as', {tera: 'Fire'}, 'テラス炎'], ['calyrexs_cs', {tera: 'Fairy'}, 'テラスフェアリー'], ['grimmsnarl_hb'], ['mimikyu_as'], ['zacianc_as'], ['calyrexi_ha']]],
    [`すてみタックル（スキン・威力${skinBp('doubleedge')}）`, 'doubleedge', [
      ['koraidon_as'], ['miraidon_h'], ['urshifur_as'], ['kyogre_cs'], ['calyrexs_cs'], ['dragonite_h'], ['ogerpon_as'], ['glimmora_cs', null, 'タスキ除く'],
      ['ursalunab_h'], ['landot_hb', null, 'いかく後', {atkDelta: -1}], ['hooh_hb'], ['gliscor_hb'], ['garganacl_hb'], ['tinglu_hb'], ['dondozo_hb', null, '竜舞後列はてんねんで±0', {unaware: true}]]],
    ['かみくだく', 'crunch', [['calyrexs_cs'], ['gholdengo_h'], ['lunala_hb']]],
  ];
  let h = '<div class="scroll"><table class="tbl"><thead><tr><th>技 → 相手</th>' + cols.map(c => `<th class="num">${c[0]}</th>`).join('') + '</tr></thead><tbody>';
  for (const [gname, mv, rows] of groups) {
    h += `<tr class="grp"><td colspan="${cols.length + 1}">${gname}</td></tr>`;
    for (const [k, ex, note, mod] of rows) {
      const t = tgt(k, ex);
      h += `<tr><th class="rowh" style="white-space:normal">${esc(t.label)}${note ? `<br><span class="muted xs">${note}</span>` : ''}</th>`;
      for (const [, id] of cols) {
        const o = atkOpts(id, {move: mv, target: t});
        if (mod && mod.atkDelta) o.atkStage += mod.atkDelta;
        if (mod && mod.unaware) o.atkStage = 0;
        h += cell(atk(o));
      }
      h += '</tr>';
    }
  }
  return h + '</tbody></table></div><p class="cap" style="margin-top:8px"><b>表2-3</b>　割合は相手の最大HPに対するダメージ。緑は確定1発、黄は乱数1発。カイリューはマルチスケイル込み。</p>';
}

/* ---------- singles defense ---------- */
function singlesDef() {
  const rows = ['pao_icicle_lo', 'pao_icicle_none', 'pao_shard_lo', 'fm_moon_timid', 'fm_moon_specs', 'kor_outrage', 'kor_scale', 'kor_cc', 'kor_flare', 'mir_draco', 'mir_drift_specs',
    'cs_barrage', 'cs_barrage_specs', 'zac_pr', 'zac_bb', 'ursr_cc_band', 'ursr_ss_band', 'tinglu_eq', 'lando_eq', 'hooh_bb', 'dnite_es', 'ursb_bm', 'kyo_icebeam', 'kyo_spout', 'mimi_pr', 'glim_gem'];
  const s1 = ST.S1, s4 = ST.S4, bulk = ['hp', 'def', 'spd'];
  let h = `<div class="scroll"><table class="tbl"><thead><tr><th>相手の攻撃</th><th class="num">S-1 ${natJp('S1')} ${evStr('S1', bulk)}<br><span class="muted">${s1.hp}-${s1.def}-${s1.spd}</span></th><th class="num">S-4 ${natJp('S4')} ${evStr('S4', bulk)}<br><span class="muted">${s4.hp}-${s4.def}-${s4.spd}・物理はいかく込み</span></th></tr></thead><tbody>`;
  for (const k of rows) {
    const p = C.attack(k);
    const a = C.vsDrf(p, {st: s1});
    const b = C.vsDrf(p, {st: s4, intim: !!SETS.S4.intim});
    h += `<tr><th class="rowh" style="white-space:normal">${esc(p.label)}</th>${cell(a)}${cell(b)}</tr>`;
  }
  return h + '</tbody></table></div><p class="cap" style="margin-top:8px"><b>表2-4</b>　緑は確定で落ちる、黄は乱数で落ちる。それ以外は1発耐え。急所技（すいりゅうれんだ）はいかくを無視する。</p>';
}

/* ---------- dragon cheer ---------- */
function cheer() {
  const mir = C.stats('miraidon', 'modest', {hp: 4, spa: 252, spe: 252});
  const kor = C.stats('koraidon', 'adamant', {hp: 4, atk: 252, spe: 252});
  const pc = (r, hp) => { const s = E.summarize(r, hp); return `<td class="num">${fmtPct(s.minPct)}–${fmtPct(s.maxPct)}%<span class="ko ${koClass(s.ko)}">${shortKO(s.ko)}</span></td>`; };
  const tg = ['incin_hd', 'calyrexs_cs', 'rilla_ha', 'amoong_hb', 'calyrexi_ha', 'ironhands_ha', 'farigiraf_hb', 'kingambit_ha', 'zamazenta_hb'];
  let h = '<div class="scroll"><table class="tbl"><thead><tr><th>ミライドン りゅうせいぐん →</th><th class="num">メガネ<br><span class="muted">1発目</span></th><th class="num">メガネ<br><span class="muted">2発目（C-2）</span></th><th class="num">レンズ＋エール<br><span class="muted">1発目（急所）</span></th><th class="num">レンズ＋エール<br><span class="muted">2発目（急所）</span></th></tr></thead><tbody>';
  for (const k of tg) {
    const t = C.target(k), ef = E.eff('Dragon', C.SP[t.sp].t);
    const base = {bp: 130, atk: mir.spa, def: t.st.spd, stab: 6144, eff: ef, defStage: 0};
    const a = E.rolls(Object.assign({}, base, {atkMods: [6144, 5461]}));
    const b = E.rolls(Object.assign({}, base, {atkMods: [6144, 5461], atkStage: -2}));
    const c = E.rolls(Object.assign({}, base, {atkMods: [5461], crit: true}));
    const d = E.rolls(Object.assign({}, base, {atkMods: [5461], crit: true, atkStage: -2}));
    h += `<tr><th class="rowh" style="white-space:normal">${esc(t.label)}</th>${pc(a, t.st.hp)}${pc(b, t.st.hp)}${pc(c, t.st.hp)}${pc(d, t.st.hp)}</tr>`;
  }
  h += '</tbody></table></div><p class="cap" style="margin-top:8px"><b>表3-1</b>　ミライドン控えめC252、エレキフィールド下（ハドロンエンジン）。ザマゼンタ(王)は防御+1だが特防側なので影響なし。</p>';
  const tk = ['incin_hb', 'zacianc_as', 'urshifur_as', 'miraidon_h', 'calyrexi_ha', 'farigiraf_hb'];
  h += '<div class="scroll" style="margin-top:16px"><table class="tbl"><thead><tr><th>コライドン アクセルブレイク →</th><th class="num">いかく後（-1）<br><span class="muted">通常</span></th><th class="num">いかく後（-1）<br><span class="muted">レンズ＋エールで急所</span></th></tr></thead><tbody>';
  for (const k of tk) {
    const t = C.target(k), ef = E.eff('Fighting', C.SP[t.sp].t);
    const base = {bp: 100, bpMods: ef > 1 ? [5461] : [], atk: kor.atk, atkStage: -1, atkMods: [5461], def: t.st.def, defStage: t.defStage || 0, stab: 6144, eff: ef};
    h += `<tr><th class="rowh" style="white-space:normal">${esc(t.label)}</th>${pc(E.rolls(base), t.st.hp)}${pc(E.rolls(Object.assign({}, base, {crit: true})), t.st.hp)}</tr>`;
  }
  h += '</tbody></table></div><p class="cap" style="margin-top:8px"><b>表3-2</b>　コライドン意地A252、晴れ（ひひいろのこどう）。抜群時のアクセルブレイク補正込み。急所はいかくの-1を無視する。</p>';
  h += '<p class="prose small" style="margin-top:12px">1発目はメガネとほぼ同じ火力で、2発目以降はメガネ型の約2倍になる。拘りがないため、まもるとイナズマドライブを打ち分けられる。タケルライコのりゅうせいぐんも同じ理屈で毎ターン急所になり、急所判定の高い技を持つオリジンパルキア（あくうせつだん）はエールだけで確定急所になる。</p>';
  return h;
}

/* ---------- speed ---------- */
const SPEED_LIST = [
  ['黒バドレックス', 'calyrexs', 'timid', 252], ['ザシアン(王)', 'zacianc', 'jolly', 252], ['コライドン', 'koraidon', 'jolly', 252], ['ミライドン', 'miraidon', 'timid', 252],
  ['ハバタクカミ', 'fluttermane', 'timid', 252], ['パオジアン', 'chienpao', 'jolly', 252], ['ムゲンダイナ', 'eternatus', 'timid', 252], ['ザマゼンタ(王)', 'zamazentac', 'jolly', 252],
  ['エルフーン', 'whimsicott', 'timid', 252], ['トルネロス', 'tornadus', 'timid', 252], ['オーガポン', 'ogerpon', 'jolly', 252], ['化身ランドロス', 'landoi', 'timid', 252],
  ['イーユイ', 'chiyu', 'timid', 252], ['連撃ウーラオス', 'urshifur', 'jolly', 252], ['ルナアーラ', 'lunala', 'timid', 252], ['ミミッキュ', 'mimikyu', 'jolly', 252],
  ['グライオン', 'gliscor', 'jolly', 252], ['霊獣ランドロス', 'landot', 'jolly', 252], ['カイオーガ', 'kyogre', 'timid', 252], ['ホウオウ', 'hooh', 'jolly', 252],
  ['キラフロル', 'glimmora', 'timid', 252], ['ゴリランダー', 'rillaboom', 'jolly', 252], ['カイリュー', 'dragonite', 'jolly', 252], ['タケルライコ', 'ragingbolt', 'timid', 252],
  ['ガオガエン', 'incineroar', 'hardy', 252], ['イエッサン♀（最遅）', 'indeedeef', 'sassy', 0, 0], ['リキキリン（最遅）', 'farigiraf', 'sassy', 0, 0],
  ['白バドレックス（最遅）', 'calyrexi', 'brave', 0, 0], ['モロバレル（最遅）', 'amoonguss', 'sassy', 0, 0]
].map(([n, sp, nat, ev, iv]) => [n, C.stats(sp, nat, {spe: ev}, iv === 0 ? {spe: 0} : {}).spe]).sort((a, b) => b[1] - a[1]);
function speedRows() {
  const me = C.stats('draffia', 'hardy', {}).spe;
  return '<div class="speed" id="speedChart">' + SPEED_LIST.map(([n, s]) =>
    `<div class="sp-row" data-spe="${s}"><span class="nm">${n}</span><span class="tr"><span class="fl" style="width:${(s / 240 * 100).toFixed(1)}%"></span><span class="mark" style="left:calc(${(me / 240 * 100).toFixed(1)}% - 1px)"></span></span><span class="v2">${s}</span></div>`).join('') + '</div>';
}
function speedTable() {
  const list = SPEED_LIST.concat([['ニンフィア', C.stats('sylveon', 'hardy', {spe: 252}).spe]]);
  const jolly = C.stats('draffia', 'jolly', {spe: 252}).spe, neutral = C.stats('draffia', 'hardy', {spe: 252}).spe, none = C.stats('draffia', 'hardy', {}).spe;
  const rows = [[Math.floor(jolly * 1.5), '最速スカーフ ／ 最速竜舞+1'], [jolly, '最速'], [neutral, '準速'], [none, '無振り']];
  const grp = (arr) => { const m = new Map(); for (const [n, s] of arr) m.set(s, (m.get(s) || []).concat(n)); return [...m.entries()]; };
  let h = '<div class="scroll"><table class="tbl compact spd"><thead><tr><th class="num">実数値</th><th>調整</th><th>抜ける相手（直下の3段）</th><th>同速・抜かれる相手</th></tr></thead><tbody>';
  for (const [s, lab] of rows) {
    const glab = (v, ns) => `${ns.join('・')}（${v}）`.replace(/（最遅）（(\d+)）/g, '（最遅 $1）');
    const below = grp(list.filter(([, v]) => v < s).sort((a, b) => b[1] - a[1])).slice(0, 3).map(([v, ns]) => glab(v, ns)).join('、');
    const tie = list.filter(([, v]) => v === s).map(([n]) => n);
    const above = grp(list.filter(([, v]) => v > s).sort((a, b) => a[1] - b[1])).slice(0, 1).map(([v, ns]) => `${glab(v, ns)}に抜かれる`);
    const side = [tie.length ? `${tie.join('・')}と同速` : '', ...above].filter(Boolean).join('。') || '—';
    h += `<tr><td class="num">${s}</td><td>${lab}</td><td>${below || '—'}</td><td>${side}</td></tr>`;
  }
  return h + '</tbody></table></div><p class="cap" style="margin-top:8px"><b>表4-1</b>　相手は図3-1の一覧（一般的な最速・準速、トリル型は最遅）にニンフィア（無補正S252）を加えたもの。スカーフ等の補正は含まない。</p>';
}

/* ---------- tera matrix ---------- */
function teraMatrix() {
  const own = C.SP.draffia.t;
  const rows = [[own, own.map(t => JP[t]).join('/') + '（元）'], ['Steel', 'はがね'], ['Water', 'みず'], ['Fairy', 'フェアリー'], ['Fire', 'ほのお'], ['Ghost', 'ゴースト'], ['Normal', 'ノーマル']];
  const cols = [['Ice', 'ランス・つらら'], ['Fairy', 'ムーンフォース'], ['Dragon', 'りゅうせいぐん'], ['Ghost', 'アストラルビット'], ['Fighting', 'インファイト'], ['Water', 'しおふき'],
    ['Electric', 'イナズマドライブ'], ['Fire', 'フレアドライブ'], ['Dark', 'はたきおとす'], ['Normal', 'ねこだまし'], ['Ground', 'じしん'], ['Steel', 'きょじゅうざん']];
  const cls = (v) => v === 0 ? 'x0' : v === 0.25 ? 'x025' : v === 0.5 ? 'x05' : v === 1 ? 'x1' : v === 2 ? 'x2' : 'x4';
  const lab = (v) => v === 0 ? '0' : v === 0.25 ? '¼' : v === 0.5 ? '½' : String(v);
  let h = '<div class="scroll"><table class="tbl mx compact"><thead><tr><th>テラス</th>' + cols.map(([t, m]) => `<th class="num"><span class="chip t-${t}">${JP[t]}</span><br><span class="muted" style="font-weight:500">${m}</span></th>`).join('') + '<th class="num">弱点数</th></tr></thead><tbody>';
  for (const [t, n] of rows) {
    let weak = 0;
    h += `<tr><th class="rowh">${n}</th>` + cols.map(([a]) => { const v = E.eff(a, Array.isArray(t) ? t : [t]); if (v > 1) weak++; return `<td class="num ${cls(v)}">${lab(v)}</td>`; }).join('') + `<td class="num">${weak}</td></tr>`;
  }
  return h + '</tbody></table></div><p class="cap" style="margin-top:8px"><b>表3-3</b>　レギュIで頻出する攻撃技のタイプに対する被ダメージ倍率。弱点数は表の12技のうち抜群になる数。</p>';
}

/* ---------- training ---------- */
function li(label, r) {
  if (!r) return '';
  return `<li><span>${label}</span><span class="mono nowrap">${r.max === 0 ? '無効' : `${fmtPct(r.minPct)}–${fmtPct(r.maxPct)}%　${r.ko.text}`}</span></li>`;
}
function trainCard(no, code, name, id, extraKv, intent, lists) {
  const kv = [['性格', natJp(id)], ['努力値', evStr(id)], ['実数値', statLine(id)]].concat(extraKv);
  let h = `<h3 class="sub"><span class="n">${no}</span>${code}　${name}</h3><div class="cols"><div class="panel stack" style="gap:12px"><dl class="kv">`;
  for (const [k, v] of kv) h += `<dt>${k}</dt><dd${/実数値|努力値/.test(k) ? ' class="mono"' : ''}>${v}</dd>`;
  h += `</dl><div class="prose small">${intent}</div></div><div class="panel stack" style="gap:14px">`;
  for (const [title, items] of lists) h += `<div><h4 style="margin:0 0 6px">${title}</h4><ul class="calclist">${items.join('')}</ul></div>`;
  return h + '</div></div>';
}
function training() {
  const L = (id, mv, k, ex, more, note) => li(`${MOVE_JP[mv]} → ${tgt(k).label}${note ? '・' + note : ''}`, atk(atkOpts(id, Object.assign({move: mv, target: tgt(k, ex)}, more || {}))));
  const D = (id, k, opt, note) => { const p = C.attack(k); return li(`${p.label}${note ? '（' + note + '）' : ''}`, C.vsDrf(p, Object.assign({st: ST[id], intim: !!SETS[id].intim}, opt || {}))); };
  let h = '';
  h += trainCard('4.1', 'S-1', '竜皮ハチマキ', 'S1', [['持ち物', 'こだわりハチマキ']],
    '<p>攻撃と素早さに全振り。S{{stat S1 spe}}は、最速の{{spvs S1 urshifur/jolly chiyu/timid landoi/timid ogerpon/jolly tornadus/timid}}。</p><p>意地にすると、コライドン（H4）へのロンドは{{dmg S1 rondo koraidon_as ko}}から{{dmg S1A rondo koraidon_as ko}}になる。代わりにS{{stat S1A spe}}となり、最速の{{spvs S1A urshifur/jolly lunala/timid}}。上位のウーラオスに先手を取れる陽気を基本とした。</p>',
    [['与ダメージ（陽気ハチマキ）', [
      L('S1', 'rondo', 'flutter_cs'), L('S1', 'rondo', 'flutter_cs', {tera: 'Normal'}, null, 'テラスノーマル'), L('S1', 'rondo', 'chienpao_as'),
      L('S1', 'rondo', 'miraidon_cs'), L('S1', 'rondo', 'koraidon_as'), L('S1', 'doubleedge', 'urshifur_as'),
      L('S1', 'doubleedge', 'kyogre_cs'), L('S1', 'doubleedge', 'calyrexs_cs'), L('S1', 'crunch', 'calyrexs_cs'), L('S1', 'doubleedge', 'hooh_hb')]],
     ['意地ハチマキにした場合', [L('S1A', 'rondo', 'koraidon_as'), L('S1A', 'rondo', 'miraidon_h'), L('S1A', 'doubleedge', 'tinglu_hb')]],
     [`被ダメージ（${evStr('S1', ['hp', 'def', 'spd'])}）`, [D('S1', 'kor_outrage'), D('S1', 'cs_barrage'), D('S1', 'fm_moon_timid'), D('S1', 'pao_shard_lo'), D('S1', 'ursr_cc_band')]]]);
  h += trainCard('4.2', 'S-2', '竜皮スカーフ', 'S2', [['持ち物', `こだわりスカーフ（S${setSpe('S2')}）`]],
    '<p>S{{setspe S2}}（{{stat S2 spe}}×1.5）は、最速の{{spvs S2 calyrexs/timid zacianc/jolly koraidon/jolly}}。素早さを削る理由がないため、こちらも陽気AS。</p><p>持ち物で火力が上がらないぶん、ロンドは削り役に回り、すてみとかみくだくで倒す。</p>',
    [['与ダメージ（陽気・持ち物補正なし）', [L('S2', 'crunch', 'calyrexs_cs'), L('S2', 'doubleedge', 'koraidon_as'), L('S2', 'doubleedge', 'miraidon_cs'), L('S2', 'rondo', 'flutter_cs'), L('S2', 'rondo', 'chienpao_as'), L('S2', 'doubleedge', 'chienpao_as'), L('S2', 'doubleedge', 'kyogre_cs'), L('S2', 'rondo', 'zacianc_as')]]]);
  h += trainCard('4.3', 'S-3', '竜舞アタッカー', 'S3', [['持ち物', 'いのちのたま'], ['テラス', 'ドラゴン']],
    '<p>1回積めばS{{setspe S3 +1}}で全抜きの準備が整う。火力の要は珠とテラス竜で、すてみは実質威力{{bp doubleedge skin x2}}×1.3倍になる。</p><p>ヘイラッシャとドオーのてんねんには積みが通らない（下表のヘイラッシャは積みなしの値）。</p>',
    [['与ダメージ（+1・珠・テラス竜）', [
      L('S3', 'doubleedge', 'hooh_hb'), L('S3', 'doubleedge', 'gliscor_hb'), L('S3', 'doubleedge', 'garganacl_hb'),
      L('S3', 'doubleedge', 'tinglu_hb'), L('S3', 'doubleedge', 'kingambit_ha'), L('S3', 'doubleedge', 'dondozo_hb', null, {atkStage: 0}, 'てんねん'),
      L('S3', 'rondo', 'zacianc_as'), L('S3', 'crunch', 'gholdengo_h')]]]);
  h += trainCard('4.4', 'S-4', 'いかく起点作り', 'S4', [['持ち物', 'たべのこし'], ['回復', `ねがいごと ${Math.floor(ST.S4.hp / 2)}`]],
    '<p>HB特化。いかくと合わせて物理禁止級の主力技を1発耐え、あくびとロンドで退く。特防は無振りなので、特殊アタッカーの前には出さない。</p><p>Sは無振り{{stat S4 spe}}で、最速の{{spvs S4 zacianc/jolly koraidon/jolly}}。ロンドで後続のすばやさを上げる条件（相手より遅い）を満たしやすい。</p>',
    [['被ダメージ（物理はいかく込み）', [D('S4', 'zac_pr'), D('S4', 'zac_bb'), D('S4', 'pao_icicle_lo'), D('S4', 'kor_outrage'), D('S4', 'kor_scale'),
      D('S4', 'kor_cc'), D('S4', 'ursr_cc_band'), D('S4', 'ursr_ss_band', null, '急所でいかく無視'), D('S4', 'lando_eq'), D('S4', 'hooh_bb')]],
     ['被ダメージ（特殊・参考）', [D('S4', 'cs_barrage'), D('S4', 'fm_moon_timid'), D('S4', 'kyo_icebeam')]]]);
  h += trainCard('4.5', 'D-1・D-2', 'いかくロンド／竜の加護', 'D1', [['持ち物', 'オボン／マント／ハバン／メンタルハーブ']],
    '<p>Bはいかく込みで白バドレックスのブリザードランス（全体）を耐えるライン（{{hit D1 ci_lance_d surv}}）、残りをDに回した。ダブルの環境は特殊の全体技が多く、いかくで補えない側を厚くしている。</p><p>パオジアンの珠つららおとしはいかく込みでも{{hit D1 pao_icicle_lo full}}。パオジアンにはテラスはがね・みずで対応する。</p>',
    [['被ダメージ（特殊）', [D('D1', 'fm_moon_timid'), D('D1', 'fm_gleam_d'), D('D1', 'mir_gleam_specs_d'), D('D1', 'cs_barrage_specs_d'), D('D1', 'kyo_spout_d'), D('D1', 'kyo_icebeam'),
      D('D1', 'mir_draco', {haban: true}, 'ハバンのみ'), D('D1', 'bolt_draco_d', {haban: true}, 'ハバンのみ'), D('D1', 'lunala_mg_d')]],
     ['被ダメージ（物理・いかく込み）', [D('D1', 'ci_lance_d'), D('D1', 'zama_bp_d', null, 'いかく無効'), D('D1', 'ursr_cc_band'), D('D1', 'kor_cc'),
      D('D1', 'incin_knock_d'), D('D1', 'ursaluna_facade_d'), D('D1', 'pao_icicle_lo')]]]);
  const hh = (mv, k) => L('D3', mv, k, null, {hh: true}, 'てだすけ');
  h += trainCard('4.6', 'D-3', '竜皮アタッカー', 'D3', [['持ち物', 'クリアチャーム']],
    '<p>クリアチャームは火力が上がらない代わりに、ガオガエンとランドロスのいかくを無効化する。いかく1回で火力は2/3になるため、ダブルでは珠より安定する。</p><p>てだすけを受けたロンドは、{{kolist D3 rondo miraidon_cs whims_h koraidon_as hh}}。</p>',
    [['与ダメージ（陽気・補正なし）', [L('D3', 'rondo', 'flutter_cs'), L('D3', 'rondo', 'chienpao_as'), L('D3', 'rondo', 'whims_h'), L('D3', 'rondo', 'grimmsnarl_hb'), L('D3', 'doubleedge', 'incin_hb'), L('D3', 'doubleedge', 'incin_hb', null, {atkStage: -1}, 'いかく後'),
      L('D3', 'doubleedge', 'rilla_ha'), L('D3', 'doubleedge', 'urshifur_as'), L('D3', 'doubleedge', 'tornadus_h'), L('D3', 'doubleedge', 'amoong_hb'), L('D3', 'crunch', 'calyrexs_cs'), L('D3', 'crunch', 'lunala_hb')]],
     ['てだすけ込み', [hh('rondo', 'miraidon_cs'), hh('rondo', 'koraidon_as'), hh('rondo', 'whims_h'), hh('rondo', 'bolt_h'), hh('rondo', 'calyrexi_ha')]]]);
  return h;
}

/* ---------- experiments ---------- */
function expCat() {
  const J = ST.AS, A = ST.S1A;
  let h = `<div class="scroll"><table class="tbl compact"><thead><tr><th class="num">攻撃ランク</th><th class="num">陽気（A${J.atk} / C${J.spa}）</th><th class="num">意地（A${A.atk} / C${A.spa}）</th></tr></thead><tbody>`;
  for (let s = 0; s >= -6; s--) {
    const f = (st) => { const a = E.boost(st.atk, s); const phys = a > st.spa; return `<td class="num ${phys ? '' : 'x2'}">${phys ? '物理' : '特殊'}（${a}／${st.spa}）</td>`; };
    h += `<tr><td class="num">${s}</td>${f(J)}${f(A)}</tr>`;
  }
  return h + '</tbody></table></div><p class="prose small" style="margin-top:10px">いかくやワイドブレイカーで攻撃が{{rondoflip AS}}まで下がると、陽気のロンドは特攻で計算される（同値は特殊）。特殊になれば攻撃ランクの低下は関係なくなるが、無振りの特攻{{rondoflip AS spa}}では打点にならない。意地は{{rondoflip S1A}}で切り替わる。性能に影響する場面はほぼなく、仕様の確認として記録する。</p>';
}
function expLR() {
  const cols = [['すてみ +1', 'doubleedge', 1], ['とっておき +1', 'lastresort', 1], ['すてみ ±0', 'doubleedge', 0], ['とっておき ±0', 'lastresort', 0]];
  const tg = ['tinglu_hb', 'dondozo_hb', 'hooh_hb', 'garganacl_hb', 'gliscor_hb', 'kingambit_ha', 'incin_hb'];
  let h = '<div class="scroll"><table class="tbl"><thead><tr><th>相手（陽気・珠・テラス竜）</th>' + cols.map(c => `<th class="num">${c[0]}</th>`).join('') + '</tr></thead><tbody>';
  for (const k of tg) {
    const t = tgt(k);
    h += `<tr><th class="rowh" style="white-space:normal">${esc(t.label)}</th>` + cols.map(([, mv, s]) => cell(atk(atkOpts('S3', {atkStage: k === 'dondozo_hb' ? 0 : s, move: mv, target: t})))).join('') + '</tr>';
  }
  return h + '</tbody></table></div><p class="prose small" style="margin-top:10px">スキンのとっておきは威力{{bp lastresort skin}}で、すてみ（{{bp doubleedge skin}}）より約17%強く反動もない。ただし覚えている他の技をすべて1回ずつ使うまで撃てない。「りゅうのまい／とっておき」の2技構成なら2ターン目から撃てるが、先制ロンドを失う。テラス竜+1のとっておきはディンルー（HB特化）に{{dmg S3 lastresort tinglu_hb full}}。ヘイラッシャ行はてんねんのため+1列も±0で計算。</p>';
}
function expFacade() {
  const tg = ['koraidon_as', 'miraidon_cs', 'chienpao_as', 'urshifur_as', 'incin_hd', 'rilla_ha', 'amoong_hb', 'flutter_cs'];
  let h = `<div class="scroll"><table class="tbl"><thead><tr><th>相手（陽気A252）</th><th class="num">からげんき<br><span class="muted">状態異常・${skinBp('facadest')}</span></th><th class="num">すてみ<br><span class="muted">状態異常なし</span></th><th class="num">ロンド<br><span class="muted">やけど</span></th><th class="num">ロンド<br><span class="muted">もうどく</span></th></tr></thead><tbody>`;
  for (const k of tg) {
    const t = tgt(k);
    h += `<tr><th class="rowh" style="white-space:normal">${esc(t.label)}</th>${cell(atk(atkOpts('AS', {move: 'facade', statused: true, burn: true, target: t})))}${cell(atk(atkOpts('AS', {move: 'doubleedge', target: t})))}${cell(atk(atkOpts('AS', {move: 'rondo', burn: true, target: t})))}${cell(atk(atkOpts('AS', {move: 'rondo', target: t})))}</tr>`;
  }
  return h + '</tbody></table></div><p class="prose small" style="margin-top:10px">からげんきはやけどでも威力が落ちず、スキンで{{bp facadest skin}}になる。すてみより約17%強く反動もない。眠り・まひにならないため、ダブルのキノコのほうし（モロバレル・ドーブル）とあくびを無視できる。</p><p class="prose small" style="margin-top:6px">ただしかえんだまはロンドの威力も半減させ、ハバタクカミへのロンドは{{dmg AS rondo flutter_cs burn full}}まで落ちる。どくどくだまならロンドは落ちないが、毒のダメージが1/16、2/16、3/16と増えていく。ロンドを主力にするなら毒、すてみの代わりとして使い切るなら火傷が向く。</p>';
}
function expSyl() {
  const syl = C.stats('sylveon', 'modest', {hp: 4, spa: 252, spe: 252});
  const s0 = C.stats('sylveon', 'modest', {hp: 252, spa: 252}).spe, s1 = syl.spe, s2 = C.stats('sylveon', 'timid', {hp: 4, spa: 252, spe: 252}).spe;
  let h = '<div class="cols"><div class="scroll"><table class="tbl compact"><thead><tr><th>ニンフィアの配分</th><th class="num">素早さ</th><th class="num">ロンド後（+2）</th><th>抜ける相手</th></tr></thead><tbody>';
  const beat = (s) => { const b = SPEED_LIST.filter(([, v]) => v < s); return b.length === SPEED_LIST.length ? `${b[0][0]}（${b[0][1]}）を含む一覧のすべて` : b.length ? `${b[0][0]}（${b[0][1]}）まで` : '—'; };
  h += `<tr><td>無振り</td><td class="num">${s0}</td><td class="num">${E.boost(s0, 2)}</td><td>${beat(E.boost(s0, 2))}</td></tr>`;
  h += `<tr><td>無補正S252</td><td class="num">${s1}</td><td class="num">${E.boost(s1, 2)}</td><td>${beat(E.boost(s1, 2))}</td></tr>`;
  h += `<tr><td>おくびょうS252</td><td class="num">${s2}</td><td class="num">${E.boost(s2, 2)}</td><td>${beat(E.boost(s2, 2))}</td></tr>`;
  h += '</tbody></table></div>';
  h += '<div class="panel stack" style="gap:8px"><h4 style="margin:0">ロンドがブイズに渡す能力上昇</h4><ul class="points small">' +
    '<li><b>スキン版</b>：攻撃が当たるたびに、隣のイーブイ系のA・C・S+2。優先度+' + C.DM.rondo.pri + 'で先に動くため、同じターンの味方の技から乗る。</li>' +
    '<li><b>いかく版</b>：隣のイーブイ系のA・C・S+2（変化技なので防がれにくい）。ドラフィアは退き、相手より遅ければ後から出るイーブイ系はA+1・C+1・S+2。</li>' +
    '<li><b>シングル</b>：隣がいないため、いかく版で後から出るイーブイ系のA+1・C+1・S+2だけが残る。</li></ul></div></div>';
  const tg = ['koraidon_as', 'urshifur_as', 'chienpao_as', 'miraidon_cs', 'ironhands_ha', 'ogerpon_as', 'rilla_ha', 'tornadus_h', 'calyrexs_cs', 'farigiraf_hb', 'incin_hd', 'calyrexi_ha', 'kingambit_ha', 'zamazenta_hb', 'zacianc_as', 'gholdengo_h'];
  const cols = [['±0', 0, 'ロンドなし'], ['+1', 1, 'いかく版で後から着地'], ['+2', 2, 'ロンド1回'], ['+4', 4, 'ロンド2回']];
  const ko1 = {}; cols.forEach(([, st]) => { ko1[st] = []; });
  h += `<div class="scroll" style="margin-top:16px"><table class="tbl"><thead><tr><th>ハイパーボイス（全体）→<br><span class="muted">ニンフィア 控えめC252・持ち物なし</span></th>${cols.map(([l, , n]) => `<th class="num">C${l}<br><span class="muted">${n}</span></th>`).join('')}</tr></thead><tbody>`;
  for (const k of tg) {
    const t = C.target(k), ef = E.eff('Fairy', C.SP[t.sp].t);
    h += `<tr><th class="rowh" style="white-space:normal">${esc(t.label)}</th>`;
    for (const [, st] of cols) {
      const s = E.summarize(E.rolls({bp: 90, bpMods: [4915], atk: syl.spa, atkStage: st, def: t.st.spd, defStage: 0, stab: 6144, eff: ef, spread: true, finalMods: t.final || []}), t.st.hp);
      if (s.ko && s.ko.n === 1 && s.ko.p >= 0.9999) ko1[st].push(C.SP[t.sp].jp);
      h += `<td class="num">${fmtPct(s.minPct)}–${fmtPct(s.maxPct)}%<span class="ko ${koClass(s.ko)}">${shortKO(s.ko)}</span></td>`;
    }
    h += '</tr>';
  }
  const newly = ko1[2].filter(n => !ko1[0].includes(n));
  h += '</tbody></table></div><p class="cap" style="margin-top:8px"><b>表6-4</b>　フェアリースキン（威力×1.2）・タイプ一致・ダブルの全体技補正（×0.75）込み。「抜ける相手」は図3-1の一覧で、+2後の素早さより遅い最速の相手。</p>';
  h += `<p class="prose small" style="margin-top:10px">ロンド1回（+2）で、確定1発の相手に${newly.join('・')}が加わる。持ち物なしでもこの火力で、+2のすばやさ（無補正S252で${E.boost(s1, 2)}）は一覧のすべてを抜く。ロンド2回（+4）では${ko1[4].filter(n => !ko1[2].includes(n)).join('・') || '新たな確定1発はない'}${ko1[4].filter(n => !ko1[2].includes(n)).length ? 'も確定1発になる' : ''}。残る壁は鋼と炎（ガオガエン・ザマゼンタ・ザシアン・サーフゴー）で、ここはドラフィアのロンドも通りにくい。</p>`;
  h += '<p class="prose small" style="margin-top:6px">止め方は3つある。①ねこだましでドラフィアを怯ませる（おんみつマントで防げる）。②ロンドの対象をまもる・サイコフィールド・しっぽアーマーで防ぐ（いかく版なら止まらない）。③上がったニンフィアに、鋼・毒の打点やくろいきり・ほえるで対応する。v1ではS+2だけだったため「踊った回数を記録する構築」だったが、A・C+2が加わり、ニンフィアの隣に置く理由として十分な強さになった。</p>';
  return h;
}
function expES() {
  const dn = C.stats('dragonite', 'adamant', {atk: 252, spe: 252});
  const tg = ['flutter_cs', 'calyrexs_cs', 'miraidon_cs', 'koraidon_as', 'chienpao_as', 'calyrexi_ha', 'whims_h', 'grimmsnarl_hb', 'urshifur_as', 'kyogre_cs', 'ogerpon_as', 'incin_hb', 'zacianc_as', 'kingambit_ha'];
  const es = (t, stab) => { return E.summarize(E.rolls({bp: 80, atk: dn.atk, atkMods: [6144], def: t.st.def, defStage: t.defStage || 0, stab, eff: E.eff('Normal', C.SP[t.sp].t), finalMods: t.final || []}), t.st.hp); };
  let h = `<div class="scroll"><table class="tbl"><thead><tr><th>相手</th><th class="num">ロンド<br><span class="muted">S-1 陽気ハチマキ（A${ST.S1.atk}）</span></th><th class="num">しんそく<br><span class="muted">カイリュー 意地ハチマキ（A${dn.atk}）・テラスノーマル</span></th><th class="num">しんそく<br><span class="muted">同・テラスなし</span></th></tr></thead><tbody>`;
  let win = 0, winT = 0;
  for (const k of tg) {
    const t = tgt(k), ro = atk(atkOpts('S1', {move: 'rondo', target: t})), a = es(t, 6144), b = es(t, 4096);
    if (ro.maxPct > a.maxPct) win++;
    if (ro.maxPct > b.maxPct) winT++;
    h += `<tr><th class="rowh" style="white-space:normal">${esc(t.label)}</th>${cell(ro)}${cell(a)}${cell(b)}</tr>`;
  }
  const u = tgt('urshifur_as'), rU = atk(atkOpts('S1', {move: 'rondo', target: u})), eU = es(u, 6144), nU = es(u, 4096);
  h += `</tbody></table></div><p class="cap" style="margin-top:8px"><b>表6-5</b>　どちらも優先度+2。同じ優先度の中は素早さ順なので、最速ドラフィア（${ST.S1.spe}）が最速カイリュー（${C.stats('dragonite', 'jolly', {spe: 252}).spe}）より先に動く。</p>`;
  h += `<p class="prose small" style="margin-top:10px">${tg.length}体のうち、ロンドがテラスノーマルのしんそくより多く削る相手は${win}体、テラスなしのしんそくより多く削る相手は${winT}体。等倍の相手（連撃ウーラオス）で比べると、テラスノーマルのしんそくはロンドの約${(eU.maxPct / rU.maxPct).toFixed(2)}倍、テラスなしのしんそくは約${(nU.maxPct / rU.maxPct).toFixed(2)}倍。<b>テラスを切らない限りロンドの方が強く、テラスノーマルと比べても、竜・妖・氷に抜群を取れてゴーストに無効化されないぶん、レギュIの上位相手にはロンドが勝る。</b></p>`;
  h += '<p class="prose small" style="margin-top:6px">差が出るのは耐久で、カイリューはH{{base dragonite hp}}・B{{base dragonite def}}・D{{base dragonite spd}}にマルチスケイル、ドラフィアはH{{base hp}}・B{{base def}}・D{{base spd}}。ドラフィアは先制で殴れる代わりに、上から1発もらうと落ちる（§2.5）。「しんそく並みの先制技を持つ、紙耐久のアタッカー」という見立ては計算上も成り立つ。</p>';
  return h;
}

/* ---------- forecast ---------- */
function rankAxis() {
  const pos = (r) => (r - 1) / 59 * 100, f = (x) => x.toFixed(2);
  let h = '<div class="rkscale"><span></span><div class="t">' + [1, 10, 20, 30, 40, 50, 60].map(r =>
    `<span style="left:${f(pos(r))}%${r === 1 ? ';transform:none' : r === 60 ? ';transform:translateX(-100%)' : ''}">${r}位</span>`).join('') + '</div></div>';
  for (const [k, lab] of [['S', 'シングル'], ['D', 'ダブル']]) {
    h += `<div class="rk"><span class="lab">${lab}</span><div class="ax">`;
    for (const [cls, name] of [['early', '初月'], ['settled', '定着後']]) {
      const [a, b] = CFG.rank[k][cls], l = pos(a), r = pos(b);
      // 帯の右に名前を置く。右端に近い帯は左に置く（スマホ幅で帯が細くても読めるように）
      const at = r > 65 ? `right:calc(${f(100 - l)}% + 4px)` : `left:calc(${f(r)}% + 4px)`;
      h += `<div class="band ${cls}" style="left:${f(l)}%;width:${f(r - l)}%" title="${name} ${a}〜${b}位"></div><span class="bl ${cls}" style="${at}">${name} ${a}〜${b}</span>`;
    }
    h += '</div></div>';
  }
  return h;
}
function adopt(groups, dbl) {
  let h = '<div class="stack" style="gap:16px">';
  for (const [title, items] of groups) {
    h += `<div><div class="cap" style="margin-bottom:6px"><b>${title}</b></div><div class="adopt">`;
    for (const [n, p] of items) h += `<div class="ad${dbl ? ' d' : ''}"><span class="nm">${n}</span><span class="tr"><span class="fl" style="width:${p}%"></span></span><span class="pc">${p}%</span></div>`;
    h += '</div></div>';
  }
  return h + '</div>';
}

/* ---------- assemble ---------- */
let head = fs.readFileSync(P('templates/head.html'), 'utf8');
const chipCss = E.TYPES.concat(['Stellar']).map(t => `.t-${t}{background:var(--t-${t})}`).join('') +
  '.calclist{list-style:none;margin:0;padding:0;display:grid;gap:4px;font-size:13px}.calclist li{display:flex;flex-wrap:wrap;justify-content:space-between;gap:2px 12px;padding:4px 0;border-bottom:1px dashed var(--rule2)}.calclist li:last-child{border-bottom:none}.calclist .mono{color:var(--ink2)}';
head = head.replace('</style>', chipCss + '\n</style>');
let body = fs.readFileSync(P('templates/body.html'), 'utf8');
const parts = {
  TYPECHIPS: typeChips(), DEFCHART: defChart(), SKINTABLE: skinTable(),
  RADAR: radar(), RADARTABLE: radarTable(), STATBARS: statBars(), SINGLES_ATK: singlesAtk(), SINGLES_DEF: singlesDef(), CHEER: cheer(),
  SPEED: speedRows(), SPEEDTBL: speedTable(), TERA: teraMatrix(), TRAINING: training(), EXP_CAT: expCat(), EXP_LR: expLR(), EXP_FACADE: expFacade(), EXP_SYL: expSyl(), EXP_ES: expES(),
  RANKAXIS: rankAxis(), ADOPT_S: adopt(CFG.adoptS, false), ADOPT_D: adopt(CFG.adoptD, true),
};
for (const k in parts) {
  const tag = `<!--@${k}-->`;
  if (!body.includes(tag)) throw new Error('missing placeholder ' + k);
  body = body.split(tag).join(parts[k]);
}
const left = body.match(/<!--@[A-Z_]+-->/g);
if (left) throw new Error('unfilled ' + left.join(','));
const res = T.resolve(body);
const script = ['engine.js', 'data.js', 'core.js', 'ui.js'].map(f => `/* ${f} */\n` + fs.readFileSync(P('src', f), 'utf8')).join('\n');
const html = head + '\n' + res.html + '\n<script>\n' + script + '\n</script>\n';
fs.mkdirSync(P('dist'), {recursive: true});
fs.writeFileSync(P('dist/draffia.html'), html);
fs.mkdirSync(P('notes'), {recursive: true});
fs.writeFileSync(P('notes/claims.md'), T.claimsMarkdown(res.claims));
console.log('written dist/draffia.html', (html.length / 1024).toFixed(1) + 'KB', '/ claims', res.claims.length);
