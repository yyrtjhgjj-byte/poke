# CLAUDE.md　次回の作業メモ

このリポジトリは、依頼者が設計したオリジナルポケモン「ドラフィア」の対戦考察レポートを作る作業場。
最初の版は 2026-11-03 に作成し、claude.ai のアーティファクトとして公開した。
同日にロンドの仕様をv2へ改訂（スキン版の優先度+2、ブイズへの上昇をA・C・Sに拡大）、続けてv3（音技→踊り技、非接触を明記）。仕様の正は `spec/draffia.md` の最新節。

## 依頼者について

- 返答は敬語（です・ます）。
- レポート本文は「である調」。ラボ風・遊び心あり（研究員メモ、受理スタンプ、表紙の標本写真）。
- 章はタブ切り替え（ハッシュ：abstract / specimen / singles / doubles / training / teams / lab / forecast）。
- 依頼者は性能を調整しながら考察を回したい。作り直しではなく差分更新を優先する。

## 公開先

- アーティファクト：https://claude.ai/artifact/CrWJSfd9tuna8bhrywcEku（非公開、所有者は依頼者）
- 更新するときは Artifact ツールで先に `action: "read"` してから、`url` を指定して `dist/draffia.html` を publish する。`url` なしで publish すると別のアーティファクトになる。
- タイトル「ドラフィア徹底考察レポート」、アイコン `report` は変えない。

## Git とアーティファクトの運用（依頼者の指示：確認不要）

- コミット、push、`main` へのマージ、アーティファクトの更新は、依頼者に確認せずに最後まで行う。「コミットしてよいか」「マージするか」は聞かない。
- 流れ：作業ブランチで作業 → `npm run all` と `look.py` が通ったらコミット → 作業ブランチを push → `main` にマージして `main` を push → アーティファクトを更新。
- 照合（`npm run validate`）が通らない、`look.py` でエラーやはみ出しが出る、マージで競合する、といった場合は止めて報告する。
- 完了報告には、ブランチ名、`main` へのマージ結果、アーティファクトの版を書く。

## 性能変更の手順

1. `spec/draffia.md` に新仕様を追記（原文は残す）。
2. `src/data.js` の `SP.draffia`（`b` 種族値、`t` タイプ、`skin` 変換先）と `DM`（技）を更新。
   - 専用技の挙動：`src/core.js` の `drfAtk`（`mv.rondo` 分岐、A/C比較）と `src/engine.js` の `eff(…, {rondo})`（妖・氷を×2に上書き）。
3. 型の配分を変えるなら `src/sets.js`。ダブル耐久型は `scripts/analysis/opt.js` で探索できる。
4. `npm run all`：照合 13/13 → `dist/draffia.html` と `notes/claims.md` → `notes/calc-snapshot.md`。
5. `git diff notes/claims.md` で、本文中のどの数値が変わったかを見る。値の前後の判定（有利・不利、「耐える」「抜ける」などの言い回し）が数値と食い違っていないかを確認し、`templates/body.html` を直す。
6. 主観の値（総合評価、予想順位、レーダー、採用率）は `src/report.config.js` で見直す。
7. `python3 scripts/look.py` は1回だけ。エラーとはみ出しがなければ公開する。Python の playwright が無い環境では `pip install playwright` のうえ `--chrome /opt/pw-browsers/chromium` を付ける。
8. コミット・push・`main` へのマージまで確認なしで行う（上の「Git とアーティファクトの運用」）。

## 自動で追従するもの

- 生成表：`scripts/build.js` が `templates/body.html` の `<!--@NAME-->` を埋める（同じ名前が複数あってもすべて置換）。
  SPRITE、ILLUST、TYPECHIPS、DEFCHART、SKINTABLE、RADAR、RADARTABLE、STATBARS、SINGLES_ATK、SINGLES_DEF、CHEER、SPEED、SPEEDTBL、TERA、TRAINING、EXP_CAT、EXP_LR、EXP_FACADE、EXP_SYL、EXP_ES、RANKAXIS、ADOPT_S、ADOPT_D。
  ロンドの優先度は `DM.rondo.pri`（スキン版）と `priIntim`（いかく版）から表とページ内計算機に入る。
