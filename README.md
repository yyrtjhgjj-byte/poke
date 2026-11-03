# draffia-lab　ドラフィア研究室

オリジナルポケモン「ドラフィア」のSV対戦考察レポートと、それを作るための計算エンジン・データ・テンプレート一式。
性能を変えたときに、計算と表を作り直せるように残している。

- 完成品：`dist/draffia.html`（claude.ai のアーティファクト「ドラフィア徹底考察レポート」と同じもの）
- 対象環境：ポケモンSV ランクバトル シーズン41（レギュレーションI、禁止級2体まで）
- 計算：Lv50・個体値31・SVのダメージ計算式。Smogon製計算機と13件照合済み

## 構成

```
spec/        性能仕様（原文・改訂履歴）と依頼者のドット絵（sprite/）
assets/      ページに埋め込む画像（scripts/sprite.py で生成）
src/
  data.js    種族値・タイプ・技データ ← 性能を変えるときはここ
  sets.js    ドラフィアの型（性格・努力値・持ち物）。本文・表・スナップショット共通
  report.config.js  主観の値（総合評価・予想順位・レーダー・採用率）
  engine.js  ダメージ計算エンジン（端数処理込み）
  core.js    実数値計算、与ダメ/被ダメ関数、仮想敵プリセット
  ui.js      ページ側スクリプト（タブ、計算機、すばやさチェッカー）
templates/
  head.html  タイトルとCSS（デザイントークン）
  body.html  本文。考察の文章、生成表のプレースホルダ（<!--@NAME-->）、数値トークン（{{…}}）
scripts/
  build.js     表を計算し、トークンを解決して dist/draffia.html と notes/claims.md を書き出す
  tokens.js    数値トークンの解決（書式は CLAUDE.md）
  validate.js  Smogon計算機との照合（13件）
  snapshot.js  主要な計算結果を notes/calc-snapshot.md に書き出す
  look.py      PC・スマホ幅で描画し、エラーとはみ出しを確認
  analysis/    型を詰めるときに使った探索スクリプト
research/    環境データ（使用率・ルール）のスナップショットと出典
notes/       仮定、結論、採用率推計の根拠、計算スナップショット、本文中の計算値一覧（claims.md）
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
3. 型の配分を変えるなら `src/sets.js` を書き換える。
4. `npm run all` を実行する。
5. `git diff notes/claims.md` で、本文中のどの数値が変わったかを確認する。数値と前後の判定（有利・不利など）が食い違っていれば `templates/body.html` を直す。
6. 総合評価・予想順位・採用率などの主観の値は `src/report.config.js` で見直す。
7. アーティファクトを更新する。

本文中の数値（ダメージ割合、確定数、実数値、素早さ比較、威力、種族値）は `{{dmg S1 rondo koraidon_as full}}` のようなトークンで書いてあり、ビルドのたびに計算し直される。生成表（与ダメ・被ダメ・エール実験・テラス比較・すばやさ・育成論・実験記録）と、ページ内の計算機も自動で追従する。手で見直すのは判定ラベル、★評価、文章の言い回し、主観の値。対象の一覧とトークンの書式は `CLAUDE.md` にある。

## 環境データを更新するとき

`research/environment-s41.md` の手順で使用率を取り直し、日付つきで新しいファイルを足す。仮想敵の配分は `src/core.js` の `TARGETS` と `ATTACKS` にある。
