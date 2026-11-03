# draffia-lab　ドラフィア研究室

オリジナルポケモン「ドラフィア」のSV対戦考察レポートと、それを作るための計算エンジン・データ・テンプレート一式。
性能を変えたときに、計算と表を作り直せるように残している。

- 完成品：`dist/draffia.html`（claude.ai のアーティファクト「ドラフィア徹底考察レポート」と同じもの）
- 対象環境：ポケモンSV ランクバトル シーズン41（レギュレーションI、禁止級2体まで）
- 計算：Lv50・個体値31・SVのダメージ計算式。Smogon製計算機と13件照合済み

## 構成

```
spec/        依頼時の性能仕様（原文）と参照用ドット絵
src/
  data.js    種族値・タイプ・技データ ← 性能を変えるときはここ
  engine.js  ダメージ計算エンジン（端数処理込み）
  core.js    実数値計算、与ダメ/被ダメ関数、仮想敵プリセット
  ui.js      ページ側スクリプト（タブ、計算機、すばやさチェッカー）
templates/
  head.html  タイトルとCSS（デザイントークン）
  body.html  本文。手書きの考察と、生成表のプレースホルダ（<!--@NAME-->）
scripts/
  build.js     表を計算して dist/draffia.html を書き出す
  validate.js  Smogon計算機との照合（13件）
  snapshot.js  主要な計算結果を notes/calc-snapshot.md に書き出す
  look.py      PC・スマホ幅で描画し、エラーとはみ出しを確認
  analysis/    型を詰めるときに使った探索スクリプト
research/    環境データ（使用率・ルール）のスナップショットと出典
notes/       仮定、結論、採用率推計の根拠、計算スナップショット
dist/        完成したHTML
```

## 使い方

```bash
npm install            # 照合用の @smogon/calc を入れる
npm run all            # 照合 → ビルド → スナップショット
python3 scripts/look.py   # 任意。要 Playwright
```

## 性能を変えるとき

1. `spec/draffia.md` に新しい仕様を追記する（旧仕様は残す）。
2. `src/data.js` の `draffia`（種族値 `b`、タイプ `t`、スキン変換先 `skin`）と技一覧 `DM` を書き換える。専用技の仕様が変わる場合は `src/core.js` の `drfAtk` と `src/engine.js` の `eff`（`rondo` オプション）も直す。
3. `npm run all` を実行する。
4. `git diff notes/calc-snapshot.md` で、どの計算結果が変わったかを確認する。
5. `templates/body.html` の手書き部分（判定、本文中の数値）を、スナップショットに合わせて直す。対象の一覧は `CLAUDE.md` にある。
6. `npm run build` で作り直し、アーティファクトを更新する。

生成表（与ダメ・被ダメ・エール実験・テラス比較・すばやさ・育成論の計算行・実験記録）と、実数値計算機・ダメージ計算機は自動で追従する。本文中の判定（有利・不利など）と、文中に書いた数値は手で見直す。

## 環境データを更新するとき

`research/environment-s41.md` の手順で使用率を取り直し、日付つきで新しいファイルを足す。仮想敵の配分は `src/core.js` の `TARGETS` と `ATTACKS` にある。
