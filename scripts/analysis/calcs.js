const E = require('../../src/engine.js');
const {SP, DM} = require('../../src/data.js');

const NAT = {
  jolly:{spe:1.1, spa:0.9}, adamant:{atk:1.1, spa:0.9}, modest:{spa:1.1, atk:0.9}, timid:{spe:1.1, atk:0.9},
  impish:{def:1.1, spa:0.9}, careful:{spd:1.1, spa:0.9}, bold:{def:1.1, atk:0.9}, calm:{spd:1.1, atk:0.9},
  brave:{atk:1.1, spe:0.9}, quiet:{spa:1.1, spe:0.9}, relaxed:{def:1.1, spe:0.9}, sassy:{spd:1.1, spe:0.9},
  hardy:{}
};
const KEYS = ['hp','atk','def','spa','spd','spe'];
function stats(sp, nat, ev, iv) {
  const b = SP[sp].b; ev = ev || {}; iv = iv || {}; const n = NAT[nat || 'hardy'];
  const o = {};
  KEYS.forEach((k, i) => {
    o[k] = E.calcStat(b[i], ev[k] || 0, iv[k] === undefined ? 31 : iv[k], (n[k] || 1), k === 'hp');
  });
  return o;
}

// ---------- Draffia attacking ----------
function drfAtk(o) {
  // o: {st (draffia stats), skin:true|false, move:key, item, tera, stellar, atkStage, spaStage, crit, hh, burn, statused,
  //     target:{sp, st, tera, defStage, final:[], ruin:bool}, doubles, spreadHit}
  const mv = DM[o.move];
  let type = mv.type, bp = mv.bp, bpMods = [];
  if (o.hh) bpMods.push(6144);
  if (mv.skin && o.skin && type === 'Normal') { type = 'Dragon'; bpMods.push(4915); }
  if (mv.facade && o.statused && o.move === 'facade') bp = 140;
  if (o.move === 'rondo' && !o.skin) return null;
  // category
  let cat = 'phys';
  if (mv.rondo) {
    const A = E.boost(o.st.atk, o.atkStage || 0), C = E.boost(o.st.spa, o.spaStage || 0);
    cat = A > C ? 'phys' : 'spec';
  }
  const atkStat = cat === 'phys' ? o.st.atk : o.st.spa;
  const atkStage = cat === 'phys' ? (o.atkStage || 0) : (o.spaStage || 0);
  const atkMods = [];
  if (o.item === 'band' && cat === 'phys') atkMods.push(6144);
  const finalMods = [];
  const tgt = o.target;
  const defTypes = tgt.tera ? [tgt.tera] : SP[tgt.sp].t;
  const ef = E.eff(type, defTypes, {rondo: !!mv.rondo});
  if (o.item === 'lo') finalMods.push(5324);
  if (o.item === 'belt' && ef > 1) finalMods.push(4915);
  if (tgt.final) finalMods.push(...tgt.final);
  // STAB
  let stab = 4096;
  const orig = ['Dragon'];
  if (orig.includes(type)) stab = (o.tera === 'Dragon') ? 8192 : 6144;
  else if (o.tera && o.tera === type) stab = 6144;
  if (o.tera === 'Stellar' && o.stellar) stab = orig.includes(type) ? 8192 : 4915;
  const defMods = [];
  if (tgt.ruin && cat === 'phys' && tgt.sp !== 'chienpao') defMods.push(3072);
  const r = E.rolls({
    bp, bpMods, atk: atkStat, atkStage, atkMods,
    def: cat === 'phys' ? tgt.st.def : tgt.st.spd, defStage: tgt.defStage || 0, defMods,
    stab, eff: ef, spread: !!(o.doubles && mv.spread && o.spreadHit !== false), crit: !!o.crit,
    burn: !!(o.burn && cat === 'phys' && !mv.facade), finalMods
  });
  return Object.assign(E.summarize(r, tgt.st.hp), {type, cat, eff: ef});
}

// ---------- attacking Draffia ----------
function vsDrf(p, drf) {
  // p: {name, st (attacker stats), cat, bp, type, stab(bool) , teraSame(bool for 8192), bpMods, atkMods, finalMods, weather, spread, hits, crit, atkStage, ruinDef, item}
  // drf: {st, tera, defStage, intim(bool), final}
  const defTypes = drf.tera ? [drf.tera] : ['Dragon'];
  const ef = E.eff(p.type, defTypes);
  const phys = p.cat === 'phys';
  let atkStage = p.atkStage || 0;
  if (drf.intim && phys && !p.bodyPress) atkStage -= 1;
  const atkMods = (p.atkMods || []).slice();
  const finalMods = (p.finalMods || []).slice();
  if (p.belt && ef > 1) finalMods.push(4915);
  if (drf.final) finalMods.push(...drf.final);
  const defMods = [];
  if (p.ruinDef && phys) defMods.push(3072);
  if (p.beads && !phys) defMods.push(3072);
  const atkStat = p.bodyPress ? p.st.def : (phys ? p.st.atk : p.st.spa);
  const r = E.rolls({
    bp: p.bp, bpMods: p.bpMods || [], atk: atkStat, atkStage, atkMods,
    def: phys ? drf.st.def : drf.st.spd, defStage: drf.defStage || 0, defMods,
    stab: p.stab === undefined ? 4096 : p.stab, eff: ef, spread: !!p.spread, weatherMod: p.weather || 4096,
    crit: !!p.crit, finalMods
  });
  return Object.assign(E.summarize(r, drf.st.hp, p.hits || 1), {eff: ef});
}

module.exports = {stats, drfAtk, vsDrf, NAT};

if (require.main === module) {
  const fmt = (x) => x ? `${x.min}-${x.max} (${x.minPct.toFixed(1)}-${x.maxPct.toFixed(1)}%) ${x.ko.text}` : '—';
  // Draffia stat lines
  const D = {
    jollyAS: stats('draffia','jolly',{hp:4,atk:252,spe:252}),
    adamAS: stats('draffia','adamant',{hp:4,atk:252,spe:252}),
    H252: stats('draffia','jolly',{hp:252,atk:252,spe:4}),
    HB: stats('draffia','impish',{hp:252,def:252,spd:4}),
    HD: stats('draffia','careful',{hp:252,spd:252,def:4}),
  };
  for (const k in D) console.log(k, JSON.stringify(D[k]));
}
