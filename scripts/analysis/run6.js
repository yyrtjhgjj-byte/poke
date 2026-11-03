const E = require('../../src/engine.js');
const {stats, drfAtk, vsDrf} = require('./calcs.js');
const {T} = require('./targets.js');
const {A} = require('./attackers.js');
const f = (r)=> r ? `${r.min}-${r.max} (${r.minPct.toFixed(1)}-${r.maxPct.toFixed(1)}%) ${r.ko.text}` : '—';
const dj = stats('draffia','jolly',{hp:4,atk:252,spe:252});
const S = (sp,nat,ev)=>stats(sp,nat,ev);
console.log('Band Rondo vs TeraNormal FM H4:', f(drfAtk({st:dj, skin:true, item:'band', move:'rondo', target:Object.assign({},T.flutter_cs,{tera:'Normal'})})));
console.log('Band Rondo vs TeraGround FM H4:', f(drfAtk({st:dj, skin:true, item:'band', move:'rondo', target:Object.assign({},T.flutter_cs,{tera:'Ground'})})));
console.log('Band Rondo vs TeraFire Koraidon H4:', f(drfAtk({st:dj, skin:true, item:'band', move:'rondo', target:Object.assign({},T.koraidon_as,{tera:'Fire'})})));
console.log('Band DE vs TeraFire Koraidon H4:', f(drfAtk({st:dj, skin:true, item:'band', move:'doubleedge', target:Object.assign({},T.koraidon_as,{tera:'Fire'})})));
console.log('Band Rondo vs TeraFairy Miraidon H4:', f(drfAtk({st:dj, skin:true, item:'band', move:'rondo', target:Object.assign({},T.miraidon_cs,{tera:'Fairy'})})));
console.log('Band Rondo vs TeraElectric ChienPao H4:', f(drfAtk({st:dj, skin:true, item:'band', move:'rondo', target:Object.assign({},T.chienpao_as,{tera:'Electric'})})));
console.log('Band DE vs TeraElectric ChienPao H4:', f(drfAtk({st:dj, skin:true, item:'band', move:'doubleedge', target:Object.assign({},T.chienpao_as,{tera:'Electric'})})));
console.log('Band Crunch vs Calyrex-S TeraFairy:', f(drfAtk({st:dj, skin:true, item:'band', move:'crunch', target:Object.assign({},T.calyrexs_cs,{tera:'Fairy'})})));
console.log('Band Rondo vs Calyrex-S TeraFairy:', f(drfAtk({st:dj, skin:true, item:'band', move:'rondo', target:Object.assign({},T.calyrexs_cs,{tera:'Fairy'})})));
console.log('Band Rondo vs Mimikyu (after disguise) H4:', f(drfAtk({st:dj, skin:true, item:'band', move:'rondo', target:T.mimikyu_as})));
// Tera Normal Draffia vs Calyrex-S Psychic / Psyshock
const cs = S('calyrexs','timid',{spa:252,spe:252});
const psychic = {lbl:'黒バド 臆病 サイコキネシス', st:cs, cat:'spec', bp:90, type:'Psychic', stab:6144};
const psyshock = {lbl:'黒バド 臆病 サイコショック', st:cs, cat:'spec', bp:80, type:'Psychic', stab:6144};
const drfAS = dj;
console.log('TeraNormal AS Draffia vs CS Psychic:', f(vsDrf(psychic,{st:drfAS, tera:'Normal'})));
// psyshock hits Def
const psyR = E.rolls({bp:80, atk:cs.spa, def:drfAS.def, stab:6144, eff:1});
console.log('TeraNormal AS vs CS Psyshock (vs Def):', E.summarize(psyR, drfAS.hp).ko.text, psyR[0], psyR[15]);
console.log('TeraNormal AS vs FM Moonblast:', f(vsDrf(A.fm_moon_timid,{st:drfAS, tera:'Normal'})));
console.log('TeraNormal AS vs Koraidon CC:', f(vsDrf(A.kor_cc,{st:drfAS, tera:'Normal'})));
console.log('TeraSteel AS vs FM Moonblast:', f(vsDrf(A.fm_moon_timid,{st:drfAS, tera:'Steel'})));
// Chien-Pao Ice Shard variants vs AS Draffia
const paoJ = S('chienpao','jolly',{atk:252,spe:252});
const shardJLO = {st:paoJ, cat:'phys', bp:40, type:'Ice', stab:6144, finalMods:[5324], ruinDef:true};
console.log('Jolly LO Ice Shard vs AS:', f(vsDrf(shardJLO,{st:drfAS})));
console.log('Jolly LO Ice Shard vs H252:', f(vsDrf(shardJLO,{st:S('draffia','jolly',{hp:252,atk:252})})));
// HH Rondo (doubles attacker, jolly no item / clear amulet)
for (const tk of ['miraidon_cs','koraidon_as','whims_h','calyrexi_ha','grimmsnarl_hb','bolt_h','chienpao_as']) {
  const t=T[tk];
  console.log('HH Rondo vs', t.lbl, f(drfAtk({st:dj, skin:true, hh:true, move:'rondo', target:t})), '| no HH', f(drfAtk({st:dj, skin:true, move:'rondo', target:t})));
}
// doubles: Clear Amulet DE vs Incineroar HD/HB; Rondo vs Incin
console.log('DE vs Incin HB (no item):', f(drfAtk({st:dj, skin:true, move:'doubleedge', target:T.incin_hb})));
console.log('DE -1 vs Incin HB (no Clear Amulet):', f(drfAtk({st:dj, skin:true, move:'doubleedge', atkStage:-1, target:T.incin_hb})));
console.log('Crunch vs Lunala HB SS:', f(drfAtk({st:dj, skin:true, move:'crunch', target:T.lunala_hb})));
console.log('Crunch HH vs Calyrex-S:', f(drfAtk({st:dj, skin:true, move:'crunch', hh:true, target:T.calyrexs_cs})));
// Sylveon Pixilate Hyper Voice spread (modest C252 S252) vs targets
const syl = S('sylveon','modest',{spa:252,spe:252});
for (const tk of ['koraidon_as','miraidon_cs','urshifur_as','incin_hd','chienpao_as','calyrexs_cs','rilla_ha','tornadus_h']) { const t=T[tk];
  const ef = E.eff('Fairy', t.tera?[t.tera]:require('../../src/data.js').SP[t.sp].t);
  const r = E.rolls({bp:90, bpMods:[4915], atk:syl.spa, def:t.st.spd, stab:6144, eff:ef, spread:true});
  const s = E.summarize(r, t.st.hp);
  console.log('Sylveon HV spread vs', t.lbl, `${s.minPct.toFixed(0)}-${s.maxPct.toFixed(0)}% ${s.ko.text}`);
}
// Wish heal
console.log('Wish heal H252:', Math.floor(202/2));
// Draffia D-1 Breaking Swipe damage (Careful A0) vs Incin HB spread — trivial check
const d1 = stats('draffia','careful',{hp:252,def:60,spd:196});
console.log('D1 Breaking Swipe spread vs Urshifu-R H4:', f(drfAtk({st:d1, skin:false, move:'breakingswipe', doubles:true, target:T.urshifur_as})));
// Stealth rock / hazard not needed