- 本文中の数値：`{{…}}` トークン（下記）。ビルド時に計算し、`notes/claims.md` に「章・値・前後の文・トークン」を一覧で書き出す。
- 型の定義：`src/sets.js`。本文・生成表・スナップショットが同じ定義を使う。
- 主観の値：`src/report.config.js`（評価、順位、レーダーの値と根拠、採用率）。
- ページ内の実数値計算機・ダメージ計算機・すばやさチェッカーも `src/` を読むので追従する。

## 手書きのまま残っているもの（性能を変えたら要確認）

- 判定ラベル：§2.1 対面表と §3.1 関係表の「有利・五分・不利」など。件数（表2-1の内訳）は自動。
- §1.6 習得技の★評価、§1.5 のロンド対タイプ表、§1.3 の補足文、§1.4 の特性説明。
- 型カードの持ち物・テラス・技構成と、定性的な説明（「物理はいかく込みで受ける配分」など）。
- §3.3 のガオガエン側の列、§3.2・§3.8・§5・§7.3 の文章、§7 の総評文。
- 環境の順位（使用率○位）と仮想敵の配分（`src/core.js` の `TARGETS`・`ATTACKS`）。
- ロンドの命中・PP・優先度など仕様そのものの値（`spec/draffia.md` が正）。本文の「優先度+2」「A・C・S+2」「A+1・C+1・S+2」「踊り技・非接触」は手書き。
- `scripts/build.js` の EXP_SYL・EXP_ES の文章のうち、上昇の段階数（+1/+2/+4の列）と「止め方」「残る壁」の記述。
- §5.2 の試作構築（T-D3 輪舞ブイズを含む）の相方と持ち物。
- `notes/findings.md`・`notes/forecast.md` は v1 時点の作業メモで、自動更新されない。
- §0 冒頭の改訂記録（v1既読者向け）は履歴なので、数値もトークンにせず固定で書いている。次に性能を変えたら、既存の記録は残し、新しい版の記録を上に足す（ヘッダーの `REV.n` も上げる）。最新の記録だけ開いて表示し、古い記録は `<details>` で折りたたむ。

## 数値トークン

`templates/body.html`（と `build.js` 内の説明文、`report.config.js` のレーダー根拠）に `{{種類 引数…}}` で書く。
未知の種類・型・技・相手を書くとビルドが止まる。型は `src/sets.js` のキー（AS / S1 / S1A / S2 / S3 / S4 / D1 / D3 / D4）。

