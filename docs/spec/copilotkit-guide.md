Zenith AI Chat / CopilotKit Guide

# CopilotKit ガイド

このプロジェクトにおける CopilotKit は、frontend のチャット画面、frontend tool 登録、runtime endpoint、agent 接続をまとめるレイヤーである。

## 1. どこで使われているか

| 場所 | 用途 |
| --- | --- |
| `web/src/components/layout/App.tsx` | 全ページ共通枠。Sidebar と `CopilotProvider`（内部で `CopilotKitProvider`）を配置する（`src/app/layout.tsx` の子がページ）。 |
| `web/src/app/api/copilotkit/route.ts` | Next.js App Router 上で CopilotKit Runtime endpoint を公開する（**web が公開する HTTP API はこれのみ**）。 |
| `web/src/lib/copilotkit/runtime.ts` | `CopilotRuntime` を組み立て、agent 登録や middleware を束ねる。 |
| `web/src/features/chat/generative-ui/components/CopilotFrontendTools.tsx` | `useFrontendTool` で static / declarative / custom の UI tool を登録する（チャット機能の一部）。 |

## 2. 現在の接続イメージ

```
ユーザー入力 → CopilotKitProvider
  → /api/copilotkit
  → CopilotRuntime
  → HttpAgent（選択プロバイダに応じて /mfa/openai | /mfa/anthropic | /lang-chain/ など）
  → agent サービス
  → 通常応答または frontend tool call
```

接続先 URL は `web/lib/copilotkit/agents.ts` の `resolveAgentUrl` とモデル選択に連動する。

## 3. agent 登録の意味

`web/lib/copilotkit/agents.ts` では `@ag-ui/client` の `HttpAgent` を使い、`zenith` という agent 名で登録している。これにより CopilotKit Runtime がチャット処理を AG-UI サービスへ転送できる。

## 4. frontend tool との関係

| tool | 表示種別 | 役割 |
| --- | --- | --- |
| `show_zenith_panel` | Static | 定義済みの React component にデータを渡して描画する。 |
| `show_ui_spec` | Declarative | block catalog 型の schema を React renderer が描画する。 |
| `show_flight_options` | Custom | フライト検索結果などを専用カードとして描画する。 |
| `Runtime mcpApps.servers` | MCP Apps | 許可された appId の埋め込み画面を iframe で出す。 |

## 5. このリポジトリでの CopilotKit の位置づけ

CopilotKit 本体が agent を実行しているわけではない。agent 実行は AG-UI サービス側にあり、CopilotKit は web における会話 UI と UI tool 呼び出しを橋渡しする役割である。
