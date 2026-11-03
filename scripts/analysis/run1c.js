const {drfAtk} = require('./calcs.js');
const {T, sets, moves} = require('./targets.js');
const short = (x) => x ? `${x.minPct.toFixed(0)}-${x.maxPct.toFixed(0)}%${x.ko.n===1?(x.ko.p===1?'◎':'○'+(x.ko.p*100).toFixed(0)):''}` : '—';
console.log('target/move :: ' + sets.map(s=>s[0]).join(' | '));
for (const tk in T) {
  const t = T[tk];
  for (const mv of moves) {
    const r0 = drfAtk(Object.assign({}, sets[0][1], {move: mv, target: t}));
    if (r0 && r0.eff === 0) continue;
    const cells = sets.map(([sl,s]) => short(drfAtk(Object.assign({}, s, {move: mv, target: t}))));
    console.log(`${t.lbl.padEnd(18,'　')} ${mv.padEnd(11)} x${r0?r0.eff:'-'} :: ${cells.join(' | ')}`);
  }
}
