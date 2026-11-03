# CLAUDE.md　次回の作業メモ

このリポジトリは、依頼者が設計したオリジナルポケモン「ドラフィア」の対戦考察レポートを作る作業場。
最初の版は 2026-11-03 に作成し、claude.ai のアーティファクトとして公開した。

## 依頼者について

- 返答は敬語（です・ます）。
- レポート本文は「である調」。ラボ風・遊び心あり（研究員メモ、受理スタンプ、輪舞観測図）。
- 章はタブ切り替え（ハッシュ：abstract / specimen / singles / doubles / training / teams / lab / forecast）。
- 依頼者は性能を調整しながら考察を回したい。作り直しではなく差分更新を優先する。

## 公開先

- アーティファクト：https://claude.ai/artifact/CrWJSfd9tuna8bhrywcEku（非公開、所有者は依頼者）
- 更新するときは Artifact ツールで先に `action: "read"` してから、`url` を指定して `dist/draffia.html` を publish する。`url` なしで publish すると別のアーティファクトになる。
- タイトル「ドラフィア徹底考察レポート」、アイコン `report` は変えない。

## 性能変更の手順

1. `spec/draffia.md` に新仕様を追記（原文は残す）。
2. `src/data.js` の `SP.draffia`（`b` 種族値、`t` タイプ、`skin` 変換先）と `DM`（技）を更新。
   - 専用技の挙動：`src/core.js` の `drfAtk`（`mv.rondo` 分岐、A/C比較）と `src/engine.js` の `eff(…, {rondo})`（妖・氷を×2に上書き）。
3. `npm run all`：照合 13/13 → `dist/draffia.html` → `notes/calc-snapshot.md`。
4. `git diff notes/calc-snapshot.md` で変化した計算を把握する。
5. 下の「手書きの数値・判定」を見直す。数値はスナップショットを正とする。
6. `python3 scripts/look.py` は1回だけ。エラーとはみ出しがなければ公開する。
7. ダブルの耐久配分を詰め直すなら `scripts/analysis/opt.js`（ベンチマークを満たすB/D配分を探索）。

## 自動で追従するもの

`scripts/build.js` が `templates/body.html` の `<!--@NAME-->` を埋める。
RADAR（値は build.js に手書き）、STATBARS、SINGLES_ATK、SINGLES_DEF、CHEER、SPEED、TERA、TRAINING、EXP_CAT、EXP_LR、EXP_FACADE、EXP_SYL、ADOPT_S/ADOPT_D（値は build.js に手書き）。
ページ内の実数値計算機・ダメージ計算機・すばやさチェッカーも `src/` を読むので追従する。

## 手書きの数値・判定（性能を変えたら要確認）

- マストヘッド：種族値チップ、メタ欄の判定。
- §0 要旨：総合評価と予想順位、所見1〜5の数値、評価内訳表、build.js の RADAR 値。
- §1 検体：1.1 の比較文、1.3 の説明、1.5 のロンド仕様と注記（陽気A252は攻撃-3で特殊化）、1.6 の★評価。
- §2 シングル：2.1 対面表（%と有利・不利）、2.2 強み弱み、2.3 型カードの実数値と%、2.6、2.7。
- §3 ダブル：3.1 関係表（%）、3.3 ガオガエン比較の数値、3.4 型カードの実数値と%、3.8。
- §4 育成論：4.7 持ち物表、4.8 すばやさ表（実数値）。4.1〜4.6 の計算行は自動。説明文の数値は手書き。
- §5 パーティ：役割文の数値（例：+1コライドン307）。
- §7 予測：順位バンド（body.html の style 位置）、採用率（build.js の ADOPT_S/ADOPT_D）、総評。

## 計算の約束事

- `notes/assumptions.md` に仕様の解釈をまとめた。変える場合は §1.7 も直す。
- スキン補正は BP 修正 4915。てだすけ（6144）と重ねるときは HH を先に積む（Smogon と一致）。
- アクセルブレイク・イナズマドライブの抜群時補正は BP 修正 5461（最終補正ではない）。
- わざわいのつるぎ・たまは防御・特防側の修正 3072。
- 急所は攻撃側のマイナスランクと防御側のプラスランク、壁を無視。いかくは急所技に効かない。
- エンジンを触ったら `npm run validate` を必ず通す。

## デザイン

- トークンは `templates/head.html` の `:root`（ライト）と2つのダーク定義。色は必ずトークン経由。
- フォント：Dela Gothic One（見出し）、Zen Kaku Gothic New（本文）、IBM Plex Mono（数値）、Yomogi（研究員メモ）。
- 実在のポケモンやキャラクターの絵は描かない。エンブレムは抽象図形（踊る点と「竜／威」の文字）。`spec/draffia-sprite.jpg` は参照資料で、ページには埋め込まない。

## 環境データ

- `research/environment-s41.md`：レギュレーション、シーズン41のシングル上位20・ダブル上位50（2026-11-03時点）、出典URL。
- 更新するときは同じ出典を取り直し、日付つきファイルを追加。対面表・関係表の順位も直す。
