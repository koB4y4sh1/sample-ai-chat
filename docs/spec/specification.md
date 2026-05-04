# Zenith AI Chat 仕様書

作成日: 2026-04-24 / 更新日: 2026-05-03 / 対象: web, agent, mcp

## 関連ドキュメント

- **[ドキュメントガイド](./documentation-guide.html)** … `docs/spec` の読み順・用途別索引・全ページ一覧。

## 目的

Zenith AI Chatは、Next.jsのチャットUIからCopilotKit Runtimeを経由してagentへ接続し、 通常のテキスト応答とGenerative UI応答を同じ会話画面に表示するチャットアプリである。

## 構成

| 領域 | ディレクトリ | 技術 | 責務 |
| --- | --- | --- | --- |
| FE/BFF | `web` | TypeScript, Next.js, React, CopilotKit, pnpm | チャットUI、CopilotKit Runtime endpoint、agentへのBFF route handler |
| BE | `agent` | Python, Microsoft Agent Framework, uv | agentの実行、agent endpointの公開、LLMへの指示管理 |
| MCP | `mcp` | Python, FastMCP, uv | agentから利用する外部tool群の公開 |
| ドキュメント | `docs` | Markdown, HTML | 仕様の正は `docs/spec/*.md`。閲覧用 HTML は `pnpm run docs:build` で `docs/html` に生成する。テンプレートは `docs/template`。 |

## 接続仕様

* `web` は Next.js App Router で UI と BFF route handler を管理する。
* チャット UI は `/api/copilotkit` の CopilotKit Runtime へ接続する。
* Runtime は `AG_UI_BASE_URL` を基準に、チャットで選んだモデルプロバイダに応じて agent へ転送する（例: OpenAI 向け `/mfa/openai`、Anthropic 向け `/mfa/anthropic`、LangChain 向け `/lang-chain/`）。実際の URL 組み立ては `web/lib/copilotkit/agents.ts` の `HttpAgent` を参照。
* `agent` は `agent/src/main.py` で FastAPI アプリを組み立て、`/mfa` に MFA アプリ（`/mfa/openai`・`/mfa/anthropic` など）、`/lang-chain` に LangGraph アプリをマウントする。
* Generative UI は CopilotKit v2 の frontend tool として `web` 側で登録する。登録例には `show_zenith_panel`、`show_ui_spec`、`show_flight_options`、`show_mcp_app`（open-ended iframe）、`map_view_show_google_map` などがある。
* MCP Apps（iframe surface）は `web/lib/copilotkit/runtime.ts` の `MCPAppsMiddleware` などで登録する。LangChain（`agent/src/lang_chain/app.py`）は、環境変数 `MCP_SERVER_URL` または `ZENITH_MCP_SERVER_URL` が設定されているとき、Streamable HTTP の MCP（例: `http://127.0.0.1:8101/mcp`）へ接続して `tools/list` の**全ツール**を LangGraph の backend tool（`server_tools`）としてバインドする。BFF 経由で同名ツールが渡った場合は MCP 側を優先する。

## Generative UIの結論

このアプリのGenerative UIは、agentがUI部品そのものを直接生成するのではなく、 agentがfrontend toolを呼び出すか、CopilotKit RuntimeがMCP Appsをiframe surfaceとして表示する仕組みである。

つまり、LLMは「どのUIを、どのデータで出すか」を決める。 実際のDOM、CSS、React componentはfrontendが所有する。

## なぜ表示できるのか

1.  `App.tsx`で`CopilotKitProvider`を配置し、 CopilotKitがチャット、agent通信、tool callを扱えるcontextを作る。
2.  `GenerativeUIRegistry.tsx`が`useFrontendTool`を呼び、 static、declarative、custom mapのfrontend toolをCopilotKitへ登録する。
3.  frontend toolには`zod` schemaで引数仕様を渡す。 CopilotKit Runtimeはこのtool仕様をagentへ渡せる。
4.  agent の instruction で、用途に応じて `show_zenith_panel`、`show_ui_spec`、`show_flight_options`、`show_mcp_app`、`map_view_show_google_map`、MCP Apps を使い分けるよう指定している。
5.  agentがtool callを返すと、CopilotKitが対応するfrontend toolの`render`を実行する。 その結果、チャットメッセージ内に`ZenithPanel`が表示される。

## 実行フロー

```
ユーザー
  → CopilotChat / CopilotKitProvider
  → /api/copilotkit（CopilotKit Runtime）
  → HttpAgent（AG_UI_BASE_URL + プロバイダ別パス、例: /mfa/openai）
  → agent（tool call を決定）
  → CopilotKit Runtime が web の frontend tool registry へ
  → React（Static / Declarative / open-ended iframe / Maps 等）
  → チャット内に UI を表示
```

## Frontend Tool仕様

| tool | 方式 | 用途 |
| --- | --- | --- |
| `show_zenith_panel` | Static | 固定コンポーネントによるステータスカード・メトリクス・アクションプラン |
| `show_ui_spec` | Declarative | versioned UI schema による grid / list / table / callout / actions など |
| `show_flight_options` | Custom | フライト検索結果などドメイン固有カード |
| `show_mcp_app` | Open-ended | 事前定義ブロックに収まらない埋め込みアプリ（sandbox iframe） |
| `map_view_show_google_map` | MCP Apps 連携 | Google Maps を iframe で表示 |
| `Runtime mcpApps.servers` | MCP Apps | Runtime に登録された MCP App を iframe surface として表示 |

### Static Tool詳細

| 項目 | 仕様 |
| --- | --- |
| tool名 | `show_zenith_panel` |
| agent | `zenith` |
| 登録場所 | `web/components/chat/GenerativeUIRegistry.tsx` |
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
| `web/components/chat/App.tsx` | `CopilotKitProvider`を配置し、`GenerativeUIRegistry`をprovider配下へ登録する。 |
| `web/components/chat/GenerativeUIRegistry.tsx` | Generative UI frontend toolsをCopilotKitへ登録する。 |
| `web/components/generative-ui/declarative/DeclarativeRenderer.tsx` | `show_ui_spec`のUI schemaをReact componentへ変換する。 |
| `web/components/chat/StableMcpAppsActivityRenderer.tsx` | CopilotKit RuntimeのMCP Apps activityを安定したiframe surfaceとして描画する。 |
| `web/app/api/generative-ui/mcp-apps/[appId]/route.ts` | Google Maps MCP App用のsandboxed app HTMLを配信する。 |
| `agent/src/mfa/agents.py` | MFA agent の instruction と OpenAI / Anthropic エージェント構築。 |
| `web/components/chat/App.test.tsx` | テスト環境で`useFrontendTool`をmockし、既存チャットテストを維持する。 |

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
