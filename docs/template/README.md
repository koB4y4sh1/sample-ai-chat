# template

| ファイル | 用途 |
| --- | --- |
| `article.html` | 通常ページ用ラッパー。プレースホルダ: `{{TITLE}}`, `{{DESCRIPTION}}`, `{{BODY}}`。 |
| `index.html` | `docs/spec/index.md` 専用（ヒーロー・カード用スタイル）。 |
| `design-doc.md` | 設計書・メモ用の Markdown ひな形（フロントマター付き）。 |

ビルドはリポジトリルートで `pnpm run docs:build`。

読み順・全ページ一覧は [`docs/spec/documentation-guide.md`](../spec/documentation-guide.md) を参照。
