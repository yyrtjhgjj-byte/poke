const {stats, vsDrf} = require('./calcs.js');
const {A} = require('./attackers.js');
// doubles support benchmarks (Draffia has Intimidate on field for physical)
const bench = [
  ['fm_moon_timid', {}],
  ['mir_gleam_specs_spread', {}],
  ['ci_lance_spread', {intim:true}],
  ['pao_icicle_lo', {intim:true}],
  ['cs_barrage_spread_specs', {}],
  ['zama_bp', {}],
  ['ursr_cc_band', {intim:true}],
  ['kyo_spout_spread', {}],
  ['kor_cc_d', {intim:true}],
];
const natures = ['careful','impish','calm','bold','sassy','relaxed'];
const res = [];
for (const nat of natures) for (let b = 0; b <= 252; b += 4) {
  const d = 252 - b; // H252, remaining 252 split into B/D (4 leftover to H? we use 252/252-split + 4 spe)
  const st = stats('draffia', nat, {hp:252, def:b, spd:d, spe:4});
  let score = 0, fails = [], worst = 0;
  for (const [k,o] of bench) {
    const r = vsDrf(A[k], Object.assign({st}, o));
    const p = r.ko.n === 1 ? r.ko.p : 0; // OHKO chance
    if (p > 0) fails.push(k + ':' + (p*100).toFixed(0) + '%');
    score += (1 - p);
  }
  res.push({nat, b, d, st, score, fails});
}
res.sort((a,b) => b.score - a.score);
for (const r of res.slice(0, 15)) console.log(r.nat, 'H252 B'+r.b, 'D'+r.d, `[B${r.st.def} D${r.st.spd}]`, 'score', r.score.toFixed(3), r.fails.join(' '));
