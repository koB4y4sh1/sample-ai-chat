---
applyTo: "**"
---
# Zenith AI Chat Copilot Instructions

リポジトリ全体のルールは [AGENTS.md](../AGENTS.md) と [CODING.md](../CODING.md) に従う。

## 必須ワークフロー

- 回答と編集は要求された範囲に限定する。
- JavaScript / TypeScript では `pnpm` を使う。`npm` は使わない。
- Python では `uv` を使う。`pip install` と `python install` は使わない。
- 挙動変更では [TDD](../tdd-specification.md) に従う。手順の詳細は [skills/zenith-tdd/SKILL.md](skills/zenith-tdd/SKILL.md)。先に失敗テストを書き、Red を確認し、最小実装で Green にしてからリファクタリングする。
- Ruff、Biome、`tsc`、mypy の診断は作業項目として扱う。今回変更で新規発生または露出した診断を残して完了しない。
- ドキュメントの正は `docs/spec/*.md`。閲覧用 HTML は `pnpm run docs:build` で `docs/html` に生成する。リポジトリ共通の Markdown ガイドはルート、`.github/`、または `skills/` 配下に置く。CopilotKit 契約チェックは [skills/copilotkit-contracts/SKILL.md](skills/copilotkit-contracts/SKILL.md)。

## アーキテクチャ境界

- `web` は Next.js、React、CopilotKit 統合、frontend tool、BFF route handler を扱う。
- `agent` は agent の挙動と会話状態を扱う。
- `mcp` は FastMCP tool 公開と tool schema を扱う。
- agent の意思決定を `web` に入れない。MCP の実装詳細を `agent` に入れない。BFF / server の責務を React component に入れない。

## CopilotKit 変更

- 観測可能な契約をテストする。対象は chat UI の挙動、`/api/copilotkit` の request / response、agent context、provider / model による endpoint 選択、frontend tool 登録、render 入力である。
- CopilotKit runtime の内部状態や実行順序に依存するテストを書かない。
- Generative UI では、実装前に tool 名、入力 schema、表示結果、失敗時の扱いをテストする。

## コミットと PR

- コミット案を作る場合は [commit-convention.md](../commit-convention.md) に従う。
- PR 説明には、保証した挙動と実行したコマンドを記載する。
