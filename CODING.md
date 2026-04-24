# Coding Guide

この文書は Zenith AI Chat の実装ルールを定義する。対象は以下のモノレポ構成。

- FE/BFF: `web` TypeScript, Next.js, React, CopilotKit
- BE: `agent` Python agent service
- MCP: `mcp` Python, FastMCP

## 基本方針

- 変更は要求された範囲に限定する。
- サービス境界を曖昧にしない。
- 実装より先に契約を固定する。特に FE/BFF、BFF/BE、BE/MCP の境界は型とテストで守る。
- 推測で依存関係を追加しない。パッケージ名、import名、runtime API が未確定なら追加しない。
- ローカルで通らない品質ゲートをCIに持ち込まない。

## コマンド

JavaScript/TypeScript は `pnpm` を使う。`npm` は使わない。

Python は `uv` を使う。`pip install` や `python install` は使わない。

```bash
pnpm install
uv sync --all-packages --dev
uv run pre-commit install

pnpm run format
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
pnpm run check
uv run pre-commit run --all-files
```

## ディレクトリ責務

### `web`

- React UI と CopilotKit frontend/runtime 統合を置く。
- BFF以降の内部実装を直接知ってはならない。
- API呼び出し先は原則BFFに限定する。
- ユーザー操作、画面状態、入力検証、表示用型を扱う。
- サーバー側処理をFEに持ち込まない。

### `web BFF`

- FE向けAPIを提供する。
- 認証、セッション、リクエスト検証、下流サービス呼び出しの集約を扱う。
- agentの意思決定やtool実装を持たない。
- 外部に返すエラー形式を安定させる。

### `agent`

- agent実行、会話状態、tool選択方針を扱う。
- FE固有の表示都合を持たない。
- MCP toolの詳細実装を直接埋め込まない。
- AgentFrameworkの正式APIが未確定の間は、推測でruntime依存を追加しない。

### `mcp`

- FastMCP tool server を置く。
- toolの入出力スキーマを明示する。
- 副作用のあるtoolは入力検証、timeout、エラー分類を必須にする。
- agentやBFFの都合に依存した戻り値を作らない。

### `docs`

- 仕様書、設計判断、API契約、運用前提を置く。
- アーキテクチャ、コマンド、サービス契約を変えたら `docs/specification.html` を更新する。

## TypeScript / React

- formatter/linter は Biome を使う。
- 型検査は `tsc --noEmit` を通す。
- `any` は原則禁止。外部ライブラリ境界で避けられない場合は、最小範囲に閉じ込める。
- `unknown` を受けたら、zod等のschemaまたは型ガードで検証してから使う。
- React component は表示責務に寄せる。通信、永続化、契約変換は分離する。
- buttonには `type` を明示する。
- Node組み込みmoduleは `node:` protocol を使う。
- UI表示用型とAPI DTOを混同しない。
- path aliasやimport順序は既存設定とBiomeに従う。

## Python

- formatter/linter は Ruff を使う。
- 型検査は strict mypy を通す。
- package layout は `src` layout を使う。
- 公開関数、service境界、tool handlerには型注釈を付ける。
- `dict[str, Any]` を境界の標準型にしない。Pydantic model等で構造化する。
- 例外を握りつぶさない。ユーザー向けエラー、retry可能エラー、内部エラーを区別する。
- IO、ネットワーク、外部API呼び出しにはtimeoutを設ける。
- 環境変数は直接散らさず、設定moduleに集約する。
- packageごとに `py.typed` を維持する。

## API契約

- FE/BFF間はOpenAPIを単一の契約源にする。
- BFF/BE間はrequest/response schemaを明示する。
- BE/MCP間はMCP tool schemaを契約として扱う。
- 契約を変える場合は、実装、テスト、仕様書を同時に更新する。
- 破壊的変更は互換性方針を明示する。

## 設定と環境変数

- `.env.example` を更新せずに新しい環境変数を追加しない。
- secretはcommitしない。
- 本番値、API key、token、認証情報をログに出さない。
- 環境変数は起動時に検証し、不足時は明確なエラーで停止する。

## テスト

- 変更した挙動にはテストを追加または更新する。
- Pythonは `pytest` を使う。
- FEの複雑なUI挙動は、今後Playwright等のE2Eで確認する前提にする。
- service境界はcontract testを優先する。
- import smoke testだけで十分と判断してよいのは、package scaffoldのみ。

## CI / Pre-commit

- CIはローカル品質ゲートを再現する。
- `pnpm run format:check`
- `pnpm run check`
- `pnpm run test`
- `pnpm run build`
- `uv run pre-commit run --all-files`

pre-commitが自動修正した場合は、修正後に同じhookを再実行する。

## 依存関係

- runtime依存は必要性、利用箇所、代替手段を確認してから追加する。
- dev依存は品質ゲート、生成、テスト、開発体験に必要なものに限定する。
- lockfileは必ず更新する。
- npm lockfileは作らない。JavaScriptはルートの `pnpm-lock.yaml` に集約する。
- Python依存はルートの `uv.lock` に集約する。

## ログとエラー

- ログにsecret、token、個人情報、会話全文を不用意に出さない。
- ユーザーに返すエラーと内部ログの詳細度を分ける。
- 外部API失敗、validation失敗、timeout、内部不整合を区別する。
- retryする処理は冪等性を確認する。

## ドキュメント更新基準

以下を変更した場合はドキュメントを更新する。

- service構成
- 起動コマンド
- 環境変数
- API契約
- tool schema
- CIまたはpre-commit
- 開発者が守るべきルール

## 判断に迷った場合

優先順位は以下。

1. 契約と型で境界を固定する。
2. ローカルとCIで同じコマンドを通す。
3. 実行時の失敗を早期に検出する。
4. 不確定な依存や設計は未確定として明示する。
5. 関係ないリファクタリングを混ぜない。
