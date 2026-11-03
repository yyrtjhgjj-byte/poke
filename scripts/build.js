/* Build the RONDO LAB report: computes every table with the same engine the page ships, then inlines it. */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const P = (...a) => path.join(ROOT, ...a);
const C = require('../src/core.js');
const E = C.E, JP = E.JP;

const fmtPct = (x) => x.toFixed(1);
function shortKO(ko) {
  if (!ko || ko.n === 0) return '効果なし';
  const t = ko.text.replace('確定', '確').replace('乱数', '乱').replace('発', '').replace('(', ' ').replace(')', '');
  return t;
}
function koClass(ko) { if (!ko || ko.n !== 1) return ''; return ko.p >= 0.9999 ? 'k1' : 'kr'; }
function cell(r) {
  if (!r) return '<td class="num muted">—</td>';
  if (r.max === 0) return '<td class="num muted">無効</td>';
  return `<td class="num">${fmtPct(r.minPct)}–${fmtPct(r.maxPct)}%<span class="ko ${koClass(r.ko)}">${shortKO(r.ko)}</span></td>`;
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const DR = {
  jolly: C.stats('draffia', 'jolly', {hp: 4, atk: 252, spe: 252}),
  adam: C.stats('draffia', 'adamant', {hp: 4, atk: 252, spe: 252}),
  hb: C.stats('draffia', 'impish', {hp: 252, def: 252, spd: 4}),
  d1: C.stats('draffia', 'careful', {hp: 252, def: 60, spd: 196}),
};
function tgt(key, extra) { const t = C.target(key); return Object.assign({sp: t.sp, st: t.st, final: t.final, defStage: t.defStage || 0, label: t.label}, extra || {}); }
function atk(o) { return C.drfAtk(o); }
const MOVE_JP = {rondo: 'ロンド', doubleedge: 'すてみ', bodyslam: 'のしかかり', crunch: 'かみくだく', facade: 'からげんき', lastresort: 'とっておき', irontail: 'アイアンテール', trailblaze: 'くさわけ'};

/* ---------- radar ---------- */
function radar() {
  const labels = ['火力', '耐久', '素早さ', '技範囲', '補助', '環境適性'];
  const S = [4.5, 2, 3.5, 3, 3, 4], D = [3.5, 3, 3.5, 3, 5, 4.5];
  const cx = 180, cy = 160, R = 108;
  const pt = (i, v) => { const a = -Math.PI / 2 + i * Math.PI * 2 / 6; return [cx + Math.cos(a) * R * v / 5, cy + Math.sin(a) * R * v / 5]; };
  let s = `<svg viewBox="0 0 360 320" role="img" aria-label="性能プロファイルのレーダーチャート。シングルは火力4.5、耐久2、素早さ3.5、技範囲3、補助3、環境適性4。ダブルは火力3.5、耐久3、素早さ3.5、技範囲3、補助5、環境適性4.5。">`;
  for (let k = 1; k <= 5; k++) s += `<polygon class="ring" points="${labels.map((_, i) => pt(i, k).map(n => n.toFixed(1)).join(',')).join(' ')}"/>`;
  labels.forEach((_, i) => { const [x, y] = pt(i, 5); s += `<line class="ax" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`; });
  s += `<polygon class="ps" points="${S.map((v, i) => pt(i, v).map(n => n.toFixed(1)).join(',')).join(' ')}"/>`;
  s += `<polygon class="pd" points="${D.map((v, i) => pt(i, v).map(n => n.toFixed(1)).join(',')).join(' ')}"/>`;
  labels.forEach((l, i) => {
    const a = -Math.PI / 2 + i * Math.PI * 2 / 6, x = cx + Math.cos(a) * (R + 20), y = cy + Math.sin(a) * (R + 20);
    const anchor = Math.abs(Math.cos(a)) < 0.2 ? 'middle' : (Math.cos(a) > 0 ? 'start' : 'end');
    const dy = Math.sin(a) < -0.5 ? -4 : (Math.sin(a) > 0.5 ? 12 : 4);
    s += `<text class="lbl" x="${x.toFixed(1)}" y="${(y + dy).toFixed(1)}" text-anchor="${anchor}">${l}</text>`;
    s += `<text class="val" x="${x.toFixed(1)}" y="${(y + dy + 13).toFixed(1)}" text-anchor="${anchor}">S${S[i]} / D${D[i]}</text>`;
  });
  return s + '</svg>';
}

/* ---------- stat bars ---------- */
function statBars() {
  const base = C.SP.draffia.b, names = ['HP', '攻撃', '防御', '特攻', '特防', '素早さ'];
  const keys = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
  const lo = C.stats('draffia', 'hardy', {}), hi = C.stats('draffia', 'hardy', {hp: 252, atk: 252, def: 252, spa: 252, spd: 252, spe: 252});
  let s = '<div class="bars">';
  keys.forEach((k, i) => {
    const top = k === 'hp' ? hi.hp : Math.floor(hi[k] * 1.1);
    s += `<div class="bar"><span class="k">${names[i]}</span><span class="b">${base[i]}</span><span class="track"><span class="fill${(k === 'atk' || k === 'spe') ? ' hi' : ''}" style="width:${(base[i] / 150 * 100).toFixed(1)}%"></span></span><span class="r">${lo[k]}–${top}</span></div>`;
  });
  s += `<div class="scale"><span></span><span></span><span class="ticks"><span>0</span><span>50</span><span>100</span><span>150</span></span><span></span></div>`;
  s += `<div class="total"><span>合計</span><span>${base.reduce((x, y) => x + y, 0)}</span></div></div>`;
  return s;
}

/* ---------- singles offense ---------- */
function singlesAtk() {
  const cols = [
    ['陽気ハチマキ<br><span class="muted">S-1</span>', {st: DR.jolly, skin: true, item: 'band'}],
    ['意地ハチマキ<br><span class="muted">S-1 変形</span>', {st: DR.adam, skin: true, item: 'band'}],
    ['陽気・持ち物なし<br><span class="muted">S-2 スカーフ</span>', {st: DR.jolly, skin: true}],
    ['陽気珠 +1 テラス竜<br><span class="muted">S-3 竜舞後</span>', {st: DR.jolly, skin: true, item: 'lo', atkStage: 1, tera: 'Dragon'}],
  ];
  const groups = [
    ['ドラゴニックロンド（優先度+1）', 'rondo', [
      ['flutter_cs'], ['flutter_cs', {tera: 'Normal'}, 'テラスノーマル'], ['chienpao_as', null, 'タスキ除く'], ['miraidon_cs'], ['miraidon_cs', {tera: 'Fairy'}, 'テラスフェアリー'],
      ['koraidon_as'], ['koraidon_as', {tera: 'Fire'}, 'テラス炎'], ['calyrexs_cs', {tera: 'Fairy'}, 'テラスフェアリー'], ['grimmsnarl_hb'], ['mimikyu_as'], ['zacianc_as'], ['calyrexi_ha']]],
    ['すてみタックル（スキン・威力144）', 'doubleedge', [
      ['koraidon_as'], ['miraidon_h'], ['urshifur_as'], ['kyogre_cs'], ['calyrexs_cs'], ['dragonite_h'], ['ogerpon_as'], ['glimmora_cs', null, 'タスキ除く'],
      ['ursalunab_h'], ['landot_hb', null, 'いかく後', {atkStage: -1}], ['hooh_hb'], ['gliscor_hb'], ['garganacl_hb'], ['tinglu_hb'], ['dondozo_hb', null, '竜舞後列はてんねんで±0', {unaware: true}]]],
    ['かみくだく', 'crunch', [['calyrexs_cs'], ['gholdengo_h'], ['lunala_hb']]],
  ];
  let h = '<div class="scroll"><table class="tbl"><thead><tr><th>技 → 相手</th>' + cols.map(c => `<th class="num">${c[0]}</th>`).join('') + '</tr></thead><tbody>';
  for (const [gname, mv, rows] of groups) {
    h += `<tr class="grp"><td colspan="${cols.length + 1}">${gname}</td></tr>`;
    for (const [k, ex, note, mod] of rows) {
      const t = tgt(k, ex);
      h += `<tr><th class="rowh" style="white-space:normal">${esc(t.label)}${note ? `<br><span class="muted xs">${note}</span>` : ''}</th>`;
      for (const [, c] of cols) {
        const o = Object.assign({}, c, {move: mv, target: t});
        if (mod && mod.atkStage) o.atkStage = (o.atkStage || 0) + mod.atkStage;
        if (mod && mod.unaware) o.atkStage = 0;
        h += cell(atk(o));
      }
      h += '</tr>';
    }
  }
  h += '</tbody></table></div><p class="cap" style="margin-top:8px"><b>表2-3</b>　割合は相手の最大HPに対するダメージ。緑は確定1発、黄は乱数1発。カイリューはマルチスケイル込み。</p>';
  return h;
}

/* ---------- singles defense ---------- */
function singlesDef() {
  const rows = ['pao_icicle_lo', 'pao_icicle_none', 'pao_shard_lo', 'fm_moon_timid', 'fm_moon_specs', 'kor_outrage', 'kor_scale', 'kor_cc', 'kor_flare', 'mir_draco', 'mir_drift_specs',
    'cs_barrage', 'cs_barrage_specs', 'zac_pr', 'zac_bb', 'ursr_cc_band', 'ursr_ss_band', 'tinglu_eq', 'lando_eq', 'hooh_bb', 'dnite_es', 'ursb_bm', 'kyo_icebeam', 'kyo_spout', 'mimi_pr', 'glim_gem'];
  let h = '<div class="scroll"><table class="tbl"><thead><tr><th>相手の攻撃</th><th class="num">S-1 陽気 H4<br><span class="muted">171-85-85</span></th><th class="num">S-4 わんぱく HB<br><span class="muted">202-128-86・物理はいかく込み</span></th></tr></thead><tbody>';
  for (const k of rows) {
    const p = C.attack(k);
    const a = C.vsDrf(p, {st: DR.jolly});
    const b = C.vsDrf(p, {st: DR.hb, intim: p.cat === 'phys'});
    h += `<tr><th class="rowh" style="white-space:normal">${esc(p.label)}</th>${cell(a)}${cell(b)}</tr>`;
  }
  h += '</tbody></table></div><p class="cap" style="margin-top:8px"><b>表2-4</b>　緑は確定で落ちる、黄は乱数で落ちる。それ以外は1発耐え。急所技（すいりゅうれんだ）はいかくを無視する。</p>';
  return h.replace(/ko k1/g, 'ko k1');
}

/* ---------- dragon cheer ---------- */
function cheer() {
  const mir = C.stats('miraidon', 'modest', {hp: 4, spa: 252, spe: 252});
  const kor = C.stats('koraidon', 'adamant', {hp: 4, atk: 252, spe: 252});
  const pc = (r, hp) => { const s = E.summarize(r, hp); return `<td class="num">${fmtPct(s.minPct)}–${fmtPct(s.maxPct)}%<span class="ko ${koClass(s.ko)}">${shortKO(s.ko)}</span></td>`; };
  const tg = ['incin_hd', 'calyrexs_cs', 'rilla_ha', 'amoong_hb', 'calyrexi_ha', 'ironhands_ha', 'farigiraf_hb', 'kingambit_ha', 'zamazenta_hb'];
  let h = '<div class="scroll"><table class="tbl"><thead><tr><th>ミライドン りゅうせいぐん →</th><th class="num">メガネ<br><span class="muted">1発目</span></th><th class="num">メガネ<br><span class="muted">2発目（C-2）</span></th><th class="num">レンズ＋エール<br><span class="muted">1発目（急所）</span></th><th class="num">レンズ＋エール<br><span class="muted">2発目（急所）</span></th></tr></thead><tbody>';
  for (const k of tg) {
    const t = C.target(k), types = C.SP[t.sp].t, ef = E.eff('Dragon', types);
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
    const t = C.target(k), types = C.SP[t.sp].t, ef = E.eff('Fighting', types);
    const base = {bp: 100, bpMods: ef > 1 ? [5461] : [], atk: kor.atk, atkStage: -1, atkMods: [5461], def: t.st.def, defStage: t.defStage || 0, stab: 6144, eff: ef};
    const a = E.rolls(base), b = E.rolls(Object.assign({}, base, {crit: true}));
    h += `<tr><th class="rowh" style="white-space:normal">${esc(t.label)}</th>${pc(a, t.st.hp)}${pc(b, t.st.hp)}</tr>`;
  }
  h += '</tbody></table></div><p class="cap" style="margin-top:8px"><b>表3-2</b>　コライドン意地A252、晴れ（ひひいろのこどう）。抜群時のアクセルブレイク補正込み。急所はいかくの-1を無視する。</p>';
  h += '<p class="prose small" style="margin-top:12px">1発目はメガネとほぼ同じ火力で、2発目以降はメガネ型の約2倍になる。拘りがないため、まもるとイナズマドライブを打ち分けられる。タケルライコのりゅうせいぐんも同じ理屈で毎ターン急所になり、急所判定の高い技を持つオリジンパルキア（あくうせつだん）はエールだけで確定急所になる。</p>';
  return h;
}

/* ---------- speed rows ---------- */
function speedRows() {
  const L = [
    ['黒バドレックス', 'calyrexs', 'timid', 252], ['ザシアン(王)', 'zacianc', 'jolly', 252], ['コライドン', 'koraidon', 'jolly', 252], ['ミライドン', 'miraidon', 'timid', 252],
    ['ハバタクカミ', 'fluttermane', 'timid', 252], ['パオジアン', 'chienpao', 'jolly', 252], ['ムゲンダイナ', 'eternatus', 'timid', 252], ['ザマゼンタ(王)', 'zamazentac', 'jolly', 252],
    ['エルフーン', 'whimsicott', 'timid', 252], ['トルネロス', 'tornadus', 'timid', 252], ['オーガポン', 'ogerpon', 'jolly', 252], ['化身ランドロス', 'landoi', 'timid', 252],
    ['イーユイ', 'chiyu', 'timid', 252], ['連撃ウーラオス', 'urshifur', 'jolly', 252], ['ルナアーラ', 'lunala', 'timid', 252], ['ミミッキュ', 'mimikyu', 'jolly', 252],
    ['グライオン', 'gliscor', 'jolly', 252], ['霊獣ランドロス', 'landot', 'jolly', 252], ['カイオーガ', 'kyogre', 'timid', 252], ['ホウオウ', 'hooh', 'jolly', 252],
    ['キラフロル', 'glimmora', 'timid', 252], ['ゴリランダー', 'rillaboom', 'jolly', 252], ['カイリュー', 'dragonite', 'jolly', 252], ['タケルライコ', 'ragingbolt', 'timid', 252],
    ['ガオガエン', 'incineroar', 'hardy', 252], ['イエッサン♀（最遅）', 'indeedeef', 'sassy', 0, 0], ['リキキリン（最遅）', 'farigiraf', 'sassy', 0, 0],
    ['白バドレックス（最遅）', 'calyrexi', 'brave', 0, 0], ['モロバレル（最遅）', 'amoonguss', 'sassy', 0, 0]
  ].map(([n, sp, nat, ev, iv]) => [n, C.stats(sp, nat, {spe: ev}, iv === 0 ? {spe: 0} : {}).spe]);
  L.sort((a, b) => b[1] - a[1]);
  return '<div class="speed" id="speedChart">' + L.map(([n, s]) =>
    `<div class="sp-row" data-spe="${s}"><span class="nm">${n}</span><span class="tr"><span class="fl" style="width:${(s / 240 * 100).toFixed(1)}%"></span><span class="mark" style="left:calc(${(130 / 240 * 100).toFixed(1)}% - 1px)"></span></span><span class="v2">${s}</span></div>`).join('') + '</div>';
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
function trainCard(no, code, name, kv, intent, lists) {
  let h = `<h3 class="sub"><span class="n">${no}</span>${code}　${name}</h3><div class="cols"><div class="panel stack" style="gap:12px"><dl class="kv">`;
  for (const [k, v] of kv) h += `<dt>${k}</dt><dd${/実数値|努力値/.test(k) ? ' class="mono"' : ''}>${v}</dd>`;
  h += `</dl><div class="prose small">${intent}</div></div><div class="panel stack" style="gap:14px">`;
  for (const [title, items] of lists) h += `<div><h4 style="margin:0 0 6px">${title}</h4><ul class="calclist">${items.join('')}</ul></div>`;
  return h + '</div></div>';
}
function training() {
  const J = DR.jolly, A = DR.adam;
  const a = (st, mv, k, ex, more) => atk(Object.assign({st, skin: true, move: mv, target: tgt(k, ex)}, more || {}));
  const L = (mv, k, ex, more, st, note) => li(`${MOVE_JP[mv]} → ${tgt(k).label}${note ? '・' + note : ''}`, a(st || J, mv, k, ex, more));
  const D = (k, st, opt, note) => { const p = C.attack(k); return li(`${p.label}${note ? '（' + note + '）' : ''}`, C.vsDrf(p, Object.assign({st}, opt || {}))); };
  let h = '';
  h += trainCard('4.1', 'S-1', '竜皮ハチマキ', [['性格', 'ようき'], ['努力値', 'H4 A252 S252'], ['実数値', '171-182-85-×-85-178'], ['持ち物', 'こだわりハチマキ']],
    '<p>攻撃と素早さに全振り。S178で最速の連撃ウーラオス（163）、イーユイ（167）、化身ランドロス（168）を抜き、最速オーガポンと同速。</p><p>意地にするとコライドン（H4）へのロンドが確定1発になる代わりに、S162でウーラオスとルナアーラに抜かれる。上位のウーラオスに先手を取れる陽気を基本とした。</p>',
    [['与ダメージ（陽気ハチマキ）', [
      L('rondo', 'flutter_cs', null, {item: 'band'}), L('rondo', 'flutter_cs', {tera: 'Normal'}, {item: 'band'}, J, 'テラスノーマル'), L('rondo', 'chienpao_as', null, {item: 'band'}),
      L('rondo', 'miraidon_cs', null, {item: 'band'}), L('rondo', 'koraidon_as', null, {item: 'band'}), L('doubleedge', 'urshifur_as', null, {item: 'band'}),
      L('doubleedge', 'kyogre_cs', null, {item: 'band'}), L('doubleedge', 'calyrexs_cs', null, {item: 'band'}), L('crunch', 'calyrexs_cs', null, {item: 'band'}), L('doubleedge', 'hooh_hb', null, {item: 'band'})]],
     ['意地ハチマキにした場合', [L('rondo', 'koraidon_as', null, {item: 'band'}, A), L('rondo', 'miraidon_h', null, {item: 'band'}, A), L('doubleedge', 'tinglu_hb', null, {item: 'band'}, A)]],
     ['被ダメージ（H4）', [D('kor_outrage', J), D('cs_barrage', J), D('fm_moon_timid', J), D('pao_shard_lo', J), D('ursr_cc_band', J)]]]);
  h += trainCard('4.2', 'S-2', '竜皮スカーフ', [['性格', 'ようき'], ['努力値', 'H4 A252 S252'], ['実数値', '171-182-85-×-85-178'], ['持ち物', 'こだわりスカーフ（S267）']],
    '<p>S267（178×1.5）で黒バドレックス（222）、ザシアン(王)（220）、スカーフなしの135族（205）を抜く。素早さ調整を削る理由がないため、こちらも陽気AS。</p><p>持ち物で火力が上がらないぶん、ロンドは削り役に回り、すてみとかみくだくで倒す。</p>',
    [['与ダメージ（陽気・持ち物補正なし）', [L('crunch', 'calyrexs_cs'), L('doubleedge', 'koraidon_as'), L('doubleedge', 'miraidon_cs'), L('rondo', 'flutter_cs'), L('rondo', 'chienpao_as'), L('doubleedge', 'chienpao_as'), L('doubleedge', 'kyogre_cs'), L('rondo', 'zacianc_as')]]]);
  h += trainCard('4.3', 'S-3', '竜舞アタッカー', [['性格', 'ようき'], ['努力値', 'H4 A252 S252'], ['実数値', '171-182-85-×-85-178'], ['持ち物', 'いのちのたま'], ['テラス', 'ドラゴン']],
    '<p>1回積めばS267で全抜きの準備が整う。火力の要は珠とテラス竜で、すてみは実質威力288×1.3倍になる。</p><p>ヘイラッシャとドオーのてんねんには積みが通らない（下表のヘイラッシャは積みなしの値）。</p>',
    [['与ダメージ（+1・珠・テラス竜）', [
      L('doubleedge', 'hooh_hb', null, {item: 'lo', tera: 'Dragon', atkStage: 1}), L('doubleedge', 'gliscor_hb', null, {item: 'lo', tera: 'Dragon', atkStage: 1}), L('doubleedge', 'garganacl_hb', null, {item: 'lo', tera: 'Dragon', atkStage: 1}),
      L('doubleedge', 'tinglu_hb', null, {item: 'lo', tera: 'Dragon', atkStage: 1}), L('doubleedge', 'kingambit_ha', null, {item: 'lo', tera: 'Dragon', atkStage: 1}), L('doubleedge', 'dondozo_hb', null, {item: 'lo', tera: 'Dragon', atkStage: 0}, J, 'てんねん'),
      L('rondo', 'zacianc_as', null, {item: 'lo', tera: 'Dragon', atkStage: 1}), L('crunch', 'gholdengo_h', null, {item: 'lo', tera: 'Dragon', atkStage: 1})]]]);
  h += trainCard('4.4', 'S-4', 'いかく起点作り', [['性格', 'わんぱく'], ['努力値', 'H252 B252 D4'], ['実数値', '202-150-128-×-86-130'], ['持ち物', 'たべのこし'], ['回復', 'ねがいごと 101']],
    '<p>HB特化。いかくと合わせて物理禁止級の主力技を1発耐え、あくびとロンドで退く。特防は無振りなので、特殊アタッカーの前には出さない。</p><p>Sは無振り130。最速135族やザシアンより遅く、ロンドで後続のすばやさを上げる条件を満たしやすい。</p>',
    [['被ダメージ（物理はいかく込み）', [D('zac_pr', DR.hb, {intim: true}), D('zac_bb', DR.hb, {intim: true}), D('pao_icicle_lo', DR.hb, {intim: true}), D('kor_outrage', DR.hb, {intim: true}), D('kor_scale', DR.hb, {intim: true}),
      D('kor_cc', DR.hb, {intim: true}), D('ursr_cc_band', DR.hb, {intim: true}), D('ursr_ss_band', DR.hb, {intim: true}, '急所でいかく無視'), D('lando_eq', DR.hb, {intim: true}), D('hooh_bb', DR.hb, {intim: true})]],
     ['被ダメージ（特殊・参考）', [D('cs_barrage', DR.hb), D('fm_moon_timid', DR.hb), D('kyo_icebeam', DR.hb)]]]);
  h += trainCard('4.5', 'D-1・D-2', 'いかくロンド／竜の加護', [['性格', 'しんちょう'], ['努力値', 'H252 B60 D196'], ['実数値', '202-150-93-×-121-130'], ['持ち物', 'オボン／マント／ハバン／メンタルハーブ']],
    '<p>Bはいかく込みで白バドレックスのブリザードランス（全体）を高確率で耐える値、残りをDに回した。ダブルの環境は特殊の全体技が多く、いかくで補えない側を厚くしている。</p><p>パオジアンの珠つららおとしはいかく込みでも耐えないため、パオジアンにはテラスはがね・みずで対応する。</p>',
    [['被ダメージ（特殊）', [D('fm_moon_timid', DR.d1), D('fm_gleam_d', DR.d1), D('mir_gleam_specs_d', DR.d1), D('cs_barrage_specs_d', DR.d1), D('kyo_spout_d', DR.d1), D('kyo_icebeam', DR.d1),
      D('mir_draco', DR.d1, {haban: true}, 'ハバンのみ'), D('bolt_draco_d', DR.d1, {haban: true}, 'ハバンのみ'), D('lunala_mg_d', DR.d1)]],
     ['被ダメージ（物理・いかく込み）', [D('ci_lance_d', DR.d1, {intim: true}), D('zama_bp_d', DR.d1, {intim: true}, 'いかく無効'), D('ursr_cc_band', DR.d1, {intim: true}), D('kor_cc', DR.d1, {intim: true}),
      D('incin_knock_d', DR.d1, {intim: true}), D('ursaluna_facade_d', DR.d1, {intim: true}), D('pao_icicle_lo', DR.d1, {intim: true})]]]);
  const hh = (mv, k, more) => L(mv, k, null, Object.assign({hh: true}, more || {}), J, 'てだすけ');
  h += trainCard('4.6', 'D-3', '竜皮アタッカー', [['性格', 'ようき'], ['努力値', 'H4 A252 S252'], ['実数値', '171-182-85-×-85-178'], ['持ち物', 'クリアチャーム']],
    '<p>クリアチャームは火力が上がらない代わりに、ガオガエンとランドロスのいかくを無効化する。いかく1回で火力は2/3になるため、ダブルでは珠より安定する。</p><p>てだすけを受けたロンドはミライドン（H4）とエルフーンを確定1発にする。</p>',
    [['与ダメージ（陽気・補正なし）', [L('rondo', 'flutter_cs'), L('rondo', 'chienpao_as'), L('rondo', 'whims_h'), L('rondo', 'grimmsnarl_hb'), L('doubleedge', 'incin_hb'), L('doubleedge', 'incin_hb', null, {atkStage: -1}, J, 'いかく後'),
      L('doubleedge', 'rilla_ha'), L('doubleedge', 'urshifur_as'), L('doubleedge', 'tornadus_h'), L('doubleedge', 'amoong_hb'), L('crunch', 'calyrexs_cs'), L('crunch', 'lunala_hb')]],
     ['てだすけ込み', [hh('rondo', 'miraidon_cs'), hh('rondo', 'koraidon_as'), hh('rondo', 'whims_h'), hh('rondo', 'bolt_h'), hh('rondo', 'calyrexi_ha')]]]);
  return h;
}

/* ---------- experiments ---------- */
function expCat() {
  const J = DR.jolly, A = DR.adam;
  let h = '<div class="scroll"><table class="tbl compact"><thead><tr><th class="num">攻撃ランク</th><th class="num">陽気（A182 / C72）</th><th class="num">意地（A200 / C72）</th></tr></thead><tbody>';
  for (let s = 0; s >= -6; s--) {
    const f = (st) => { const a = E.boost(st.atk, s); const phys = a > st.spa; return `<td class="num ${phys ? '' : 'x2'}">${phys ? '物理' : '特殊'}（${a}／${st.spa}）</td>`; };
    h += `<tr><td class="num">${s}</td>${f(J)}${f(A)}</tr>`;
  }
  h += '</tbody></table></div><p class="prose small" style="margin-top:10px">いかくやワイドブレイカーで攻撃が-3まで下がると、陽気のロンドは特攻で計算される（同値は特殊）。特殊になれば攻撃ランクの低下は関係なくなるが、無振りの特攻72では打点にならない。意地は-4で切り替わる。性能に影響する場面はほぼなく、仕様の確認として記録する。</p>';
  return h;
}
function expLR() {
  const J = DR.jolly;
  const cols = [['すてみ +1', 'doubleedge', 1], ['とっておき +1', 'lastresort', 1], ['すてみ ±0', 'doubleedge', 0], ['とっておき ±0', 'lastresort', 0]];
  const tg = ['tinglu_hb', 'dondozo_hb', 'hooh_hb', 'garganacl_hb', 'gliscor_hb', 'kingambit_ha', 'incin_hb'];
  let h = '<div class="scroll"><table class="tbl"><thead><tr><th>相手（陽気・珠・テラス竜）</th>' + cols.map(c => `<th class="num">${c[0]}</th>`).join('') + '</tr></thead><tbody>';
  for (const k of tg) {
    const t = tgt(k);
    h += `<tr><th class="rowh" style="white-space:normal">${esc(t.label)}</th>` + cols.map(([, mv, s]) => cell(atk({st: J, skin: true, item: 'lo', tera: 'Dragon', atkStage: k === 'dondozo_hb' ? 0 : s, move: mv, target: t}))).join('') + '</tr>';
  }
  h += '</tbody></table></div><p class="prose small" style="margin-top:10px">スキンのとっておきは威力168で、すてみより約17%強く反動もない。ただし覚えている他の技をすべて1回ずつ使うまで撃てない。「りゅうのまい／とっておき」の2技構成なら2ターン目から撃てるが、先制ロンドを失う。テラス竜+1のとっておきはディンルー（HB特化）を89〜105%まで削る。ヘイラッシャ行はてんねんのため+1列も±0で計算。</p>';
  return h;
}
function expFacade() {
  const J = DR.jolly;
  const tg = ['koraidon_as', 'miraidon_cs', 'chienpao_as', 'urshifur_as', 'incin_hd', 'rilla_ha', 'amoong_hb', 'flutter_cs'];
  let h = '<div class="scroll"><table class="tbl"><thead><tr><th>相手（陽気A252）</th><th class="num">からげんき<br><span class="muted">状態異常・168</span></th><th class="num">すてみ<br><span class="muted">状態異常なし</span></th><th class="num">ロンド<br><span class="muted">やけど</span></th><th class="num">ロンド<br><span class="muted">もうどく</span></th></tr></thead><tbody>';
  for (const k of tg) {
    const t = tgt(k);
    h += `<tr><th class="rowh" style="white-space:normal">${esc(t.label)}</th>${cell(atk({st: J, skin: true, move: 'facade', statused: true, burn: true, target: t}))}${cell(atk({st: J, skin: true, move: 'doubleedge', target: t}))}${cell(atk({st: J, skin: true, move: 'rondo', burn: true, target: t}))}${cell(atk({st: J, skin: true, move: 'rondo', target: t}))}</tr>`;
  }
  h += '</tbody></table></div><p class="prose small" style="margin-top:10px">からげんきはやけどでも威力が落ちず、スキンで168になる。すてみより約17%強く反動もない。眠り・まひにならないため、ダブルのキノコのほうし（モロバレル・ドーブル）とあくびを無視できる。</p><p class="prose small" style="margin-top:6px">ただしかえんだまはロンドの威力も半減させ、ハバタクカミを落とせなくなる。どくどくだまならロンドは落ちないが、毒のダメージが1/16、2/16、3/16と増えていく。ロンドを主力にするなら毒、すてみの代わりとして使い切るなら火傷が向く。</p>';
  return h;
}
function expSyl() {
  const syl = C.stats('sylveon', 'modest', {spa: 252, spe: 252});
  const s0 = C.stats('sylveon', 'modest', {hp: 252, spa: 252}).spe, s1 = syl.spe, s2 = C.stats('sylveon', 'timid', {spa: 252, spe: 252}).spe;
  let h = '<div class="cols"><div class="scroll"><table class="tbl compact"><thead><tr><th>ニンフィアの配分</th><th class="num">素早さ</th><th class="num">ロンド後（+2）</th><th>抜ける相手</th></tr></thead><tbody>';
  h += `<tr><td>無振り</td><td class="num">${s0}</td><td class="num">${E.boost(s0, 2)}</td><td>最速ゴリランダー（150）</td></tr>`;
  h += `<tr><td>無補正S252</td><td class="num">${s1}</td><td class="num">${E.boost(s1, 2)}</td><td>黒バドレックス（222）</td></tr>`;
  h += `<tr><td>おくびょうS252</td><td class="num">${s2}</td><td class="num">${E.boost(s2, 2)}</td><td>すべての非スカーフ禁止級</td></tr>`;
  h += '</tbody></table></div><div class="scroll"><table class="tbl compact"><thead><tr><th>ハイパーボイス（全体）→</th><th class="num">控えめC252</th></tr></thead><tbody>';
  for (const k of ['koraidon_as', 'urshifur_as', 'chienpao_as', 'miraidon_cs', 'tornadus_h', 'rilla_ha', 'calyrexs_cs', 'incin_hd']) {
    const t = C.target(k), ef = E.eff('Fairy', C.SP[t.sp].t);
    const r = E.rolls({bp: 90, bpMods: [4915], atk: syl.spa, def: t.st.spd, stab: 6144, eff: ef, spread: true});
    const s = E.summarize(r, t.st.hp);
    h += `<tr><th class="rowh" style="white-space:normal">${esc(t.label)}</th><td class="num">${fmtPct(s.minPct)}–${fmtPct(s.maxPct)}%<span class="ko ${koClass(s.ko)}">${shortKO(s.ko)}</span></td></tr>`;
  }
  h += '</tbody></table></div></div><p class="prose small" style="margin-top:10px">ダブルではスキンのロンドを撃つだけで、隣のニンフィアのすばやさが2段階上がる。無補正S252なら黒バドレックスを抜き、フェアリースキンのハイパーボイスでコライドンと連撃ウーラオスをまとめて落とせる。両者の弱点は、ドラフィアの竜をニンフィアが無効にし、ニンフィアの鋼・毒をドラフィアが等倍で受ける関係にある。</p>';
  return h;
}

/* ---------- adoption ---------- */
function adopt(groups, dbl) {
  let h = '<div class="stack" style="gap:16px">';
  for (const [title, items] of groups) {
    h += `<div><div class="cap" style="margin-bottom:6px"><b>${title}</b></div><div class="adopt">`;
    for (const [n, p] of items) h += `<div class="ad${dbl ? ' d' : ''}"><span class="nm">${n}</span><span class="tr"><span class="fl" style="width:${p}%"></span></span><span class="pc">${p}%</span></div>`;
    h += '</div></div>';
  }
  return h + '</div>';
}
const ADOPT_S = [
  ['特性', [['ドラゴンスキン', 72], ['いかく', 28]]],
  ['型', [['竜皮ハチマキ', 34], ['いかく起点作り', 22], ['竜皮スカーフ', 18], ['竜舞アタッカー', 16], ['その他', 10]]],
  ['持ち物', [['こだわりハチマキ', 31], ['こだわりスカーフ', 17], ['いのちのたま', 14], ['きあいのタスキ', 11], ['たべのこし', 9], ['ラムのみ', 7]]],
  ['テラスタル', [['ドラゴン', 38], ['ノーマル', 22], ['はがね', 17], ['フェアリー', 9], ['ステラ', 6]]],
  ['技', [['ドラゴニックロンド', 99], ['すてみタックル', 84], ['かみくだく', 63], ['アイアンテール', 31], ['りゅうのまい', 24], ['あくび', 21], ['のしかかり', 19], ['くさわけ', 14]]],
];
const ADOPT_D = [
  ['特性', [['いかく', 74], ['ドラゴンスキン', 26]]],
  ['型', [['いかくロンド', 46], ['竜の加護', 22], ['竜皮アタッカー', 24], ['その他', 8]]],
  ['持ち物', [['オボンのみ', 26], ['おんみつマント', 21], ['メンタルハーブ', 13], ['クリアチャーム', 12], ['ハバンのみ', 10], ['いのちのたま', 7]]],
  ['テラスタル', [['はがね', 31], ['みず', 19], ['フェアリー', 16], ['ゴースト', 13], ['ドラゴン', 11]]],
  ['技', [['ドラゴニックロンド', 99], ['まもる', 81], ['ドラゴンエール', 56], ['てだすけ', 48], ['ワイドブレイカー', 37], ['すてみタックル', 25], ['つぶらなひとみ', 18], ['あくび', 14]]],
];

/* ---------- assemble ---------- */
let head = fs.readFileSync(P('templates/head.html'), 'utf8');
const chipCss = E.TYPES.concat(['Stellar']).map(t => `.t-${t}{background:var(--t-${t})}`).join('') +
  '.calclist{list-style:none;margin:0;padding:0;display:grid;gap:4px;font-size:13px}.calclist li{display:flex;flex-wrap:wrap;justify-content:space-between;gap:2px 12px;padding:4px 0;border-bottom:1px dashed var(--rule2)}.calclist li:last-child{border-bottom:none}.calclist .mono{color:var(--ink2)}';
head = head.replace('</style>', chipCss + '\n</style>');
let body = fs.readFileSync(P('templates/body.html'), 'utf8');
const parts = {
  RADAR: radar(), STATBARS: statBars(), SINGLES_ATK: singlesAtk(), SINGLES_DEF: singlesDef(), CHEER: cheer(),
  SPEED: speedRows(), TERA: teraMatrix(), TRAINING: training(), EXP_CAT: expCat(), EXP_LR: expLR(), EXP_FACADE: expFacade(), EXP_SYL: expSyl(),
  ADOPT_S: adopt(ADOPT_S, false), ADOPT_D: adopt(ADOPT_D, true),
};
for (const k in parts) {
  const tag = `<!--@${k}-->`;
  if (!body.includes(tag)) throw new Error('missing placeholder ' + k);
  body = body.replace(tag, parts[k]);
}
const left = body.match(/<!--@[A-Z_]+-->/g);
if (left) throw new Error('unfilled ' + left.join(','));
const script = ['engine.js', 'data.js', 'core.js', 'ui.js'].map(f => `/* ${f} */\n` + fs.readFileSync(P('src', f), 'utf8')).join('\n');
const html = head + '\n' + body + '\n<script>\n' + script + '\n</script>\n';
fs.mkdirSync(P('dist'), {recursive: true});
fs.writeFileSync(P('dist/draffia.html'), html);
console.log('written', (html.length / 1024).toFixed(1) + 'KB');
