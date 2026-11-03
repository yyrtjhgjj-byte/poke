/* ドラフィアの型（本文・表・スナップショットで共通に使う）。
   ここを変えると、本文中の {{… S1 …}} などのトークンと生成表がすべて追従する。 */
(function (root) {
  'use strict';
  const SETS = {
    AS:  {label: '陽気AS（持ち物補正なし）', nat: 'jolly', ev: {hp: 4, atk: 252, spe: 252}, skin: true, item: ''},
    S1:  {label: 'S-1 竜皮ハチマキ', nat: 'jolly', ev: {hp: 4, atk: 252, spe: 252}, skin: true, item: 'band'},
    S1A: {label: 'S-1変形 意地ハチマキ', nat: 'adamant', ev: {hp: 4, atk: 252, spe: 252}, skin: true, item: 'band'},
    S2:  {label: 'S-2 竜皮スカーフ', nat: 'jolly', ev: {hp: 4, atk: 252, spe: 252}, skin: true, item: '', speMul: 1.5},
    S3:  {label: 'S-3 竜舞（+1・珠・テラス竜）', nat: 'jolly', ev: {hp: 4, atk: 252, spe: 252}, skin: true, item: 'lo', tera: 'Dragon', atkStage: 1},
    S4:  {label: 'S-4 いかく起点作り', nat: 'impish', ev: {hp: 252, def: 252, spd: 4}, skin: false, intim: true},
    D1:  {label: 'D-1 いかくロンド', nat: 'careful', ev: {hp: 252, def: 60, spd: 196}, skin: false, intim: true},
    D3:  {label: 'D-3 竜皮アタッカー（クリアチャーム）', nat: 'jolly', ev: {hp: 4, atk: 252, spe: 252}, skin: true, item: ''},
    D4:  {label: 'D-4 輪舞ブイズ（いのちのたま）', nat: 'jolly', ev: {hp: 4, atk: 252, spe: 252}, skin: true, item: 'lo'},
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = {SETS};
  else root.RondoSets = {SETS};
})(typeof window !== 'undefined' ? window : globalThis);
