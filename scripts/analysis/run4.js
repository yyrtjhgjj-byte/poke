const E = require('../../src/engine.js');
const {stats, drfAtk, vsDrf} = require('./calcs.js');
const {A} = require('./attackers.js');
const {T} = require('./targets.js');
// ---- D-1 spread benchmark detail
const d1 = stats('draffia','careful',{hp:252,def:60,spd:196});
console.log('D1 stats', JSON.stringify(d1));
const b1 = [['fm_moon_timid',{}],['fm_gleam_spread',{}],['mir_gleam_specs_spread',{}],['mir_gleam_spread',{}],['mir_draco',{}],['mir_draco',{final:[2048]}],['mir_draco_specs',{final:[2048]}],['cs_barrage_spread',{}],['cs_barrage_spread_specs',{}],['ci_lance_spread',{intim:true}],['ci_lance_spread',{}],['pao_icicle_lo',{intim:true}],['pao_icicle_none',{}],['zama_bp',{}],['ursr_cc_band',{intim:true}],['ursr_ss_band',{}],['kyo_spout_spread',{}],['kyo_icebeam',{}],['kor_cc_d',{intim:true}],['bolt_draco',{}],['bolt_draco',{final:[2048]}],['incin_knock',{intim:true}],['tornadus_bleak',{}],['whims_moon',{}],['chiyu_darkpulse',{}],['ursaluna_facade',{intim:true}],['lunala_moongeist',{}]];
for (const [k,o] of b1) { const r = vsDrf(A[k], Object.assign({st:d1}, o)); console.log(`${A[k].lbl}${o.intim?' (威嚇-1)':''}${o.final?' (ハバン)':''} : ${r.min}-${r.max} (${r.minPct.toFixed(1)}-${r.maxPct.toFixed(1)}%) ${r.ko.text}`); }
// ---- singles intimidate HB
const s1 = stats('draffia','impish',{hp:252,def:252,spd:4});
console.log('\nS-HB stats', JSON.stringify(s1));
const b2 = [['zac_pr_p1',{intim:true}],['zac_bb_p1',{intim:true}],['pao_icicle_lo',{intim:true}],['pao_icicle_none',{intim:true}],['pao_shard_lo',{intim:true}],['kor_outrage',{intim:true}],['kor_scale_dice',{intim:true}],['kor_scale_dice5',{intim:true}],['kor_cc',{intim:true}],['kor_flare_tera',{intim:true}],['ursr_cc_band',{intim:true}],['ursr_ss_band',{}],['lando_eq',{intim:true}],['tinglu_eq',{intim:true}],['tinglu_eq_adam',{intim:true}],['hooh_bb',{intim:true}],['hooh_sf',{intim:true}],['dnite_es_band',{intim:true}],['mimi_pr',{intim:true}],['dondozo_wc',{intim:true}],['cs_barrage',{}],['fm_moon_timid',{}],['kyo_icebeam',{}],['ursb_bm',{}],['glim_gem',{}]];
for (const [k,o] of b2) { const r = vsDrf(A[k], Object.assign({st:s1}, o)); console.log(`${A[k].lbl}${o.intim?' (威嚇-1)':''} : ${r.min}-${r.max} (${r.minPct.toFixed(1)}-${r.maxPct.toFixed(1)}%) ${r.ko.text}`); }
// ---- Last Resort & Facade experiments (Jolly AS, LO, +1, Tera Dragon) vs walls
const dj = stats('draffia','jolly',{hp:4,atk:252,spe:252});
console.log('\n--- とっておき/からげんき比較 (陽気AS, 珠, テラ竜)');
for (const tk of ['tinglu_hb','dondozo_hb','hooh_hb','garganacl_hb','gliscor_hb','zacianc_as','kingambit_ha','incin_hb']) {
  const t = T[tk];
  const row = [];
  for (const [lbl, mv, extra] of [['すてみ+1','doubleedge',{atkStage:1}],['とっておき+1','lastresort',{atkStage:1}],['からげんき(状態異常)+1','facade',{atkStage:1, statused:true}],['すてみ±0','doubleedge',{}],['とっておき±0','lastresort',{}]]) {
    const r = drfAtk(Object.assign({st:dj, skin:true, item:'lo', tera:'Dragon', move:mv, target:t}, extra));
    row.push(`${lbl} ${r.minPct.toFixed(0)}-${r.maxPct.toFixed(0)}%`);
  }
  console.log(t.lbl.padEnd(16,'　'), row.join(' | '));
}
// facade (status) non-LO, burn vs toxic: compare rondo under burn
console.log('\n--- からげんき型 (陽気AS, 火傷/猛毒, 持ち物=火炎/毒玉) vs targets');
for (const tk of ['koraidon_as','miraidon_cs','urshifur_as','incin_hd','rilla_ha','amoong_hb','flutter_cs','chienpao_as']) {
  const t = T[tk];
  const f = drfAtk({st:dj, skin:true, move:'facade', statused:true, burn:true, target:t});
  const rb = drfAtk({st:dj, skin:true, move:'rondo', burn:true, target:t});
  const rp = drfAtk({st:dj, skin:true, move:'rondo', burn:false, target:t});
  const de = drfAtk({st:dj, skin:true, move:'doubleedge', target:t});
  console.log(t.lbl.padEnd(16,'　'), `からげんき168 ${f.minPct.toFixed(0)}-${f.maxPct.toFixed(0)}% | すてみ(無状態) ${de.minPct.toFixed(0)}-${de.maxPct.toFixed(0)}% | ロンド(火傷) ${rb.minPct.toFixed(0)}-${rb.maxPct.toFixed(0)}% | ロンド(毒) ${rp.minPct.toFixed(0)}-${rp.maxPct.toFixed(0)}%`);
}
// ---- Rondo category flip under intimidate stacks
console.log('\n--- ロンドの物理/特殊判定 (陽気 A182 C72 / 意地 A200 C72)');
for (const [nm, st] of [['陽気',dj],['意地',stats('draffia','adamant',{hp:4,atk:252,spe:252})]]) {
  const out = [];
  for (let s = 0; s >= -6; s--) { const A_ = E.boost(st.atk, s), C_ = st.spa; out.push(`${s}:${A_ > C_ ? '物理' : '特殊'}(${A_}/${C_})`); }
  console.log(nm, out.join(' '));
}
