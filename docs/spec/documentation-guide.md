---
title: ドキュメントガイド
description: docs/spec の読み順と各ファイルの役割。HTML は docs/html で閲覧。
---

# ドキュメントガイド

`docs/spec` の Markdown が正本です。ブラウザで読む場合は `pnpm run docs:build` 後に `docs/html/*.html` を開いてください。

## まず読むもの（最短ルート）

1. **[全体仕様書](./specification.html)** … アプリの目的・モノレポ構成・接続と Generative UI の結論。
2. **[ワークスペース概要](./workspace-overview.html)** … web / agent / mcp の境界とリクエストの流れ。
3. **[環境設定仕様](./environment-configuration.html)** … ツールチェーン、セットアップ、環境変数、よく使うコマンド。

ここまでで「何のプロジェクトか」「どこに何があるか」「どう起動するか」が揃います。

## 用途別の読み方

| やりたいこと | 読むドキュメント |
| --- | --- |
| ディレクトリにコードを置く | [ディレクトリ構成仕様](./directory-structure.html) |
| 通信経路を追う | [API・通信フロー仕様](./api-communication-flow.html) |
| リポジトリルールの確認 | ルートの `AGENTS.md` / `CODING.md` と [開発ルール仕様](./development-rules.html) |
| 依存を増やす・更新する | [依存関係ポリシー仕様](./dependency-policy.html) |
| Lint / format / 型 / hooks | [Biome](./biome-guide.html) / [Ruff](./ruff-guide.html) / [mypy](./mypy-guide.html) / [pre-commit](./pre-commit-guide.html) |
| テストを書く・足す | [テスト戦略仕様](./test-strategy.html) |
| Generative UI を理解する | [Generative UI 解説](./generative-ui.html) → [サンプルカタログ](./generative-ui-examples.html) |
| CopilotKit / AG-UI / A2UI | [CopilotKit ガイド](./copilotkit-guide.html) → [AG-UI ガイド](./ag-ui-guide.html) → [A2UI ガイド](./a2ui-guide.html) |
| MCP のテーマや載せ方を検討する | [MCP テーマ選定メモ](./mcp-theme-selection.html) |

## 全ページ一覧（カテゴリ別）

### 核となる仕様

| ページ | 内容 |
| --- | --- |
| [全体仕様書](./specification.html) | システム全体の前提・接続・Generative UI・品質コマンド |
| [開発ルール仕様](./development-rules.html) | AGENTS/CODING の要約とドキュメント更新の約束事 |

### 環境・構造・通信

| ページ | 内容 |
| --- | --- |
| [環境設定仕様](./environment-configuration.html) | バージョン、セットアップ、起動、環境変数 |
| [ワークスペース概要](./workspace-overview.html) | パッケージ役割・境界・リクエストの流れ |
| [ディレクトリ構成仕様](./directory-structure.html) | ルートと主要ディレクトリの対応表 |
| [API・通信フロー仕様](./api-communication-flow.html) | BFF → Runtime → agent の経路 |

### 品質・開発運用

| ページ | 内容 |
| --- | --- |
| [依存関係ポリシー仕様](./dependency-policy.html) | pnpm / uv、lockfile、追加前の確認 |
| [Biome ガイド](./biome-guide.html) | TS/JSON の format・lint |
| [Ruff ガイド](./ruff-guide.html) | Python の format・lint |
| [mypy ガイド](./mypy-guide.html) | strict 型検査の範囲とコマンド |
| [pre-commit ガイド](./pre-commit-guide.html) | コミット前フック一覧 |
| [テスト戦略仕様](./test-strategy.html) | pytest / Vitest の置き場所の考え方 |

### AI・UI

| ページ | 内容 |
| --- | --- |
| [Generative UI 解説](./generative-ui.html) | Static / Declarative / MCP の考え方 |
| [Generative UI サンプルカタログ](./generative-ui-examples.html) | ツール選びの具体例 |
| [CopilotKit ガイド](./copilotkit-guide.html) | Runtime・Provider・frontend tool |
| [AG-UI ガイド](./ag-ui-guide.html) | agent 側 endpoint と web の接続 |
| [A2UI ガイド](./a2ui-guide.html) | block catalog との関係 |
| [MCP テーマ選定メモ](./mcp-theme-selection.html) | MCP UI の設計判断ログ |

## ルートのドキュメントとの関係

- **`AGENTS.md`** … コマンド必須セットとリポジトリ全体ルール。
- **`CODING.md`** … 実装ルールの詳細（境界、CopilotKit TDD、テスト方針など）。

`docs/spec` は Zenith 固有の**設計・運用の説明**に寄せ、`AGENTS.md` / `CODING.md` と重なる部分は「要約 + リンク」に留めるファイルがあります（例: 開発ルール仕様）。

## HTML の生成

```bash
pnpm run docs:build
```

出力先は `docs/html/`。仕様や索引を変えたあと、閲覧用 HTML をコミットする運用で揃えています。
