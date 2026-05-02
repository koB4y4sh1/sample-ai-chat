Zenith AI Chat / API Communication Flow

# API・通信フロー仕様

この仕様は、チャット入力がどこを経て agent に届き、どこで UI 表示が変換されるかを通信経路として整理する。

## 1. 経路

```
Browser UI
  → CopilotKitProvider
  → Next.js route: /api/copilotkit
  → CopilotRuntime
  → HttpAgent（AG_UI_BASE_URL + プロバイダ別パス、例: /mfa/openai）
  → FastAPI agent service
  → 通常応答または frontend tool call
  → web 側 renderer が表示
```

プロバイダ（OpenAI / Anthropic / LangChain）に応じて `HttpAgent` の接続先 URL が切り替わる（`web/lib/copilotkit/agents.ts`）。

## 2. 通信要素と役割

| 要素 | 場所 | 役割 |
| --- | --- | --- |
| チャット UI | `web/components/chat` | ユーザー入力、会話表示、tool 結果の描画。 |
| Runtime endpoint | `web/app/api/copilotkit/route.ts` | `/api/copilotkit` を公開し CopilotKit Runtime に処理を渡す。 |
| Agent registry | `web/lib/copilotkit/agents.ts` | `@ag-ui/client` の `HttpAgent` で AG-UI 接続先を解決する。 |
| AG-UI endpoint | `agent/src/main.py` ほか | `/mfa/*`、`/lang-chain/*` など agent 側 endpoint。 |
| Frontend tools | `web/components/chat/GenerativeUIRegistry.tsx` | tool call を React の renderer に変換する。 |

## 3. エンドポイント整理

| URL | 提供側 | 説明 |
| --- | --- | --- |
| `/api/copilotkit` | web | ブラウザが叩く BFF。Runtime の入口。 |
| `AG_UI_BASE_URL` + `/mfa/openai` など | agent | CopilotKit Runtime から接続する MFA 側 AG-UI endpoint。 |
| `AG_UI_BASE_URL` + `/health` | agent | ルートアプリのヘルスチェック。 |

（LangChain 利用時は `LANG_CHAIN_AGENT_BASE_URL` や `/lang-chain/` の組み合わせを参照。）

## 4. Generative UI が関わるときの流れ

1. agent がユーザー発話を解釈し frontend tool を呼ぶ。
2. tool 名と引数が CopilotKit Runtime 経由で web に返る。
3. web の `GenerativeUIRegistry` が登録済み tool にディスパッチする。
4. static / declarative / open-ended のいずれかで描画する。
