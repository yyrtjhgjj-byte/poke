/* RONDO LAB dataset: species / moves / presets (SV Reg I) */
(function (root) {
  'use strict';
  // base stats verified against @smogon/calc gen9 data
  const SP = {
    // ▼ 検体の性能。ここを書き換えて npm run build（b = H/A/B/C/D/S、t = タイプ、skin = スキン特性の変換先）
    draffia:   {jp:'ドラフィア', b:[95,130,65,60,65,110], t:['Dragon'], skin:'Dragon'},
    koraidon:  {jp:'コライドン', b:[100,135,115,85,100,135], t:['Fighting','Dragon']},
    miraidon:  {jp:'ミライドン', b:[100,85,100,135,115,135], t:['Electric','Dragon']},
    chienpao:  {jp:'パオジアン', b:[80,120,80,90,65,135], t:['Dark','Ice']},
    tinglu:    {jp:'ディンルー', b:[155,110,125,55,80,45], t:['Dark','Ground']},
    calyrexs:  {jp:'黒バドレックス', b:[100,85,80,165,100,150], t:['Psychic','Ghost']},
    calyrexi:  {jp:'白バドレックス', b:[100,165,150,85,130,50], t:['Psychic','Ice']},
    fluttermane:{jp:'ハバタクカミ', b:[55,55,55,135,135,135], t:['Ghost','Fairy']},
    urshifur:  {jp:'連撃ウーラオス', b:[100,130,100,63,60,97], t:['Fighting','Water']},
    urshifus:  {jp:'一撃ウーラオス', b:[100,130,100,63,60,97], t:['Fighting','Dark']},
    landot:    {jp:'霊獣ランドロス', b:[89,145,90,105,80,91], t:['Ground','Flying']},
    landoi:    {jp:'化身ランドロス', b:[89,125,90,115,80,101], t:['Ground','Flying']},
    hooh:      {jp:'ホウオウ', b:[106,130,90,110,154,90], t:['Fire','Flying']},
    dondozo:   {jp:'ヘイラッシャ', b:[150,100,115,65,65,35], t:['Water']},
    zacianc:   {jp:'ザシアン(王)', b:[92,150,115,80,115,148], t:['Fairy','Steel']},
    zamazentac:{jp:'ザマゼンタ(王)', b:[92,120,140,80,140,128], t:['Fighting','Steel']},
    dragonite: {jp:'カイリュー', b:[91,134,95,100,100,80], t:['Dragon','Flying']},
    glimmora:  {jp:'キラフロル', b:[83,55,90,130,81,86], t:['Rock','Poison']},
    ursalunab: {jp:'アカツキガチグマ', b:[113,70,120,135,65,52], t:['Ground','Normal']},
    ursaluna:  {jp:'ガチグマ', b:[130,140,105,45,80,50], t:['Ground','Normal']},
    kyogre:    {jp:'カイオーガ', b:[100,100,90,150,140,90], t:['Water']},
    groudon:   {jp:'グラードン', b:[100,150,140,100,90,90], t:['Ground']},
    grimmsnarl:{jp:'オーロンゲ', b:[95,120,65,95,75,60], t:['Dark','Fairy']},
    mimikyu:   {jp:'ミミッキュ', b:[55,90,80,50,105,96], t:['Ghost','Fairy']},
    ogerpon:   {jp:'オーガポン', b:[80,120,84,60,96,110], t:['Grass']},
    gliscor:   {jp:'グライオン', b:[75,95,125,45,75,95], t:['Ground','Flying']},
    garganacl: {jp:'キョジオーン', b:[100,100,130,45,90,35], t:['Rock']},
    incineroar:{jp:'ガオガエン', b:[95,115,90,80,90,60], t:['Fire','Dark']},
    whimsicott:{jp:'エルフーン', b:[60,67,85,77,75,116], t:['Grass','Fairy']},
    rillaboom: {jp:'ゴリランダー', b:[100,125,90,60,70,85], t:['Grass']},
    lunala:    {jp:'ルナアーラ', b:[137,113,89,137,107,97], t:['Psychic','Ghost']},
    tornadus:  {jp:'トルネロス', b:[79,115,70,125,80,111], t:['Flying']},
    ragingbolt:{jp:'タケルライコ', b:[125,73,91,137,89,75], t:['Electric','Dragon']},
    amoonguss: {jp:'モロバレル', b:[114,85,70,85,80,30], t:['Grass','Poison']},
    indeedeef: {jp:'イエッサン♀', b:[70,55,65,95,105,85], t:['Psychic','Normal']},
    ironhands: {jp:'テツノカイナ', b:[154,140,108,50,68,50], t:['Fighting','Electric']},
    farigiraf: {jp:'リキキリン', b:[120,90,70,110,70,60], t:['Normal','Psychic']},
    chiyu:     {jp:'イーユイ', b:[55,80,80,135,120,100], t:['Dark','Fire']},
    eternatus: {jp:'ムゲンダイナ', b:[140,85,95,145,95,130], t:['Poison','Dragon']},
    kingambit: {jp:'ドドゲザン', b:[100,135,120,60,85,50], t:['Dark','Steel']},
    gholdengo: {jp:'サーフゴー', b:[87,60,95,133,91,84], t:['Steel','Ghost']},
    irontreads:{jp:'テツノワダチ', b:[90,112,120,72,70,106], t:['Ground','Steel']},
    clodsire:  {jp:'ドオー', b:[130,75,60,45,100,20], t:['Poison','Ground']},
    sylveon:   {jp:'ニンフィア', b:[95,65,65,110,130,60], t:['Fairy']},
    archaludon:{jp:'ブリジュラス', b:[90,105,130,125,65,85], t:['Steel','Dragon']},
    palkiao:   {jp:'オリジンパルキア', b:[90,100,100,150,120,120], t:['Water','Dragon']}
  };

  // Draffia move list (user-specified learnset)
  const DM = {
    rondo:       {jp:'ドラゴニックロンド', bp:75, type:'Dragon', rondo:true, pri:2, priIntim:1, dance:true, contact:false, note:'専用・踊り技・非接触・優先度+2（いかく版は+1の変化技）'},
    doubleedge:  {jp:'すてみタックル', bp:120, type:'Normal', skin:true, recoil:'1/3'},
    bodyslam:    {jp:'のしかかり', bp:85, type:'Normal', skin:true, note:'まひ30%'},
    facade:      {jp:'からげんき', bp:70, type:'Normal', skin:true, facade:true},
    facadest:    {jp:'からげんき(状態異常時)', bp:140, type:'Normal', skin:true, facade:true},
    quickattack: {jp:'でんこうせっか', bp:40, type:'Normal', skin:true, pri:1},
    lastresort:  {jp:'とっておき', bp:140, type:'Normal', skin:true},
    dragonclaw:  {jp:'ドラゴンクロー', bp:80, type:'Dragon'},
    breakingswipe:{jp:'ワイドブレイカー', bp:60, type:'Dragon', spread:true, note:'相手全体・攻撃-1'},
    dragontail:  {jp:'ドラゴンテール', bp:60, type:'Dragon', pri:-6, acc:90},
    crunch:      {jp:'かみくだく', bp:80, type:'Dark'},
    trailblaze:  {jp:'くさわけ', bp:50, type:'Grass', note:'素早さ+1'},
    irontail:    {jp:'アイアンテール', bp:100, type:'Steel', acc:75}
  };

  const api = { SP, DM };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RondoData = api;
})(typeof window !== 'undefined' ? window : globalThis);
