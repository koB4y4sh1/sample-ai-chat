# docs（設計ドキュメント）

Zenith AI Chat の**設計・運用説明**は `spec/` の Markdown が正本です。閲覧用の HTML はビルドで `html/` に出力します。

## レイアウト

| パス | 役割 |
| --- | --- |
| **`spec/`** | 編集するソース（`.md`）。**読み方は [`spec/documentation-guide.md`](spec/documentation-guide.md) から。** |
| **`html/`** | `pnpm run docs:build` の生成物（ブラウザ向け）。 |
| **`template/`** | HTML ラッパー、`design-doc.md` などひな形。 |

## ビルド

```bash
pnpm run docs:build
```

## 索引ページ（HTML）

ビルド後に `html/index.html` を開くと、カテゴリ別に全ページへリンクできます。

レガシー HTML を Markdown に取り込むメンテ用（通常は不要）:

```bash
pnpm run docs:migrate-html
```

## ルートとの関係

開発ルールの「正」はリポジトリ直下の **`AGENTS.md`** と **`CODING.md`**。アーキテクチャや契約の変更時は **`spec/specification.md`** を更新し、上記ビルドで HTML を再生成してください。
