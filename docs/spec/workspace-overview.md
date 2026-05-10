Zenith AI Chat / Workspace Overview

# ワークスペース概要

このワークスペースは Next.js frontend、Python agent サービス、FastMCP サーバーを一つのモノレポで扱う。各パッケージの境界を誤解しないための整理である。

## 1. ルート構成

| ディレクトリ | 役割 | 主な技術 |
| --- | --- | --- |
| `web` | チャット UI、Next.js App Router、CopilotKit Runtime、BFF route handler | Next.js、React、TypeScript、CopilotKit |
| `agent` | agent 実行、モデル呼び出し、AG-UI endpoint、CORS 調整 | FastAPI、agent-framework、Azure identity |
| `mcp` | MCP tool の公開 | FastMCP、Pydantic |
| `docs` | 仕様の Markdown（`spec/`）、生成 HTML（`html/`）、テンプレート（`template/`） | Markdown、`pnpm run docs:build` |

## 2. ルート設定ファイルの役割

- `package.json`: ワークスペース共通の pnpm script を集約する。
- `pyproject.toml`: uv workspace、Ruff、mypy、pytest の共通設定を置く。
- `biome.json`: TypeScript と JSON の format と lint を統合する。
- `.pre-commit-config.yaml`: コミット前に通すフック群を定義する。
- `AGENTS.md` と `CODING.md`: 開発ルールとサービス境界を明示する。

## 3. サービス境界

| 境界 | 守ること |
| --- | --- |
| web → agent | web は UI と BFF に専念し、agent の内部実装や tool 実装を直接持たない。 |
| agent → mcp | agent は tool 利用方針を持ち、tool 実装本体は mcp に閉じる。 |
| docs → 実装 | アーキテクチャ、コマンド、サービス契約が変わったら `docs/spec` を更新し HTML を再生成する。 |

## 4. リクエストの流れ（概要）

**Step 1** ユーザーは web のブラウザ画面から入力する。

**Step 2** web は CopilotKit Runtime である `/api/copilotkit` に届ける。

**Step 3** Runtime は `AG_UI_BASE_URL` とモデル選択に応じたパス（例: `/mfa/openai`、`/mfa/anthropic`、`/lang-chain/`）へ agent 通信を転送する。

**Step 4** agent は通常応答または frontend tool 呼び出しを返す。

**Step 5** web は static / declarative / custom（例: flight options）のいずれかの UI surface で結果を描画する。

## 5. 主要サブディレクトリの狙い

| 場所 | 中身 |
| --- | --- |
| `web/src/app` | App Router。チャット向け公開 HTTP は `/api/copilotkit` のみ。 |
| `web/src/app/layout.tsx`（`App`）、`web/src/features/chat` | `/` と `/chat/[sessionId]`。アプリ枠は `components/layout`。Generative UI（registry・schema・iframe HTML 生成）は `web/src/features/chat` に含める。 |
| `agent/src` | FastAPI app、agent 構築、設定、endpoint 登録。 |
| `agent/tests` / `mcp/tests` | Python 側の smoke とアプリ生成確認。 |

## 6. このワークスペースで押さえる前提

- JavaScript は pnpm、Python は uv に統一する。
- CopilotKit は web 側の統合レイヤーであり、agent 本体ではない。
- AG-UI は agent サービスの transport と endpoint を束ねる語り口として使う。
- 宣言的 UI schema は frontend が描ける境界として block catalog と一体化して渡す。
