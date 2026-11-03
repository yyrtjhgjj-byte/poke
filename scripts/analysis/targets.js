const {stats, drfAtk, vsDrf} = require('./calcs.js');

// ---------- targets (defenders) ----------
const T = {
  koraidon_as:   {sp:'koraidon', st: stats('koraidon','jolly',{hp:4,atk:252,spe:252}), lbl:'コライドン H4'},
  miraidon_cs:   {sp:'miraidon', st: stats('miraidon','timid',{hp:4,spa:252,spe:252}), lbl:'ミライドン H4'},
  miraidon_h:    {sp:'miraidon', st: stats('miraidon','modest',{hp:252,spa:252,def:4}), lbl:'ミライドン H252(AV等)'},
  chienpao_as:   {sp:'chienpao', st: stats('chienpao','jolly',{hp:4,atk:252,spe:252}), lbl:'パオジアン H4'},
  tinglu_hb:     {sp:'tinglu', st: stats('tinglu','impish',{hp:252,def:252}), lbl:'ディンルー HB特化'},
  tinglu_hd:     {sp:'tinglu', st: stats('tinglu','careful',{hp:252,spd:252}), lbl:'ディンルー HD特化'},
  calyrexs_cs:   {sp:'calyrexs', st: stats('calyrexs','timid',{hp:4,spa:252,spe:252}), lbl:'黒バド H4'},
  calyrexi_ha:   {sp:'calyrexi', st: stats('calyrexi','brave',{hp:252,atk:252}), lbl:'白バド H252'},
  flutter_cs:    {sp:'fluttermane', st: stats('fluttermane','timid',{hp:4,spa:252,spe:252}), lbl:'ハバタクカミ H4'},
  flutter_hb:    {sp:'fluttermane', st: stats('fluttermane','bold',{hp:252,def:252}), lbl:'ハバタクカミ HB特化'},
  urshifur_as:   {sp:'urshifur', st: stats('urshifur','jolly',{hp:4,atk:252,spe:252}), lbl:'連撃ウーラオス H4'},
  landot_hb:     {sp:'landot', st: stats('landot','impish',{hp:252,def:252}), lbl:'霊獣ランドロス HB特化'},
  hooh_hb:       {sp:'hooh', st: stats('hooh','impish',{hp:252,def:252}), lbl:'ホウオウ HB特化'},
  hooh_ha:       {sp:'hooh', st: stats('hooh','adamant',{hp:252,atk:252}), lbl:'ホウオウ H252'},
  dondozo_hb:    {sp:'dondozo', st: stats('dondozo','impish',{hp:252,def:252}), lbl:'ヘイラッシャ HB特化'},
  zacianc_as:    {sp:'zacianc', st: stats('zacianc','jolly',{hp:4,atk:252,spe:252}), lbl:'ザシアン(王) H4'},
  dragonite_h:   {sp:'dragonite', st: stats('dragonite','adamant',{hp:252,atk:252,def:4}), lbl:'カイリュー H252(マルスケ)', final:[2048]},
  dragonite_h0:  {sp:'dragonite', st: stats('dragonite','adamant',{hp:252,atk:252,def:4}), lbl:'カイリュー H252(マルスケ切れ)'},
  glimmora_cs:   {sp:'glimmora', st: stats('glimmora','timid',{hp:4,spa:252,spe:252}), lbl:'キラフロル H4'},
  ursalunab_h:   {sp:'ursalunab', st: stats('ursalunab','modest',{hp:252,spa:252}), lbl:'アカツキガチグマ H252'},
  kyogre_cs:     {sp:'kyogre', st: stats('kyogre','modest',{hp:4,spa:252,spe:252}), lbl:'カイオーガ H4'},
  grimmsnarl_hb: {sp:'grimmsnarl', st: stats('grimmsnarl','impish',{hp:252,def:252}), lbl:'オーロンゲ HB特化'},
  mimikyu_as:    {sp:'mimikyu', st: stats('mimikyu','jolly',{hp:4,atk:252,spe:252}), lbl:'ミミッキュ H4'},
  ogerpon_as:    {sp:'ogerpon', st: stats('ogerpon','jolly',{hp:4,atk:252,spe:252}), lbl:'オーガポン H4'},
  gliscor_hb:    {sp:'gliscor', st: stats('gliscor','impish',{hp:244,def:252}), lbl:'グライオン HB'},
  garganacl_hb:  {sp:'garganacl', st: stats('garganacl','impish',{hp:252,def:252}), lbl:'キョジオーン HB特化'},
  incin_hd:      {sp:'incineroar', st: stats('incineroar','careful',{hp:252,spd:252,def:4}), lbl:'ガオガエン HD'},
  incin_hb:      {sp:'incineroar', st: stats('incineroar','impish',{hp:252,def:252}), lbl:'ガオガエン HB特化'},
  whims_h:       {sp:'whimsicott', st: stats('whimsicott','timid',{hp:252,spe:252}), lbl:'エルフーン HS'},
  rilla_ha:      {sp:'rillaboom', st: stats('rillaboom','adamant',{hp:252,atk:252}), lbl:'ゴリランダー HA'},
  lunala_hb:     {sp:'lunala', st: stats('lunala','bold',{hp:252,def:252}), lbl:'ルナアーラ HB(シャドーシールド)', final:[2048]},
  tornadus_h:    {sp:'tornadus', st: stats('tornadus','timid',{hp:252,spe:252}), lbl:'トルネロス HS'},
  bolt_h:        {sp:'ragingbolt', st: stats('ragingbolt','modest',{hp:252,spa:252}), lbl:'タケルライコ HC'},
  amoong_hb:     {sp:'amoonguss', st: stats('amoonguss','relaxed',{hp:252,def:252}), lbl:'モロバレル HB特化'},
  indeedee_hb:   {sp:'indeedeef', st: stats('indeedeef','relaxed',{hp:252,def:252}), lbl:'イエッサン♀ HB特化'},
  farigiraf_hb:  {sp:'farigiraf', st: stats('farigiraf','relaxed',{hp:252,def:252}), lbl:'リキキリン HB特化'},
  zamazenta_hb:  {sp:'zamazentac', st: stats('zamazentac','impish',{hp:252,def:252}), lbl:'ザマゼンタ(王) HB+1', defStage:1},
  kingambit_ha:  {sp:'kingambit', st: stats('kingambit','adamant',{hp:252,atk:252}), lbl:'ドドゲザン HA'},
  gholdengo_h:   {sp:'gholdengo', st: stats('gholdengo','modest',{hp:252,spa:252}), lbl:'サーフゴー HC'},
  irontreads_as: {sp:'irontreads', st: stats('irontreads','jolly',{hp:4,atk:252,spe:252}), lbl:'テツノワダチ H4'},
  clodsire_hb:   {sp:'clodsire', st: stats('clodsire','impish',{hp:252,def:252}), lbl:'ドオー HB特化'},
  ironhands_ha:  {sp:'ironhands', st: stats('ironhands','adamant',{hp:252,atk:252}), lbl:'テツノカイナ HA'},
  chiyu_cs:      {sp:'chiyu', st: stats('chiyu','timid',{hp:4,spa:252,spe:252}), lbl:'イーユイ H4'},
  urshifus_as:   {sp:'urshifus', st: stats('urshifus','jolly',{hp:4,atk:252,spe:252}), lbl:'一撃ウーラオス H4'},
  eternatus_h:   {sp:'eternatus', st: stats('eternatus','timid',{hp:252,spe:252}), lbl:'ムゲンダイナ HS'},
};

const DR = {
  jolly: stats('draffia','jolly',{hp:4,atk:252,spe:252}),
  adam: stats('draffia','adamant',{hp:4,atk:252,spe:252}),
};

const sets = [
  ['陽気A252 持ち物なし', {st:DR.jolly, skin:true}],
  ['陽気ハチマキ',       {st:DR.jolly, skin:true, item:'band'}],
  ['意地ハチマキ',       {st:DR.adam, skin:true, item:'band'}],
  ['陽気珠',             {st:DR.jolly, skin:true, item:'lo'}],
  ['陽気珠+1',           {st:DR.jolly, skin:true, item:'lo', atkStage:1}],
  ['陽気珠+1 テラ竜',     {st:DR.jolly, skin:true, item:'lo', atkStage:1, tera:'Dragon'}],
  ['陽気ハチマキ テラ竜', {st:DR.jolly, skin:true, item:'band', tera:'Dragon'}],
];
const moves = ['rondo','doubleedge','bodyslam','crunch','trailblaze','irontail'];


module.exports = {T, DR, sets, moves};
