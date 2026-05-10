# Zenith AI Chat 仕様書

作成日: 2026-04-24 / 更新日: 2026-05-10 / 対象: web, agent, mcp

## 関連ドキュメント

- **[ドキュメントガイド](./documentation-guide.html)** … `docs/spec` の読み順・用途別索引・全ページ一覧。

## 目的

Zenith AI Chatは、Next.jsのチャットUIからCopilotKit Runtimeを経由してagentへ接続し、 通常のテキスト応答とGenerative UI応答を同じ会話画面に表示するチャットアプリである。

## 構成

| 領域 | ディレクトリ | 技術 | 責務 |
| --- | --- | --- | --- |
| FE/BFF | `web`（Next.js のソースは `web/src`：`web/src/app`、`web/src/features/chat`、`web/src/lib`） | TypeScript, Next.js, React, CopilotKit, pnpm | チャット UI（Generative UI を含む）と、`/api/copilotkit` のみを公開する BFF。agent への接続は CopilotKit Runtime 経由。 |
| BE | `agent` | Python, Microsoft Agent Framework, uv | agentの実行、agent endpointの公開、LLMへの指示管理 |
| MCP | `mcp` | Python, FastMCP, uv | agentから利用する外部tool群の公開 |
| ドキュメント | `docs` | Markdown, HTML | 仕様の正は `docs/spec/*.md`。閲覧用 HTML は `pnpm run docs:build` で `docs/html` に生成する。テンプレートは `docs/template`。 |

## 接続仕様

* `web` は Next.js App Router で UI と BFF route handler を管理する。
* web が公開するチャット向け HTTP API は **`/api/copilotkit`**（CopilotKit Runtime）のみとする。Generative UI（static / declarative / custom tool・および Runtime の MCP Apps iframe）はチャット機能の一部として **`web/src/features/chat`** 内で完結し、追加の REST ルートは置かない。
* チャット UI は `/api/copilotkit` の CopilotKit Runtime へ接続する。
* Runtime は `AG_UI_BASE_URL` を基準に、チャットで選んだモデルプロバイダに応じて agent へ転送する（例: OpenAI 向け `/mfa/openai`、Anthropic 向け `/mfa/anthropic`、LangGraph 向け `/lang-chain`）。MFA は `HttpAgent`、self-hosted LangGraph は `LangGraphHttpAgent` を使う。
* `agent` は `agent/src/main.py` で FastAPI アプリを組み立て、`/mfa` に MFA アプリ（`/mfa/openai`・`/mfa/anthropic` など）、`/lang-chain` に LangGraph アプリをマウントする。
* Generative UI は CopilotKit v2 の frontend tool として `web` 側で登録する。登録されているのは `show_zenith_panel`、`show_ui_spec`、`show_flight_options` のみである（別経路として CopilotKit Runtime の MCP Apps iframe がある）。
* MCP Apps（iframe surface）は Runtime 側で登録する。LangGraph（`agent/src/lang_chain/app.py`）は `LangGraphAGUIAgent` と `add_langgraph_fastapi_endpoint` で AG-UI endpoint を公開し、frontend tool は `CopilotKitMiddleware` が LangGraph state の `copilotkit.actions` からモデルへ渡す。Backend tool は `agent/src/lang_chain/tool.py` の `build_tools(settings)` で MCP から取得し、`build_graph(..., server_tools=[...])` へバインドする。

## Generative UIの結論

このアプリのGenerative UIは、agentがUI部品そのものを直接生成するのではなく、 agentがfrontend toolを呼び出すか、CopilotKit RuntimeがMCP Appsをiframe surfaceとして表示する仕組みである。

つまり、LLMは「どのUIを、どのデータで出すか」を決める。 実際のDOM、CSS、React componentはfrontendが所有する。

## なぜ表示できるのか

1.  `web/src/app/layout.tsx` が `App`（`web/src/components/layout/App.tsx`）と `AppProviders` にページを渡し、`CopilotKitProvider` を配置して CopilotKit がチャット、agent 通信、tool call を扱える context を作る。
2.  `CopilotFrontendTools.tsx`が`useFrontendTool`を呼び、 static、declarative、custom（flight options）のfrontend toolをCopilotKitへ登録する。
3.  frontend toolには`zod` schemaで引数仕様を渡す。 CopilotKit Runtimeはこのtool仕様をagentへ渡せる。
4.  agent の instruction で、用途に応じて `show_zenith_panel`、`show_ui_spec`、`show_flight_options`、および MCP Apps（Runtime 登録）を使い分けるよう指定している。
5.  agentがtool callを返すと、CopilotKitが対応するfrontend toolの`render`を実行する。 その結果、チャットメッセージ内に`ZenithPanel`が表示される。

## 実行フロー

```
ユーザー
  → CopilotChat / CopilotKitProvider
  → /api/copilotkit（CopilotKit Runtime）
  → HttpAgent / LangGraphHttpAgent（AG_UI_BASE_URL + プロバイダ別パス、例: /mfa/openai, /lang-chain）
  → agent（tool call を決定）
  → CopilotKit Runtime が web の frontend tool registry へ
  → React（Static / Declarative / Custom）
  → チャット内に UI を表示
```

## Frontend Tool仕様

| tool | 方式 | 用途 |
| --- | --- | --- |
| `show_zenith_panel` | Static | 固定コンポーネントによるステータスカード・メトリクス・アクションプラン |
| `show_ui_spec` | Declarative | versioned UI schema による grid / list / table / callout / actions など |
| `show_flight_options` | Custom | フライト検索結果などドメイン固有カード |
| `Runtime mcpApps.servers` | MCP Apps | Runtime に登録された MCP App を iframe surface として表示 |

