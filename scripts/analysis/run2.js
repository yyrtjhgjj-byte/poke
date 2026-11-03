const {stats, vsDrf} = require('./calcs.js');
const {A} = require('./attackers.js');
const DS = {
  AS:  stats('draffia','jolly',{hp:4,atk:252,spe:252}),
  H:   stats('draffia','jolly',{hp:252,atk:252,spe:4}),
  HB:  stats('draffia','impish',{hp:252,def:252,spd:4}),
  HD:  stats('draffia','careful',{hp:252,spd:252,def:4}),
};
const short = (x) => `${x.minPct.toFixed(0)}-${x.maxPct.toFixed(0)}% ${x.ko.text.replace('乱数','乱').replace('確定','確')}`;
const cols = [['AS',{}],['H252',{}],['HB',{}],['HD',{}],['HB+威嚇',{intim:true}],['HD+威嚇',{intim:true}]];
const map = {AS:'AS',H252:'H',HB:'HB',HD:'HD','HB+威嚇':'HB','HD+威嚇':'HD'};
console.log('preset :: ' + cols.map(c=>c[0]).join(' | '));
for (const k in A) {
  const p = A[k];
  const cells = cols.map(([c,o]) => {
    const st = DS[map[c]];
    if (o.intim && p.cat !== 'phys') return '(特殊)';
    return short(vsDrf(p, Object.assign({st}, o)));
  });
  console.log(`${p.lbl}\n    ${cells.join(' | ')}`);
}
