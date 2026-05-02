Zenith AI Chat / AG-UI Guide

# AG-UI ガイド

このリポジトリで AG-UI と呼ぶのは、Python の agent サービスが提供する会話 endpoint と、web から agent へ接続するときの transport 層を指す。

## 1. 所在

| 場所 | 説明 |
| --- | --- |
| `agent/src/mfa/app.py` | FastAPI app を組み立て、OpenAI / Anthropic 用の AG-UI endpoint と `/health` を公開する。 |
| `agent/src/main.py` | エントリ。uvicorn の factory でアプリを返す。`/mfa` と `/lang-chain` をマウントする。 |
| `agent/src/lang_chain/app.py` | LangGraph ベースの AG-UI ストリーム（`/lang-chain` 側）。 |
| `web/lib/copilotkit/agents.ts` | `@ag-ui/client` の `HttpAgent` で接続先 URL を組み立てる。 |

## 2. agent サービスの役割

- Microsoft Agent Framework の Agent を実行する。
- Azure の資格情報とモデルクライアントでモデルへ接続する。
- ユーザー発話に応じて通常応答や Generative UI tool 呼び出しを選ぶ。
- MFA アプリ内では `/openai`・`/anthropic` を AG-UI endpoint として公開する（ルートの `main.py` で `/mfa` にマウントされ、実際の URL は `/mfa/openai` などになる）。

## 3. endpoint の構造（概念）

```
FastAPI(root: Zenith Agent Service)
  ├ mount /mfa  → MFA アプリ（例: /mfa/openai, /mfa/anthropic, /mfa/health）
  └ mount /lang-chain → LangChain アプリ（例: /lang-chain/ …）
```

web 側は `AG_UI_BASE_URL` と、選択したモデルプロバイダに応じたパス（`/mfa/openai`、`/mfa/anthropic`、`/lang-chain/` など）を組み合わせて agent に転送する。

## 4. 設定の例

| 設定 | 既定値の例 | 説明 |
| --- | --- | --- |
| `openai_model` | `gpt-5.4-nano` | agent が既定で使うモデル名。 |
| `cors_origins` | `http://127.0.0.1:3000` | FastAPI 側の許可 origin。カンマ区切りで複数指定可能。 |

## 5. 実行コマンド

```
pnpm run dev:agent

# 概ね: uv run uvicorn src.main:create_app --factory --reload --port 8100
```

## 6. このガイドでの注意

AG-UI は frontend の表示ライブラリではない。Zenith AI Chat では agent サービスと web の `HttpAgent` 接続をまとめて AG-UI 連携として説明している。