### Static Tool詳細

| 項目 | 仕様 |
| --- | --- |
| tool名 | `show_zenith_panel` |
| agent | `zenith` |
| 登録場所 | `web/src/features/chat/generative-ui/components/CopilotFrontendTools.tsx` |
| 表示component | `ZenithPanel` |
| 用途 | 視覚サマリー、ステータスカード、メトリクス、アクションプラン、dashboard風応答 |
| follow-up | `false`。tool実行後に追加のLLM応答を要求しない。 |

### 引数schema

| field | type | 制約 | 用途 |
| --- | --- | --- | --- |
| `title` | `string` | 必須 | パネル見出し |
| `summary` | `string` | 必須 | 概要文 |
| `tone` | `neutral | positive | warning` | default: `neutral` | 表示色とラベル |
| `metrics` | `{ label, value, delta? }[]` | 最大4件 | 数値や状態のタイル表示 |
| `nextActions` | `string[]` | 最大5件 | 次のアクション一覧 |

## 実装ファイル

| ファイル | 役割 |
| --- | --- |
| `web/src/app/layout.tsx` + `web/src/app/_providers/app-providers.tsx` + `web/src/components/layout/App.tsx` + `web/src/app/_providers/copilot-provider.tsx` | ルートレイアウト、`App`、`CopilotKitProvider` と `CopilotFrontendTools` を束ねる。 |
| `web/src/features/chat/hooks/use-chat-session.ts` / `use-conversation.ts` + `web/src/features/chat/context/chat-context.tsx` | チャットシェル・会話のクライアントロジックと `ChatProvider` / `useChatContext`。 |
| `web/src/features/chat/generative-ui/components/CopilotFrontendTools.tsx` | Generative UI frontend tools を CopilotKit へ登録する。 |
| `web/src/features/chat/generative-ui/lib/ui-spec-from-tool-args.ts` | `show_ui_spec` の tool 引数を `UISpec` / block 定義へ正規化する。 |
| `web/src/features/chat/generative-ui/components/declarative/DeclarativeRenderer.tsx` | `show_ui_spec` の UI schema を React component へ変換する。 |
| `web/src/app/api/copilotkit/route.ts` | CopilotKit Runtime を構築し、MFA は `HttpAgent`、LangGraph は `LangGraphHttpAgent` で agent へ接続する。 |
| `agent/src/mfa/agents.py` | MFA agent の instruction と OpenAI / Anthropic エージェント構築。 |
| `agent/src/lang_chain/app.py` + `agent/src/lang_chain/graph.py` | LangGraph AG-UI endpoint と `CopilotKitMiddleware` 付き LangGraph agent を構築する。 |
| `web/src/components/layout/App.test.tsx` | テスト環境で `useFrontendTool` を mock し、アプリ枠のチャット契約を維持する。 |

## 公式docsとの対応

*   CopilotKitは、LLMやagentをアプリ内のユーザー操作に接続するための仕組みを提供する。
*   CopilotKit docsでは、Generative UIはagentの状態やtool呼び出しをUIとして描画する用途で説明されている。
*   この実装は、agent stateを逐次描画する`useCoAgentStateRender`方式ではなく、 frontend toolの`render`でtool callをチャット内UIへ変換する方式である。
*   参照: [CopilotKit official docs llms-full.txt](https://docs.copilotkit.ai/llms-full.txt)

## 起動と確認

```
pnpm run dev:agent
pnpm run dev:web
pnpm run dev:mcp
```

`dev:mcp` は `mcp/src/dev.py` の `root-http` をファイル監視付きで起動し、streamable HTTP（例: `http://127.0.0.1:8101/mcp`）を公開する。別ターゲットは `uv run python mcp/src/dev.py <target>`（`mcp/src/dev.py` の定義に従う）。

ブラウザで`http://localhost:3000`を開き、次のように依頼する。

```
Generative UIで、現在のプロジェクト状況をステータスカードとして表示して。
メトリクスを3つ、次のアクションを3つ含めて。
```

## 制約

*   toolを呼ぶかどうかはLLMの判断に依存するため、promptではGenerative UIやステータスカードを明示する。
*   StaticとDeclarativeでは、UIの見た目はfrontend側のcomponentとrendererに制限される。
*   MCP Appsでは、raw HTMLをagentから直接受け取らず、FastMCP AppsのresourceをRuntime経由で表示する。
*   agentのinstructionを変更した後は、起動中の`dev:agent`を再起動する必要がある。
*   新しいUI種類を増やす場合は、frontend toolを追加するか、既存toolのschemaとrenderを拡張する。

## 品質確認

| 目的 | コマンド |
| --- | --- |
| JavaScript依存関係の同期 | `pnpm install` |
| Python依存関係の同期 | `uv sync --all-packages --dev` |
| format | `pnpm run format` |
| lint | `pnpm run lint` |
| type check | `pnpm run typecheck` |
| full quality gate | `pnpm run check` |

## 共有エージェントスキル

TDD 手順と CopilotKit 契約のチェックリストはリポジトリ直下の`skills/`に置く。 GitHub Copilot 拡張の plugin（`.github/plugin/plugin.json`）、Cursor のプロジェクトルール、Codex の`.codex/AGENTS.md`から同一パスで参照する。

*   `skills/zenith-tdd/SKILL.md`
*   `skills/copilotkit-contracts/SKILL.md`
