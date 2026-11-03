const E = require('../../src/engine.js');
const {stats} = require('./calcs.js');
// speed line
const sp = [
 ['黒バドレックス','calyrexs','timid'],['ザシアン(王)','zacianc','jolly'],['コライドン','koraidon','jolly'],['ミライドン','miraidon','timid'],['ハバタクカミ','fluttermane','timid'],['パオジアン','chienpao','jolly'],['ムゲンダイナ','eternatus','timid'],['ザマゼンタ(王)','zamazentac','jolly'],['エルフーン','whimsicott','timid'],['トルネロス','tornadus','timid'],['オーガポン','ogerpon','jolly'],['テツノワダチ','irontreads','jolly'],['化身ランドロス','landoi','timid'],['イーユイ','chiyu','timid'],['連撃ウーラオス','urshifur','jolly'],['ルナアーラ','lunala','timid'],['ミミッキュ','mimikyu','jolly'],['グライオン','gliscor','jolly'],['霊獣ランドロス','landot','jolly'],['カイオーガ','kyogre','timid'],['ホウオウ','hooh','jolly'],['キラフロル','glimmora','timid'],['ゴリランダー','rillaboom','jolly'],['カイリュー','dragonite','jolly'],['タケルライコ','ragingbolt','timid'],['ガオガエン','incineroar','hardy'],['ニンフィア','sylveon','hardy'],
];
const out = sp.map(([n,k,nat]) => [n, stats(k, nat, {spe: nat==='hardy'?252:252}).spe]);
out.push(['ドラフィア(最速)', stats('draffia','jolly',{spe:252}).spe]);
out.push(['ドラフィア(準速)', stats('draffia','hardy',{spe:252}).spe]);
out.push(['ドラフィア(無振り)', stats('draffia','hardy',{spe:0}).spe]);
out.sort((a,b)=>b[1]-a[1]);
console.log(out.map(x=>x.join(':')).join('\n'));
// Sylveon speeds
const syl0 = stats('sylveon','modest',{hp:252,spa:252}).spe, sylS = stats('sylveon','modest',{spa:252,spe:252}).spe, sylT = stats('sylveon','timid',{spa:252,spe:252}).spe;
console.log('\nSylveon S0', syl0, '+2', E.boost(syl0,2), '| S252 modest', sylS, '+2', E.boost(sylS,2), '| timid', sylT, '+2', E.boost(sylT,2));
// tera matrix
const teras = ['Dragon','Steel','Fairy','Water','Fire','Ghost','Normal','Grass','Ground','Dark','Poison','Flying'];
const atk = ['Ice','Fairy','Dragon','Fighting','Ghost','Ground','Fire','Water','Electric','Grass','Dark','Steel','Normal','Flying','Rock','Poison','Psychic'];
console.log('\nTERA', atk.join(','));
for (const t of teras) console.log(t, atk.map(a => E.eff(a,[t])).join(','));
