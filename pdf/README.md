# PDF 成果物

`npm run pdf`（または `npm run all`）を実行すると、このフォルダの PDF が最新の内容で上書きされる。手で置いたり編集したりしない。

| ファイル | 内容 | 元のテンプレート |
|---|---|---|
| `draffia-battle.pdf` | 対戦向けの資料（A4縦3枚）。1枚目：専用技・主要所見・対策、2枚目：特性とタイプ・すばやさ・習得技の評価・与／被ダメージ・持ち物、3枚目：シングル・ダブルの型と相手・試作構築・予測 | `templates/a4.html`（`scripts/a4.js`） |
| `draffia-guide.pdf` | しょうかいガイド（A4縦2枚）。対戦に詳しくない人向けの「こういうポケモンです」 | `templates/guide.html`（`scripts/guide.js`） |
| `draffia-if-no-rondo.pdf` | ロンドのない世界線（A4縦2枚）。専用技ドラゴニックロンドを覚えなかったら、という仮定の考察。評価・対面・技の評価・型をロンドありと比べる | `templates/ifworld.html`（`scripts/ifworld.js`） |

印刷前のHTML（`dist/draffia-a4.html`・`dist/draffia-guide.html`・`dist/draffia-if.html`）は確認用の中間ファイル。
