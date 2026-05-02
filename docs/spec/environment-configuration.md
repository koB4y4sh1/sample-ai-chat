Zenith AI Chat / Environment Configuration

# 環境設定仕様

この仕様は Zenith AI Chat をローカルで起動・検証するためのツールチェーン、セットアップ手順、起動コマンド、環境変数、品質ゲートをまとめたものである。

## 1. 前提ツール

| 種別 | 利用ツール | 備考 |
| --- | --- | --- |
| JavaScript package manager | pnpm 10.33.x | リポジトリ全体では pnpm。npm は使わない。 |
| Python package manager | uv 0.11.x | Python 依存は uv で管理し、lockfile を更新する。 |
| Node.js | 24.x | Next.js 開発サーバーと frontend build に該当。 |
| Python | 3.14.x 以上 | ルートの pyproject.toml と各 Python package の前提バージョン。 |

## 2. モノレポ構成

- **web** … Next.js frontend / BFF、`/api/copilotkit` の CopilotKit Runtime。
- **agent** … FastAPI で AG-UI 用エンドポイント（`/mfa/*`、`/lang-chain/*` など）と agent 実行。
- **mcp** … FastMCP で tool を公開。
- **docs** … 正は `docs/spec` の Markdown。`pnpm run docs:build` で `docs/html` を生成。

## 3. セットアップ手順

```
pnpm install
uv sync --all-packages --dev
uv run pre-commit install
```

JavaScript 依存はルートの pnpm-workspace で管理し、Python 依存は uv workspace で agent と mcp をまとめて管理する。

### 環境変数ファイルの利用

```
cp web/.env.example web/.env
```

実際の Windows 環境では PowerShell またはエディタで適宜コピーする。

## 4. 実行コマンド

| 用途 | コマンド | 説明 |
| --- | --- | --- |
| frontend 起動 | `pnpm run dev:web` | web package の Next.js 開発サーバーを起動する。 |
| agent 起動 | `pnpm run dev:agent` | uvicorn で AG-UI サービスを 8100 番ポートで公開する。 |
| build | `pnpm run build` | web package の production build を実行する。 |
| 品質確認 | `pnpm run check` | TypeScript 側の Biome と Python 側の Ruff、mypy をまとめて通す。 |

## 5. 品質ゲート

```
pnpm run format
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run check
uv run pre-commit run --all-files
```

ルートの check は lint と typecheck を含む。テストと build は別コマンドなので、変更内容に応じて追加実行する。

## 6. 主な環境変数

| 変数 | 利用側 | 既定値・説明 |
| --- | --- | --- |
| `AG_UI_BASE_URL` | web | 既定は `http://127.0.0.1:8100`。BFF が agent の `/copilotkit` に転送する。 |
| `ZENITH_OPENAI_MODEL` | agent | 既定は `gpt-5.4-nano`。Azure Foundry 経由で使うモデル名。 |
| `ZENITH_CORS_ORIGINS` | agent | 既定は `http://127.0.0.1:3000`。カンマ区切りで複数指定できる。 |
| `MCP_SERVER_URL` / `ZENITH_MCP_SERVER_URL` | agent（lang-chain のみ） | 未設定のときは LangGraph に MCP ツールを載せない。例: `http://127.0.0.1:8101/mcp`（`pnpm run dev:mcp:http` 想定） |

## 7. 運用上の注意

JavaScript は pnpm、Python は uv で統一する。新しい環境変数を追加する場合は `web/.env.example` を更新する。アーキテクチャ・コマンド・サービス契約が変わる場合は `docs/spec/specification.md` を更新し、`pnpm run docs:build` で HTML を再生成する。