| トークン | 出力例 | 内容 |
|---|---|---|
| `{{dmg S1 rondo koraidon_as full}}` | 96〜116%（乱数1発 87.5%） | ドラフィア→相手。技は `DM`、相手は `TARGETS` のキー |
| `{{hit D1 ci_lance_d surv}}` | 93.8%で耐える | 相手→ドラフィア。攻撃は `ATTACKS` のキー。いかくは型の `intim` に従う |
| `{{kolist S1 rondo flutter_cs chienpao_as koraidon_as}}` | ハバタクカミとパオジアンは確定1発、コライドンは乱数1発（87.5%） | 確定数でまとめた一文 |
| `{{stat S4}}` / `{{stat S4 hp2}}` | 202-150-128-×-86-130 / 101 | 実数値（`hp`〜`spe`、`hp2`・`hp4` は1/2・1/4） |
| `{{ev D1}}` / `{{ev D1 def}}` / `{{nat D1}}` | H252 B60 D196 / 60 / しんちょう | 努力値・性格 |
| `{{spe koraidon jolly 252 +1}}` | 307 | 任意のポケモンの素早さ（補正 `x1.5`・`+1` など） |
| `{{setspe S2}}` / `{{setspe S3 +1}}` | 267 | 型の素早さ（スカーフ込み、ランク補正可） |
| `{{spcmp S1 chienpao jolly 252}}` | 相手が先手（205対178） | 1体との素早さ比較（5番目に相手の補正） |
| `{{spvs S1 urshifur/jolly ogerpon/jolly tornadus/timid}}` | 連撃ウーラオス（163）より速く、オーガポン（178）と同速で、トルネロス（179）より遅い | 複数との比較。`種族/性格[/努力値[/補正]]`、努力値の省略は252 |
| `{{fasterlist S1 calyrexs/timid …}}` | 黒バドレックス、… | ドラフィアより速い相手の名前 |
| `{{base}}` / `{{base hp}}` / `{{base top2}}` / `{{base incineroar def}}` | H95 A130 … ／ 525 / 95 / 攻撃130・素早さ110 | 種族値（種族省略でドラフィア） |
| `{{bp doubleedge skin}}` / `{{bp doubleedge skin x2}}` | 144 / 288 | 威力（`skin` でスキン補正後） |
| `{{rondoflip AS}}` / `{{rondoflip AS spa}}` | -3 / 72 | ロンドが特殊扱いになる攻撃ランク |
| `{{eff weak}}` / `resist` / `immune` | 氷・竜・妖 | ドラフィアの弱点・半減・無効 |
| `{{grade S}}` / `{{rank D settled}}` | B+ / 10〜20位 | `report.config.js` の値 |
| `{{tally tbl-s-match}}` | 有利9・五分5・不利6 | 指定 id の表の判定ラベルを数える |

- `dmg` のオプション：`tt=タイプ`（相手のテラス）、`stage=N`（攻撃ランク）、`item=band|lo`、`tera=タイプ`、`unaware`、`hh`、`burn`、`st`、`crit`、`dbl`、`ruin`。
- `hit` のオプション：`intim` / `nointim`、`haban`、`av`、`tera=タイプ`。
- 書式：`pct`（96〜116%、既定）、`ko`（乱数1発（87.5%））、`full`（両方）、`p1`（1発の確率）、`surv`（耐える確率）、`range`（ダメージ値）。割合は下限切り捨て・上限切り上げ。
- `{{!…}}` は値だけ入れて claims に載せない（計算機の初期値など）。タグの属性内のトークンも載せない。
- 判定そのものを出すトークン（`ko`・`surv`・`spcmp`・`spvs`・`kolist`）を優先すると、性能が変わっても文が食い違いにくい。

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
- 実在のポケモンやキャラクターの絵は描かない。表紙にあった抽象アニメーション「輪舞観測図」は依頼者の指示で撤去した（戻さない）。
- ドラフィアの外観は依頼者のドット絵を使う。原本は `spec/sprite/draffia.png`（最新）と `spec/sprite/draffia-v1.jpg`（初回）。表紙の「標本写真」には `python3 scripts/assets.py` で 72×58 に戻した `assets/draffia.png` を data URI で埋め込み、`image-rendering: pixelated` で3倍表示する。
- 依頼者のイラスト `spec/art/draffia-sylveon.png`（ニンフィアとドラフィア）は、assets.py で幅1400pxの WebP（`assets/draffia-sylveon.webp`）にして §1.1 の図1-2「観察記録」に埋め込む。
- 画像を差し替え・追加したら `python3 scripts/assets.py` を実行してからビルドする。
- 原本の透明な画素には灰色の色情報が残っている（透過を無視するビューアでは汚れて見えるが、ページ上は問題ない）。

## 環境データ

- `research/environment-s41.md`：レギュレーション、シーズン41のシングル上位20・ダブル上位50（2026-11-03時点）、出典URL。
- 更新するときは同じ出典を取り直し、日付つきファイルを追加。対面表・関係表の順位も直す。
