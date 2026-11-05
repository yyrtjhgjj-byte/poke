# PDF 成果物

`npm run pdf`（または `npm run all`）を実行すると、このフォルダの PDF が最新の内容で上書きされる。手で置いたり編集したりしない。

| ファイル | 内容 | 元のテンプレート |
|---|---|---|
| `draffia-battle.pdf` | 対戦向けの資料（A4縦2枚）。専用技、主要所見、シングル・ダブルの型と相手、試作構築、予測 | `templates/a4.html`（`scripts/a4.js`） |
| `draffia-guide.pdf` | しょうかいガイド（A4縦2枚）。対戦に詳しくない人向けの「こういうポケモンです」 | `templates/guide.html`（`scripts/guide.js`） |

印刷前のHTML（`dist/draffia-a4.html`・`dist/draffia-guide.html`）は確認用の中間ファイル。
