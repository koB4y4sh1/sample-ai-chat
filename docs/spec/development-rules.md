Zenith AI Chat / Development Rules

# 開発ルール仕様

リポジトリ全体のルールの**正**は **[AGENTS.md](../../AGENTS.md)** と **[CODING.md](../../CODING.md)**。このページはドキュメント閲覧用に要点だけ抜き出したものです。

## 基本方針

- 変更は要求範囲に限定する。
- サービス境界（web / agent / mcp）を曖昧にしない。
- 推測で依存を追加しない（パッケージ名・import・runtime API が確定してから）。
- ローカルで通らない品質ゲートを CI に持ち込まない。

## ツール

| 領域 | ルール |
| --- | --- |
| JavaScript | `pnpm` のみ（`npm` は使わない）。 |
| Python | `uv` のみ（`pip install` は使わない）。 |
| TS 品質 | Biome + `tsc --noEmit`。 |
| Python 品質 | Ruff + strict mypy。 |

## サービス境界（要約）

| 領域 | 守ること |
| --- | --- |
| `web` | UI と CopilotKit。BFF 以降の内部実装を直接持たない。 |
| `web BFF` | FE 向け API の束ね。agent の意思決定や tool 実装は持たない。 |
| `agent` | 会話と tool 選択。FE 固有の表示都合を持たない。 |
| `mcp` | tool の schema と実装。agent/BFF 都合に引きずられた戻り値にしない。 |

## 品質コマンド（よく使う）

`pnpm run format` / `lint` / `typecheck` / `test` / `check` · `uv run pre-commit run --all-files`

## ドキュメント更新

アーキテクチャ・コマンド・サービス契約・環境変数・tool schema・CI / pre-commit を変えたら **`docs/spec/specification.md`** を直し、**`pnpm run docs:build`** で HTML を再生成する。

レイアウト: `docs/spec`（編集）→ `docs/html`（生成）→ `docs/template`（ラッパー）。

## CopilotKit・テスト

詳細は **CODING.md** の「CopilotKit TDD」「テスト」。観測可能な契約をテストし、runtime 内部に依存しない。
