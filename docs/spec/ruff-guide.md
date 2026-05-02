Zenith AI Chat / Ruff Guide

# Ruff ガイド

このリポジトリでは Python 側の formatter と linter に Ruff を統一する。役割はコード整形、import 整理、よくあるバグの検出、基本的なセキュリティ観点のチェックである。

## 1. 現在の設定（ルート `pyproject.toml` の `[tool.ruff]`）

| 項目 | 設定値 | 説明 |
| --- | --- | --- |
| `line-length` | `150` | Python コードの改行基準（プロジェクト設定に従う）。 |
| `target-version` | `py314` | Python 3.14 前提で lint と format を揃える。 |
| `quote-style` | `double` | 文字列はダブルクォートへ整形する。 |
| `indent-style` | `space` | タブではなくスペース。 |
| `line-ending` | `lf` | 改行は LF に統一する。 |

## 2. 代表的な lint カテゴリ

| prefix | 由来 | 説明 |
| --- | --- | --- |
| `E`, `F` | pycodestyle / Pyflakes | 基本的な構文ミス、未使用名、未定義参照など。 |
| `I` | isort | import 並びを整理する。 |
| `B` | bugbear | バグになりやすい書き方を指摘する。 |
| `UP` | pyupgrade | 新しい Python で推奨される書き方へ誘導する。 |
| `S` | bandit 系 | 危険なパターンを軽く抑止する。 |
| `PERF`, `SIM`, `C4`, `PTH`, `RUF`, `N`, `T20` | 各種 | 性能、簡素化、内包表記、pathlib 利用、`print` の扱いなど。 |

`E501`（行長）は設定で無視し、改行の見た目を崩さないようプロジェクト都合で切っている（`pyproject.toml` 参照）。

## 3. 例外設定

`tests` 配下では `S101` を無視している。pytest の `assert` 利用を許容するためである。

`.venv`、`web/node_modules`、`web/dist` は Ruff の対象外である。

## 4. よく使うコマンド

```
uv run ruff check .
uv run ruff check --fix .
uv run ruff format .
pnpm run lint
pnpm run format
```

ルートの lint と format には他ツールも混ざる。Python だけを確認したいときは `uv run` を直接使う。
