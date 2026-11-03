const {calculate, Pokemon, Move, Field, Generations} = require('@smogon/calc');
const E = require('../src/engine.js');
const gen = Generations.get(9);

const DRF_BASE = {hp:95, atk:130, def:65, spa:60, spd:65, spe:110};
function draffia(opts) {
  return new Pokemon(gen, 'Eevee', Object.assign({
    level: 50, overrides: {baseStats: DRF_BASE, types: ['Dragon']}, ability: 'Run Away'
  }, opts));
}
function sc(desc, res, mine, hp) {
  const s = res.damage;
  const arr = Array.isArray(s) ? (Array.isArray(s[0]) ? s[0] : s) : [s];
  const ok = JSON.stringify(arr) === JSON.stringify(mine);
  console.log((ok ? 'OK  ' : 'DIFF') + ' | ' + desc);
  if (!ok) { console.log('   smogon:', arr.join(',')); console.log('   mine  :', mine.join(',')); }
  console.log('   ' + res.desc());
}

// 1. Draffia Jolly 252 Atk Dragon Claw vs Koraidon 4 HP
{
  const a = draffia({nature:'Jolly', evs:{atk:252, spe:252, hp:4}});
  const d = new Pokemon(gen, 'Koraidon', {level:50, nature:'Jolly', evs:{hp:4, atk:252, spe:252}});
  const m = new Move(gen, 'Dragon Claw');
  const r = calculate(gen, a, d, m);
  const mine = E.rolls({bp:80, atk:a.stats.atk, def:d.stats.def, stab:6144, eff:E.eff('Dragon', ['Fighting','Dragon'])});
  sc('Dragon Claw vs Koraidon', r, mine);
}
// 2. Adamant Band Dragonskin Double-Edge (Dragon 120 w/ ate boost) vs Ting-Lu 252/252+
{
  const a = draffia({nature:'Adamant', evs:{atk:252, spe:252}, item:'Choice Band'});
  const d = new Pokemon(gen, 'Ting-Lu', {level:50, nature:'Impish', evs:{hp:252, def:252}});
  // emulate ate: override type Dragon, BP 144 (=pokeRound(120*4915/4096))
  const m = new Move(gen, 'Double-Edge', {overrides:{type:'Dragon', basePower:144}});
  const r = calculate(gen, a, d, m);
  const mine = E.rolls({bp:120, bpMods:[4915], atk:a.rawStats.atk, atkMods:[6144], def:d.stats.def, stab:6144, eff:1});
  sc('Band Dskin Double-Edge vs Ting-Lu', r, mine);
}
// 3. Chien-Pao Adamant LO Icicle Crash vs Draffia 252 HP (Sword of Ruin)
{
  const a = new Pokemon(gen, 'Chien-Pao', {level:50, nature:'Adamant', evs:{atk:252, spe:252}, item:'Life Orb', ability:'Sword of Ruin'});
  const d = draffia({nature:'Jolly', evs:{hp:252, atk:252, spe:4}});
  const m = new Move(gen, 'Icicle Crash');
  const r = calculate(gen, a, d, m);
  const mine = E.rolls({bp:85, atk:a.stats.atk, def:d.stats.def, defMods:[3072], stab:6144, eff:2, finalMods:[5324]});
  sc('LO Icicle Crash vs Draffia (Ruin)', r, mine);
}
// 4. Flutter Mane Timid Moonblast vs Draffia 252/252+ SpD
{
  const a = new Pokemon(gen, 'Flutter Mane', {level:50, nature:'Timid', evs:{spa:252, spe:252}});
  const d = draffia({nature:'Careful', evs:{hp:252, spd:252}});
  const m = new Move(gen, 'Moonblast');
  const r = calculate(gen, a, d, m);
  const mine = E.rolls({bp:95, atk:a.stats.spa, def:d.stats.spd, stab:6144, eff:2});
  sc('Moonblast vs Draffia HD', r, mine);
}
// 5. Koraidon Adamant Flare Blitz in sun vs Draffia (Intimidated) 252/252+ Def
{
  const a = new Pokemon(gen, 'Koraidon', {level:50, nature:'Adamant', evs:{atk:252, spe:252}, ability:'Orichalcum Pulse', boosts:{atk:-1}});
  const d = draffia({nature:'Impish', evs:{hp:252, def:252}});
  const m = new Move(gen, 'Flare Blitz');
  const f = new Field({weather:'Sun'});
  const r = calculate(gen, a, d, m, f);
  const mine = E.rolls({bp:120, atk:a.rawStats.atk, atkStage:-1, atkMods:[5461], def:d.stats.def, stab:4096, eff:0.5, weatherMod:6144}); // Fire is not Koraidon's type: no STAB
  sc('Sun Flare Blitz vs Draffia HB (-1)', r, mine);
}
// 6. Miraidon Modest Specs Draco vs Draffia in E-terrain
{
  const a = new Pokemon(gen, 'Miraidon', {level:50, nature:'Modest', evs:{spa:252, spe:252}, item:'Choice Specs', ability:'Hadron Engine'});
  const d = draffia({nature:'Careful', evs:{hp:252, spd:252}});
  const m = new Move(gen, 'Draco Meteor');
  const f = new Field({terrain:'Electric'});
  const r = calculate(gen, a, d, m, f);
  const mine = E.rolls({bp:130, atk:a.rawStats.spa, atkMods:[6144, 5461], def:d.stats.spd, stab:6144, eff:2});
  sc('Specs Draco vs Draffia (E-terrain)', r, mine);
}
// 7. Calyrex-Ice Brave Glacial Lance spread (doubles) vs Draffia -1
{
  const a = new Pokemon(gen, 'Calyrex-Ice', {level:50, nature:'Brave', evs:{hp:252, atk:252}, boosts:{atk:-1}});
  const d = draffia({nature:'Impish', evs:{hp:252, def:252}});
  const m = new Move(gen, 'Glacial Lance');
  const f = new Field({gameType:'Doubles'});
  const r = calculate(gen, a, d, m, f);
  const mine = E.rolls({bp:120, atk:a.rawStats.atk, atkStage:-1, def:d.stats.def, stab:6144, eff:2, spread:true});
  sc('Glacial Lance spread vs Draffia (-1)', r, mine);
}
// 8. Urshifu-R Surging Strikes (crit) vs Draffia, attacker -1
{
  const a = new Pokemon(gen, 'Urshifu-Rapid-Strike', {level:50, nature:'Adamant', evs:{atk:252, spe:252}, item:'Choice Band', boosts:{atk:-1}});
  const d = draffia({nature:'Jolly', evs:{hp:252, atk:252}});
  const m = new Move(gen, 'Surging Strikes');
  const r = calculate(gen, a, d, m);
  const mine = E.rolls({bp:25, atk:a.rawStats.atk, atkStage:-1, atkMods:[6144], def:d.stats.def, stab:6144, eff:0.5, crit:true});
  sc('Band Surging Strikes vs Draffia (crit ignores -1)', r, mine);
}
// 9. Draffia Crunch vs Calyrex-Shadow
{
  const a = draffia({nature:'Jolly', evs:{atk:252, spe:252}});
  const d = new Pokemon(gen, 'Calyrex-Shadow', {level:50, nature:'Timid', evs:{spa:252, spe:252, hp:4}});
  const m = new Move(gen, 'Crunch');
  const r = calculate(gen, a, d, m);
  const mine = E.rolls({bp:80, atk:a.stats.atk, def:d.stats.def, stab:4096, eff:4});
  sc('Crunch vs Calyrex-S', r, mine);
}
// 10. Draffia Tera Dragon Dskin Double-Edge (proxy) vs Dondozo; Life Orb
{
  const a = draffia({nature:'Jolly', evs:{atk:252, spe:252}, item:'Life Orb', teraType:'Dragon'});
  const d = new Pokemon(gen, 'Dondozo', {level:50, nature:'Impish', evs:{hp:252, def:252}});
  const m = new Move(gen, 'Double-Edge', {overrides:{type:'Dragon', basePower:144}});
  const r = calculate(gen, a, d, m);
  const mine = E.rolls({bp:120, bpMods:[4915], atk:a.stats.atk, def:d.stats.def, stab:8192, eff:1, finalMods:[5324]});
  sc('Tera Dragon LO Dskin DE vs Dondozo', r, mine);
}
// 11. Rondo proxy: Dragon 75 vs Flutter Mane (proxy types Ghost/Dragon -> eff 2)
{
  const a = draffia({nature:'Jolly', evs:{atk:252, spe:252}});
  const d = new Pokemon(gen, 'Flutter Mane', {level:50, nature:'Timid', evs:{spa:252, spe:252, hp:4}, overrides:{types:['Ghost','Dragon']}});
  const m = new Move(gen, 'Dragon Claw', {overrides:{basePower:75}});
  const r = calculate(gen, a, d, m);
  const mine = E.rolls({bp:75, atk:a.stats.atk, def:d.stats.def, stab:6144, eff:E.eff('Dragon', ['Ghost','Fairy'], {rondo:true})});
  sc('Rondo vs Flutter Mane (proxy)', r, mine);
}
// 12. Helping Hand + Dskin Double-Edge (chain 4915*6144)
{
  const a = draffia({nature:'Jolly', evs:{atk:252, spe:252}});
  const d = new Pokemon(gen, 'Incineroar', {level:50, nature:'Careful', evs:{hp:252, def:4, spd:252}});
  const m = new Move(gen, 'Double-Edge', {overrides:{type:'Dragon'}}); // smogon ate not applied (no ability) -> use pixilate check separately
  const f = new Field({gameType:'Doubles', attackerSide:{isHelpingHand:true}});
  const r = calculate(gen, a, d, m, f);
  const mine = E.rolls({bp:120, bpMods:[6144], atk:a.stats.atk, def:d.stats.def, stab:6144, eff:1});
  sc('HH Double-Edge(Dragon,no ate) vs Incineroar', r, mine);
}
// 13. Pixilate check on chain: Sylveon Hyper Voice spread w/ HH
{
  const a = new Pokemon(gen, 'Sylveon', {level:50, nature:'Modest', evs:{spa:252, hp:252}, ability:'Pixilate'});
  const d = new Pokemon(gen, 'Incineroar', {level:50, nature:'Careful', evs:{hp:252, spd:252}});
  const m = new Move(gen, 'Hyper Voice');
  const f = new Field({gameType:'Doubles', attackerSide:{isHelpingHand:true}});
  const r = calculate(gen, a, d, m, f);
  const mine = E.rolls({bp:90, bpMods:[6144, 4915], atk:a.stats.spa, def:d.stats.spd, stab:6144, eff:1, spread:true});
  sc('HH Pixilate Hyper Voice spread vs Incineroar (chain order)', r, mine);
}
