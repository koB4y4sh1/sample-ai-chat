Zenith AI Chat / Directory Structure

# ディレクトリ構成仕様

この仕様は、実装を置くべき場所を迷わないためのディレクトリ一覧である。ワークスペース概要とあわせて境界を整理するとよい。

## 1. ルート直下

```
agent/   Python agent service
docs/    spec（Markdown）/ html（生成）/ template
mcp/     FastMCP service
web/     Next.js frontend and BFF

AGENTS.md
CODING.md
README.md
biome.json
package.json
pyproject.toml
.pre-commit-config.yaml
```

## 2. 主要ディレクトリの役割

| 場所 | 役割 |
| --- | --- |
| `web/src/app` | Next.js App Router。ページ・レイアウト・**チャット向け BFF は `/api/copilotkit` のみ**。 |
| `web/src/app/layout.tsx` | ルートレイアウト。`AppProviders` と `App` でアプリ共通の枠を提供する。 |
| `web/src/components/layout/App.tsx` | **アプリ全体の枠**（Sidebar・Copilot / CopilotKit のラッパ）。セッション状態は `features/chat` の hook に委譲。 |
| `web/src/components/common/Sidebar.tsx` | アプリ共通のサイドバー（ナビ・セッション一覧・テーマ切替など）。 |
| `web/src/features/chat` | **チャット機能の単一の縦割り領域**。会話 UI、`generative-ui/`（registry・declarative・iframe）、`schemas/`（zod）、hooks、context、型。 |
| `web/src/lib/copilotkit` | CopilotKit Runtime 組み立て、agent 登録、middleware。 |
| `web/src/lib/chat-controls.ts` | モデル・ツール選択などチャットコントロールの共有ロジック。 |
| `agent/src` | FastAPI app、agent 構築、設定読み込み、エントリポイント。 |
| `agent/tests` | agent package の smoke と app 登録確認。 |
| `mcp/src/server.py`, `mcp/src/servers`, `mcp/src/shared` | MCP package の本体。 |
| `mcp/tests` | MCP package の基本テスト。 |
| `docs/spec` | ドキュメントの正（Markdown）。`pnpm run docs:build` で `docs/html` を生成。 |

## 3. 実装を置くときの入口

- アプリ共通の枠は `web/src/app/layout.tsx` が `web/src/components/layout/App.tsx` を呼ぶ。ページは `/` でホーム、`/chat/[sessionId]` で会話。
- Generative UI（frontend tool・declarative・MCP iframe 用 HTML 生成など）はすべて **`web/src/features/chat`** 配下に置く。別 feature ディレクトリや `/api/generative-ui` のような追加 route は置かない。
- CopilotKit endpoint は **`web/src/app/api/copilotkit/route.ts` のみ**。
- agent 接続 URL は `web/src/lib/copilotkit/agents.ts`。
- agent 本体は `agent/src/mfa`、`agent/src/lang_chain`、`agent/src/main.py`。
- 宣言的 UI block の契約は `web/src/features/chat/schemas/declarative.ts`。
