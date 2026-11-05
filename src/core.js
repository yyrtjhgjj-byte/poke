/* RONDO LAB core: natures, stat calc, Draffia attack / defense wrappers, presets. Works in browser and Node. */
(function (root) {
  'use strict';
  const E = (typeof module !== 'undefined' && module.exports) ? require('./engine.js') : root.RondoEngine;
  const D = (typeof module !== 'undefined' && module.exports) ? require('./data.js') : root.RondoData;
  const SP = D.SP, DM = D.DM;

  const NAT = {
    jolly:{jp:'ようき', spe:1.1, spa:0.9}, adamant:{jp:'いじっぱり', atk:1.1, spa:0.9}, modest:{jp:'ひかえめ', spa:1.1, atk:0.9},
    timid:{jp:'おくびょう', spe:1.1, atk:0.9}, impish:{jp:'わんぱく', def:1.1, spa:0.9}, careful:{jp:'しんちょう', spd:1.1, spa:0.9},
    bold:{jp:'ずぶとい', def:1.1, atk:0.9}, calm:{jp:'おだやか', spd:1.1, atk:0.9}, brave:{jp:'ゆうかん', atk:1.1, spe:0.9},
    relaxed:{jp:'のんき', def:1.1, spe:0.9}, sassy:{jp:'なまいき', spd:1.1, spe:0.9}, hardy:{jp:'てれや（無補正）'}
  };
  const KEYS = ['hp','atk','def','spa','spd','spe'];
  function stats(sp, nat, ev, iv) {
    const b = SP[sp].b; ev = ev || {}; iv = iv || {}; const n = NAT[nat || 'hardy'];
    const o = {};
    KEYS.forEach((k, i) => { o[k] = E.calcStat(b[i], ev[k] || 0, iv[k] === undefined ? 31 : iv[k], (n[k] || 1), k === 'hp'); });
    return o;
  }

  // ---------- Draffia attacking ----------
  // o: {st, skin, move, item('band'|'lo'|'belt'|''), tera, stellar, atkStage, crit, hh, burn, statused, doubles,
  //     target:{sp, st, tera, defStage, final[], ruin, reflect('single'|'double'|null)}}
  function drfAtk(o) {
    const mv = DM[o.move];
    if (mv.rondo && !o.skin) return null;
    let type = mv.type, bp = mv.bp; const bpMods = [];
    if (o.hh) bpMods.push(6144);
    const skinned = !!(mv.skin && o.skin && type === 'Normal');
    if (skinned) { type = SP.draffia.skin; bpMods.push(4915); }
    if (mv.facade && o.statused) bp = mv.bp * (o.move === 'facade' ? 2 : 1);
    const cat = 'phys';  // ドラフィアの攻撃技はすべて物理（ロンドも物理技）
    const atkStat = o.st.atk;
    const atkStage = o.atkStage || 0;
    const atkMods = [];
    if (o.item === 'band' && cat === 'phys') atkMods.push(6144);
    const tgt = o.target;
    const defTypes = tgt.tera ? [tgt.tera] : SP[tgt.sp].t;
    const ef = E.eff(type, defTypes, {rondo: !!mv.rondo});
    const finalMods = [];
    if (tgt.reflect && !o.crit && cat === 'phys') finalMods.push(tgt.reflect === 'double' ? 2732 : 2048);
    if (o.item === 'lo') finalMods.push(5324);
    if (o.item === 'belt' && ef > 1) finalMods.push(4915);
    if (tgt.final) finalMods.push(...tgt.final);
    const own = SP.draffia.t;
    let stab = 4096;
    if (own.includes(type)) stab = (o.tera === type) ? 8192 : 6144;
    else if (o.tera && o.tera !== 'Stellar' && o.tera === type) stab = 6144;
    if (o.tera === 'Stellar' && o.stellar) stab = own.includes(type) ? 8192 : 4915;
    const defMods = [];
    if (tgt.ruin && cat === 'phys' && tgt.sp !== 'chienpao') defMods.push(3072);
    const r = E.rolls({
      bp, bpMods, atk: atkStat, atkStage, atkMods,
      def: cat === 'phys' ? tgt.st.def : tgt.st.spd, defStage: tgt.defStage || 0, defMods,
      stab, eff: ef, spread: !!(o.doubles && mv.spread), crit: !!o.crit,
      burn: !!(o.burn && cat === 'phys' && !mv.facade), finalMods
    });
    return Object.assign(E.summarize(r, tgt.st.hp), {type, cat, eff: ef, skinned, bp, stab});
  }

  // ---------- opponent attacking Draffia ----------
  // p: attack preset with st; drf: {st, tera, intim, haban, av, screen('single'|'double'|null)}
  function vsDrf(p, drf) {
    const defTypes = drf.tera ? [drf.tera] : SP.draffia.t;
    const ef = E.eff(p.type, defTypes);
    const phys = p.cat === 'phys';
    let atkStage = p.atkStage || 0;
    if (drf.intim && phys && !p.bodyPress) atkStage -= 1;
    const finalMods = (p.finalMods || []).slice();
    if (drf.screen && !p.crit) finalMods.push(drf.screen === 'double' ? 2732 : 2048);
    if (drf.haban && p.type === 'Dragon' && ef > 1) finalMods.push(2048);
    const defMods = [];
    if (p.ruinDef && phys) defMods.push(3072);
    if (p.beads && !phys) defMods.push(3072);
    if (drf.av && !phys) defMods.push(6144);
    const atkStat = p.bodyPress ? p.st.def : (phys ? p.st.atk : p.st.spa);
    let stab = p.stab === undefined ? 4096 : p.stab;
    const r = E.rolls({
      bp: p.bp, bpMods: p.bpMods || [], atk: atkStat, atkStage, atkMods: p.atkMods || [],
      def: phys ? drf.st.def : drf.st.spd, defStage: 0, defMods,
      stab, eff: ef, spread: !!p.spread, weatherMod: p.weather || 4096, crit: !!p.crit, finalMods
    });
    return Object.assign(E.summarize(r, drf.st.hp, p.hits || 1), {eff: ef});
  }

  // ---------- presets ----------
  const TARGETS = [
    ['flutter_cs','fluttermane','timid',{hp:4,spa:252,spe:252},'ハバタクカミ（H4 CS）'],
    ['flutter_hb','fluttermane','bold',{hp:252,def:252},'ハバタクカミ（HB特化）'],
    ['chienpao_as','chienpao','jolly',{hp:4,atk:252,spe:252},'パオジアン（H4 AS）'],
    ['koraidon_as','koraidon','jolly',{hp:4,atk:252,spe:252},'コライドン（H4 AS）'],
    ['koraidon_h','koraidon','adamant',{hp:252,atk:252,def:4},'コライドン（H252 A252）'],
    ['miraidon_cs','miraidon','timid',{hp:4,spa:252,spe:252},'ミライドン（H4 CS）'],
    ['miraidon_h','miraidon','modest',{hp:252,spa:252,def:4},'ミライドン（H252 C252）'],
    ['calyrexs_cs','calyrexs','timid',{hp:4,spa:252,spe:252},'黒バドレックス（H4 CS）'],
    ['calyrexi_ha','calyrexi','brave',{hp:252,atk:252},'白バドレックス（H252 A252）'],
    ['zacianc_as','zacianc','jolly',{hp:4,atk:252,spe:252},'ザシアン(王)（H4 AS）'],
    ['zamazenta_hb','zamazentac','impish',{hp:252,def:252},'ザマゼンタ(王)（HB特化・B+1）',{defStage:1}],
    ['urshifur_as','urshifur','jolly',{hp:4,atk:252,spe:252},'連撃ウーラオス（H4 AS）'],
    ['tinglu_hb','tinglu','impish',{hp:252,def:252},'ディンルー（HB特化）'],
    ['tinglu_hd','tinglu','careful',{hp:252,spd:252},'ディンルー（HD特化）'],
    ['landot_hb','landot','impish',{hp:252,def:252},'霊獣ランドロス（HB特化）'],
    ['hooh_hb','hooh','impish',{hp:252,def:252},'ホウオウ（HB特化）'],
    ['dondozo_hb','dondozo','impish',{hp:252,def:252},'ヘイラッシャ（HB特化）'],
    ['dragonite_h','dragonite','adamant',{hp:252,atk:252,def:4},'カイリュー（H252・マルチスケイル）',{final:[2048]}],
    ['glimmora_cs','glimmora','timid',{hp:4,spa:252,spe:252},'キラフロル（H4 CS）'],
    ['ursalunab_h','ursalunab','modest',{hp:252,spa:252},'アカツキガチグマ（H252 C252）'],
    ['kyogre_cs','kyogre','modest',{hp:4,spa:252,spe:252},'カイオーガ（H4 CS）'],
    ['grimmsnarl_hb','grimmsnarl','impish',{hp:252,def:252},'オーロンゲ（HB特化）'],
    ['mimikyu_as','mimikyu','jolly',{hp:4,atk:252,spe:252},'ミミッキュ（H4 AS・化けの皮後）'],
    ['ogerpon_as','ogerpon','jolly',{hp:4,atk:252,spe:252},'オーガポン（H4 AS）'],
    ['gliscor_hb','gliscor','impish',{hp:244,def:252},'グライオン（H244 B252）'],
    ['garganacl_hb','garganacl','impish',{hp:252,def:252},'キョジオーン（HB特化）'],
    ['incin_hb','incineroar','impish',{hp:252,def:252},'ガオガエン（HB特化）'],
    ['incin_hd','incineroar','careful',{hp:252,spd:252,def:4},'ガオガエン（HD特化）'],
    ['whims_h','whimsicott','timid',{hp:252,spe:252},'エルフーン（H252 S252）'],
    ['rilla_ha','rillaboom','adamant',{hp:252,atk:252},'ゴリランダー（H252 A252）'],
    ['lunala_hb','lunala','bold',{hp:252,def:252},'ルナアーラ（HB特化・シャドーシールド）',{final:[2048]}],
    ['tornadus_h','tornadus','timid',{hp:252,spe:252},'トルネロス（H252 S252）'],
    ['bolt_h','ragingbolt','modest',{hp:252,spa:252},'タケルライコ（H252 C252）'],
    ['amoong_hb','amoonguss','relaxed',{hp:252,def:252},'モロバレル（HB特化）'],
    ['indeedee_hb','indeedeef','relaxed',{hp:252,def:252},'イエッサン♀（HB特化）'],
    ['farigiraf_hb','farigiraf','relaxed',{hp:252,def:252},'リキキリン（HB特化）'],
    ['ironhands_ha','ironhands','adamant',{hp:252,atk:252},'テツノカイナ（H252 A252）'],
    ['kingambit_ha','kingambit','adamant',{hp:252,atk:252},'ドドゲザン（H252 A252）'],
    ['gholdengo_h','gholdengo','modest',{hp:252,spa:252},'サーフゴー（H252 C252）'],
    ['chiyu_cs','chiyu','timid',{hp:4,spa:252,spe:252},'イーユイ（H4 CS）'],
    ['eternatus_h','eternatus','timid',{hp:252,spe:252},'ムゲンダイナ（H252 S252）'],
    ['clodsire_hb','clodsire','impish',{hp:252,def:252},'ドオー（HB特化）'],
    ['sylveon_hc','sylveon','modest',{hp:252,spa:252},'ニンフィア（H252 C252）']
  ].map(([key, sp, nat, ev, label, extra]) => Object.assign({key, sp, nat, ev, label, st: stats(sp, nat, ev)}, extra || {}));

  const ATTACKS = [
    // [key, group, label, sp, nat, ev, move props]
    ['pao_icicle_lo','S','パオジアン｜意地 A252・いのちのたま｜つららおとし','chienpao','adamant',{atk:252,spe:252},{cat:'phys',bp:85,type:'Ice',stab:6144,finalMods:[5324],ruinDef:true}],
    ['pao_icicle_none','S','パオジアン｜陽気 A252・きあいのタスキ｜つららおとし','chienpao','jolly',{atk:252,spe:252},{cat:'phys',bp:85,type:'Ice',stab:6144,ruinDef:true}],
    ['pao_shard_lo','S','パオジアン｜意地 A252・いのちのたま｜こおりのつぶて','chienpao','adamant',{atk:252,spe:252},{cat:'phys',bp:40,type:'Ice',stab:6144,finalMods:[5324],ruinDef:true}],
    ['fm_moon_timid','S','ハバタクカミ｜臆病 C252｜ムーンフォース','fluttermane','timid',{spa:252,spe:252},{cat:'spec',bp:95,type:'Fairy',stab:6144}],
    ['fm_moon_specs','S','ハバタクカミ｜臆病 C252・こだわりメガネ｜ムーンフォース','fluttermane','timid',{spa:252,spe:252},{cat:'spec',bp:95,type:'Fairy',stab:6144,atkMods:[6144]}],
    ['kor_outrage','S','コライドン｜意地 A252・晴れ（ひひいろ）｜げきりん','koraidon','adamant',{atk:252,spe:252},{cat:'phys',bp:120,type:'Dragon',stab:6144,atkMods:[5461]}],
    ['kor_scale','S','コライドン｜意地 A252・晴れ・いかさまダイス｜スケイルショット4発','koraidon','adamant',{atk:252,spe:252},{cat:'phys',bp:25,type:'Dragon',stab:6144,atkMods:[5461],hits:4}],
    ['kor_cc','B','コライドン｜意地 A252・晴れ｜アクセルブレイク','koraidon','adamant',{atk:252,spe:252},{cat:'phys',bp:100,type:'Fighting',stab:6144,atkMods:[5461]}],
    ['kor_flare','S','コライドン｜意地 A252・晴れ・テラス炎｜フレアドライブ','koraidon','adamant',{atk:252,spe:252},{cat:'phys',bp:120,type:'Fire',stab:6144,atkMods:[5461],weather:6144}],
    ['mir_draco','B','ミライドン｜控えめ C252・EF（ハドロン）｜りゅうせいぐん','miraidon','modest',{spa:252,spe:252},{cat:'spec',bp:130,type:'Dragon',stab:6144,atkMods:[5461]}],
    ['mir_draco_specs','B','ミライドン｜控えめ C252・EF・こだわりメガネ｜りゅうせいぐん','miraidon','modest',{spa:252,spe:252},{cat:'spec',bp:130,type:'Dragon',stab:6144,atkMods:[6144,5461]}],
    ['mir_drift_specs','B','ミライドン｜控えめ C252・EF・こだわりメガネ｜イナズマドライブ','miraidon','modest',{spa:252,spe:252},{cat:'spec',bp:100,type:'Electric',stab:6144,bpMods:[5325],atkMods:[6144,5461]}],
    ['cs_barrage','S','黒バドレックス｜臆病 C252｜アストラルビット','calyrexs','timid',{spa:252,spe:252},{cat:'spec',bp:120,type:'Ghost',stab:6144}],
    ['cs_barrage_specs','S','黒バドレックス｜臆病 C252・こだわりメガネ｜アストラルビット','calyrexs','timid',{spa:252,spe:252},{cat:'spec',bp:120,type:'Ghost',stab:6144,atkMods:[6144]}],
    ['zac_pr','S','ザシアン(王)｜陽気 A252・ふとうのけん+1｜じゃれつく','zacianc','jolly',{atk:252,spe:252},{cat:'phys',bp:90,type:'Fairy',stab:6144,atkStage:1}],
    ['zac_bb','S','ザシアン(王)｜陽気 A252・ふとうのけん+1｜きょじゅうざん','zacianc','jolly',{atk:252,spe:252},{cat:'phys',bp:100,type:'Steel',stab:6144,atkStage:1}],
    ['ursr_cc_band','B','連撃ウーラオス｜意地 A252・こだわりハチマキ｜インファイト','urshifur','adamant',{atk:252,spe:252},{cat:'phys',bp:120,type:'Fighting',stab:6144,atkMods:[6144]}],
    ['ursr_ss_band','B','連撃ウーラオス｜意地 A252・こだわりハチマキ｜すいりゅうれんだ（急所×3）','urshifur','adamant',{atk:252,spe:252},{cat:'phys',bp:25,type:'Water',stab:6144,atkMods:[6144],crit:true,hits:3}],
    ['tinglu_eq','S','ディンルー｜わんぱく H252 B252｜じしん','tinglu','impish',{hp:252,def:252},{cat:'phys',bp:100,type:'Ground',stab:6144}],
    ['lando_eq','S','霊獣ランドロス｜意地 A252｜じしん','landot','adamant',{atk:252,spe:252},{cat:'phys',bp:100,type:'Ground',stab:6144}],
    ['hooh_bb','S','ホウオウ｜意地 H252 A252｜ブレイブバード','hooh','adamant',{hp:252,atk:252},{cat:'phys',bp:120,type:'Flying',stab:6144}],
    ['dnite_es','S','カイリュー｜意地 A252・こだわりハチマキ｜しんそく','dragonite','adamant',{atk:252,spe:252},{cat:'phys',bp:80,type:'Normal',stab:6144,atkMods:[6144]}],
    ['ursb_bm','S','アカツキガチグマ｜控えめ H252 C252｜ブラッドムーン','ursalunab','modest',{hp:252,spa:252},{cat:'spec',bp:140,type:'Normal',stab:6144}],
    ['kyo_icebeam','B','カイオーガ｜控えめ C252｜れいとうビーム','kyogre','modest',{spa:252,spe:252},{cat:'spec',bp:90,type:'Ice'}],
    ['kyo_spout','S','カイオーガ｜控えめ C252・こだわりメガネ・雨｜しおふき','kyogre','modest',{spa:252,spe:252},{cat:'spec',bp:150,type:'Water',stab:6144,atkMods:[6144],weather:6144}],
    ['mimi_pr','S','ミミッキュ｜陽気 A252｜じゃれつく','mimikyu','jolly',{atk:252,spe:252},{cat:'phys',bp:90,type:'Fairy',stab:6144}],
    ['glim_gem','S','キラフロル｜控えめ C252｜パワージェム','glimmora','modest',{spa:252,spe:252},{cat:'spec',bp:80,type:'Rock',stab:6144}],
    ['mir_gleam_specs_d','D','ミライドン｜控えめ C252・EF・こだわりメガネ｜マジカルシャイン（全体）','miraidon','modest',{spa:252,spe:252},{cat:'spec',bp:80,type:'Fairy',atkMods:[6144,5461],spread:true}],
    ['fm_gleam_d','D','ハバタクカミ｜臆病 C252｜マジカルシャイン（全体）','fluttermane','timid',{spa:252,spe:252},{cat:'spec',bp:80,type:'Fairy',stab:6144,spread:true}],
    ['fm_icywind_d','D','ハバタクカミ｜臆病 C252｜こごえるかぜ（全体）','fluttermane','timid',{spa:252,spe:252},{cat:'spec',bp:55,type:'Ice',spread:true}],
    ['cs_barrage_specs_d','D','黒バドレックス｜臆病 C252・こだわりメガネ｜アストラルビット（全体）','calyrexs','timid',{spa:252,spe:252},{cat:'spec',bp:120,type:'Ghost',stab:6144,spread:true,atkMods:[6144]}],
    ['ci_lance_d','D','白バドレックス｜勇敢 H252 A252｜ブリザードランス（全体）','calyrexi','brave',{hp:252,atk:252},{cat:'phys',bp:120,type:'Ice',stab:6144,spread:true}],
    ['zama_bp_d','D','ザマゼンタ(王)｜わんぱく H252 B252・B+1｜ボディプレス','zamazentac','impish',{hp:252,def:252},{cat:'phys',bp:80,type:'Fighting',stab:6144,bodyPress:true,atkStage:1}],
    ['kyo_spout_d','D','カイオーガ｜控えめ C252・こだわりメガネ・雨｜しおふき（全体）','kyogre','modest',{spa:252,spe:252},{cat:'spec',bp:150,type:'Water',stab:6144,atkMods:[6144],weather:6144,spread:true}],
    ['bolt_draco_d','D','タケルライコ｜控えめ H252 C252｜りゅうせいぐん','ragingbolt','modest',{hp:252,spa:252},{cat:'spec',bp:130,type:'Dragon',stab:6144}],
    ['incin_knock_d','D','ガオガエン｜意地 H252 A252｜はたきおとす（道具あり）','incineroar','adamant',{hp:252,atk:252},{cat:'phys',bp:65,type:'Dark',stab:6144,bpMods:[6144]}],
    ['tornadus_bleak_d','D','トルネロス｜臆病 C252｜ぼうふざん（全体）','tornadus','timid',{spa:252,spe:252},{cat:'spec',bp:100,type:'Flying',stab:6144,spread:true}],
    ['ursaluna_facade_d','D','ガチグマ｜意地 H252 A252・こんじょう｜からげんき','ursaluna','adamant',{hp:252,atk:252},{cat:'phys',bp:140,type:'Normal',stab:6144,atkMods:[6144]}],
    ['lunala_mg_d','D','ルナアーラ｜控えめ H252 C252｜シャドーレイ','lunala','modest',{hp:252,spa:252},{cat:'spec',bp:100,type:'Ghost',stab:6144}],
    ['chiyu_dp_d','D','イーユイ｜臆病 C252｜あくのはどう','chiyu','timid',{spa:252,spe:252},{cat:'spec',bp:80,type:'Dark',stab:6144,beads:true}]
  ].map(([key, group, label, sp, nat, ev, mv]) => Object.assign({key, group, label, sp, nat, ev, st: stats(sp, nat, ev)}, mv));

  const api = {E, SP, DM, NAT, stats, drfAtk, vsDrf, TARGETS, ATTACKS,
    target: (k) => TARGETS.find(t => t.key === k), attack: (k) => ATTACKS.find(a => a.key === k)};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RondoCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
