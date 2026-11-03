/* RONDO LAB damage engine — Gen9 (SV) formula, Showdown-equivalent rounding */
(function (root) {
  'use strict';

  const TYPES = ['Normal','Fire','Water','Electric','Grass','Ice','Fighting','Poison','Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy'];
  const JP = {Normal:'ノーマル',Fire:'ほのお',Water:'みず',Electric:'でんき',Grass:'くさ',Ice:'こおり',Fighting:'かくとう',Poison:'どく',Ground:'じめん',Flying:'ひこう',Psychic:'エスパー',Bug:'むし',Rock:'いわ',Ghost:'ゴースト',Dragon:'ドラゴン',Dark:'あく',Steel:'はがね',Fairy:'フェアリー',Stellar:'ステラ'};

  // attacking type -> defending type multiplier (only non-1 entries)
  const CHART = {
    Normal:{Rock:.5,Ghost:0,Steel:.5},
    Fire:{Fire:.5,Water:.5,Grass:2,Ice:2,Bug:2,Rock:.5,Dragon:.5,Steel:2},
    Water:{Fire:2,Water:.5,Grass:.5,Ground:2,Rock:2,Dragon:.5},
    Electric:{Water:2,Electric:.5,Grass:.5,Ground:0,Flying:2,Dragon:.5},
    Grass:{Fire:.5,Water:2,Grass:.5,Poison:.5,Ground:2,Flying:.5,Bug:.5,Rock:2,Dragon:.5,Steel:.5},
    Ice:{Fire:.5,Water:.5,Grass:2,Ice:.5,Ground:2,Flying:2,Dragon:2,Steel:.5},
    Fighting:{Normal:2,Ice:2,Poison:.5,Flying:.5,Psychic:.5,Bug:.5,Rock:2,Ghost:0,Dark:2,Steel:2,Fairy:.5},
    Poison:{Grass:2,Poison:.5,Ground:.5,Rock:.5,Ghost:.5,Steel:0,Fairy:2},
    Ground:{Fire:2,Electric:2,Grass:.5,Poison:2,Flying:0,Bug:.5,Rock:2,Steel:2},
    Flying:{Electric:.5,Grass:2,Fighting:2,Bug:2,Rock:.5,Steel:.5},
    Psychic:{Fighting:2,Poison:2,Psychic:.5,Dark:0,Steel:.5},
    Bug:{Fire:.5,Grass:2,Fighting:.5,Poison:.5,Flying:.5,Psychic:2,Ghost:.5,Dark:2,Steel:.5,Fairy:.5},
    Rock:{Fire:2,Ice:2,Fighting:.5,Ground:.5,Flying:2,Bug:2,Steel:.5},
    Ghost:{Normal:0,Psychic:2,Ghost:2,Dark:.5},
    Dragon:{Dragon:2,Steel:.5,Fairy:0},
    Dark:{Fighting:.5,Psychic:2,Ghost:2,Dark:.5,Fairy:.5},
    Steel:{Fire:.5,Water:.5,Electric:.5,Ice:2,Rock:2,Steel:.5,Fairy:2},
    Fairy:{Fire:.5,Fighting:2,Poison:.5,Dragon:2,Dark:2,Steel:.5}
  };

  function eff(moveType, defTypes, opt) {
    opt = opt || {};
    let m = 1;
    for (const t of defTypes) {
      if (opt.rondo && (t === 'Fairy' || t === 'Ice')) { m *= 2; continue; }
      const row = CHART[moveType] || {};
      m *= (row[t] === undefined ? 1 : row[t]);
    }
    return m;
  }

  function pokeRound(x) { return (x % 1 > 0.5) ? Math.ceil(x) : Math.floor(x); }
  function chain(mods) {
    let M = 4096;
    for (const m of mods || []) if (m !== 4096) M = (M * m + 2048) >> 12;
    return M;
  }
  function boost(stat, st) {
    if (st > 0) return Math.floor(stat * (2 + st) / 2);
    if (st < 0) return Math.floor(stat * 2 / (2 - st));
    return stat;
  }
  function calcStat(base, ev, iv, nat, isHP, level) {
    level = level || 50; iv = (iv === undefined ? 31 : iv);
    const core = Math.floor((2 * base + iv + Math.floor(ev / 4)) * level / 100);
    if (isHP) return core + level + 10;
    return Math.floor((core + 5) * nat);
  }

  /*
   p = {
     level, bp, bpMods[], atk, atkStage, atkMods[], def, defStage, defMods[],
     stab (4096|6144|8192), eff, spread, weatherMod, crit, burn, finalMods[]
   }
   returns 16 rolls (per hit)
  */
  function rolls(p) {
    const level = p.level || 50;
    if (!p.eff) return new Array(16).fill(0);
    const BP = Math.max(1, pokeRound(p.bp * chain(p.bpMods) / 4096));
    let as = p.atkStage || 0; if (p.crit && as < 0) as = 0;
    let A = boost(p.atk, as);
    A = Math.max(1, pokeRound(A * chain(p.atkMods) / 4096));
    let ds = p.defStage || 0; if (p.crit && ds > 0) ds = 0;
    let D = boost(p.def, ds);
    D = Math.max(1, pokeRound(D * chain(p.defMods) / 4096));
    let base = Math.floor(Math.floor(Math.floor(Math.floor(2 * level / 5 + 2) * BP) * A / D) / 50) + 2;
    if (p.spread) base = pokeRound(base * 3072 / 4096);
    if (p.weatherMod && p.weatherMod !== 4096) base = pokeRound(base * p.weatherMod / 4096);
    if (p.crit) base = Math.floor(base * 1.5);
    const fm = chain(p.finalMods);
    const out = [];
    for (let i = 0; i < 16; i++) {
      let d = Math.floor(base * (85 + i) / 100);
      if (p.stab && p.stab !== 4096) d = d * p.stab / 4096;
      d = Math.floor(pokeRound(d) * p.eff);
      if (p.burn) d = Math.floor(d / 2);
      d = pokeRound(Math.max(1, d * fm / 4096));
      out.push(d);
    }
    return out;
  }

  // distribution helpers
  function distOf(r) { const m = new Map(); for (const x of r) m.set(x, (m.get(x) || 0) + 1 / r.length); return m; }
  function conv(a, b) {
    const m = new Map();
    for (const [x, px] of a) for (const [y, py] of b) m.set(x + y, (m.get(x + y) || 0) + px * py);
    return m;
  }
  function perUse(r, hits) { let d = distOf(r); let acc = d; for (let i = 1; i < (hits || 1); i++) acc = conv(acc, d); return acc; }
  function koChance(use, hp, n) {
    let acc = use; for (let i = 1; i < n; i++) acc = conv(acc, use);
    let p = 0; for (const [x, px] of acc) if (x >= hp) p += px; return p;
  }
  function koText(r, hp, hits) {
    hits = hits || 1;
    const use = perUse(r, hits);
    let min = Infinity, max = 0; for (const [x] of use) { if (x < min) min = x; if (x > max) max = x; }
    if (max <= 0) return { n: 0, p: 0, text: '効果なし' };
    for (let n = 1; n <= 8; n++) {
      if (min * n >= hp) return { n, p: 1, text: '確定' + n + '発' };
      if (max * n >= hp) {
        const p = n <= 4 ? koChance(use, hp, n) : null;
        if (p === null) return { n, p: null, text: '乱数' + n + '発' };
        if (p >= 0.9999) return { n, p: 1, text: '確定' + n + '発' };
        return { n, p, text: '乱数' + n + '発(' + (p * 100).toFixed(1) + '%)' };
      }
    }
    return { n: 9, p: 0, text: '9発以上' };
  }
  function summarize(r, hp, hits) {
    hits = hits || 1;
    const lo = r[0] * hits, hi = r[15] * hits;
    const ko = koText(r, hp, hits);
    return { rolls: r, hits, min: lo, max: hi, minPct: lo / hp * 100, maxPct: hi / hp * 100, ko };
  }

  const api = { TYPES, JP, CHART, eff, pokeRound, chain, boost, calcStat, rolls, summarize, koText };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RondoEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
