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
| `web/app` | ページ、レイアウト、API route を置く。 |
| `web/components/chat` | 会話画面、チャット UI、CopilotKit 連携、frontend tool registry。 |
| `web/components/generative-ui` | static / declarative / open-ended の各 UI renderer。 |
| `web/lib/copilotkit` | Runtime 組み立て、agent 登録、middleware と context の集約。 |
| `web/lib/generative-ui/schemas` | zod schema と UI catalog の宣言。 |
| `agent/src` | FastAPI app、agent 構築、設定読み込み、エントリポイント。 |
| `agent/tests` | agent package の smoke と app 登録確認。 |
| `mcp/src/server.py`, `mcp/src/servers`, `mcp/src/shared` | MCP package の本体。 |
| `mcp/tests` | MCP package の基本テスト。 |
| `docs/spec` | ドキュメントの正（Markdown）。`pnpm run docs:build` で `docs/html` を生成。 |

## 3. 実装を置くときの入口

- チャット UI 全体は `web/components/chat/App.tsx`。
- CopilotKit endpoint は `web/app/api/copilotkit/route.ts`。
- agent 接続 URL は `web/lib/copilotkit/agents.ts`。
- agent 本体は `agent/src/mfa`、`agent/src/lang_chain`、`agent/src/main.py`。
- 宣言的 UI block の契約は `web/lib/generative-ui/schemas/declarative.ts`。
