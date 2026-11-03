const E = require('../../src/engine.js');
const {stats} = require('./calcs.js');
const {SP} = require('../../src/data.js');
const {T} = require('./targets.js');
const pct = (r,hp)=>`${(r[0]/hp*100).toFixed(1)}-${(r[15]/hp*100).toFixed(1)}% ${E.summarize(r,hp).ko.text}`;
function hit(att, mv, tgt, o){ o=o||{};
  const types = tgt.tera?[tgt.tera]:SP[tgt.sp].t;
  const ef = E.eff(mv.type, types);
  const phys = mv.cat==='phys';
  return E.rolls({bp:mv.bp, bpMods:mv.bpMods||[], atk: phys?att.atk:att.spa, atkStage:o.stage||0, atkMods:o.atkMods||[],
    def: phys?tgt.st.def:tgt.st.spd, defStage:0, defMods:[], stab:mv.stab||4096, eff:ef, spread:!!o.spread, crit:!!o.crit,
    finalMods:(o.final||[]).concat(ef>1&&mv.sePlus?[5461]:[]), weatherMod:o.weather||4096});
}
const mir = stats('miraidon','modest',{spa:252,spe:252,hp:4});
const draco = {bp:130, type:'Dragon', cat:'spec', stab:6144};
const drift = {bp:100, type:'Electric', cat:'spec', stab:6144, bpMods:[5325], sePlus:true};
const tg = ['incin_hd','calyrexs_cs','urshifur_as','rilla_ha','amoong_hb','whims_h','zamazenta_hb','fm_cs','tornadus_h','ogerpon_as','farigiraf_hb','calyrexi_ha','kingambit_ha','ironhands_ha','ursaluna_x'];
const extra = {
  fm_cs: T.flutter_cs,
  ursaluna_x: {sp:'ursaluna', st: stats('ursaluna','adamant',{hp:252,atk:252}), lbl:'ガチグマ HA'},
};
console.log('=== Miraidon Draco (EF, Hadron) : Specs non-crit / Lens+Cheer crit | 2nd Draco (-2): Specs / Lens crit');
for (const k of tg) { const t = T[k] || extra[k]; if(!t) continue;
  const z = {sp:t.sp, st:t.st, tera:null};
  const specs = hit(mir, draco, z, {atkMods:[6144,5461], spread:false});
  const lens = hit(mir, draco, z, {atkMods:[5461], crit:true});
  const specs2 = hit(mir, draco, z, {atkMods:[6144,5461], stage:-2});
  const lens2 = hit(mir, draco, z, {atkMods:[5461], crit:true, stage:-2});
  console.log((t.lbl||k).padEnd(20,'　'), '| 1st:', pct(specs,t.st.hp), ' vs ', pct(lens,t.st.hp), '| 2nd:', pct(specs2,t.st.hp), ' vs ', pct(lens2,t.st.hp));
}
console.log('\n=== Miraidon Electro Drift (EF) : Specs vs Lens crit');
for (const k of ['urshifur_as','tornadus_h','incin_hd','calyrexs_cs','lunala_hb','kyogre_cs','zamazenta_hb','amoong_hb']) { const t = T[k]; if(!t) continue;
  const z = {sp:t.sp, st:t.st};
  const specs = hit(mir, drift, z, {atkMods:[6144,5461], final: t.final});
  const lens = hit(mir, drift, z, {atkMods:[5461], crit:true, final: t.final});
  console.log(t.lbl.padEnd(20,'　'), pct(specs,t.st.hp), ' vs ', pct(lens,t.st.hp));
}
// Koraidon: Collision Course vs Incineroar under Intimidate: non-crit -1 vs crit
const kor = stats('koraidon','adamant',{atk:252,spe:252,hp:4});
const cc = {bp:100, type:'Fighting', cat:'phys', stab:6144, sePlus:true};
const fb = {bp:120, type:'Fire', cat:'phys', stab:4096};
console.log('\n=== Koraidon (sun, Orichalcum) under Intimidate: -1 non-crit vs Lens+Cheer crit');
for (const k of ['incin_hd','incin_hb','calyrexs_cs','zacianc_as','kingambit_ha','farigiraf_hb','amoong_hb','urshifur_as','miraidon_h']) { const t = T[k]; if(!t) continue;
  const z = {sp:t.sp, st:t.st};
  const mv = (SP[t.sp].t.some(x=>['Normal','Ice','Rock','Dark','Steel'].includes(x)) && E.eff('Fighting',SP[t.sp].t)>=1) ? cc : cc;
  const a = hit(kor, mv, z, {atkMods:[5461], stage:-1});
  const b = hit(kor, mv, z, {atkMods:[5461], crit:true, stage:-1});
  console.log(t.lbl.padEnd(20,'　'), 'CC -1:', pct(a,t.st.hp), ' | CC crit:', pct(b,t.st.hp));
}
// Raging Bolt Draco crit vs non-crit
const bolt = stats('ragingbolt','modest',{hp:252,spa:252});
console.log('\n=== Raging Bolt Draco: none vs Lens crit (2nd: -2)');
for (const k of ['incin_hd','calyrexs_cs','urshifur_as','rilla_ha','zacianc_as','miraidon_h']) { const t=T[k];
  const z={sp:t.sp, st:t.st};
  const a = hit(bolt, draco, z, {}); const b = hit(bolt, draco, z, {crit:true}); const c = hit(bolt, draco, z, {stage:-2}); const d = hit(bolt, draco, z, {crit:true, stage:-2});
  console.log(t.lbl.padEnd(20,'　'), pct(a,t.st.hp),' vs ',pct(b,t.st.hp),' | 2nd ',pct(c,t.st.hp),' vs ',pct(d,t.st.hp));
}
// Palkia-O Spacial Rend: high-crit +1, Dragon Cheer +2 -> 100% crit without item
const palk = stats('palkiao','modest',{spa:252,spe:252,hp:4});
const rend = {bp:100, type:'Dragon', cat:'spec', stab:6144};
console.log('\n=== Palkia-O Spacial Rend (Lustrous Globe x1.2?) no item: non-crit vs crit');
for (const k of ['incin_hd','calyrexs_cs','urshifur_as','miraidon_h','kyogre_cs']) { const t=T[k]; const z={sp:t.sp, st:t.st};
  const a = hit(palk, rend, z, {}); const b = hit(palk, rend, z, {crit:true});
  console.log(t.lbl.padEnd(20,'　'), pct(a,t.st.hp),' vs ',pct(b,t.st.hp));
}
