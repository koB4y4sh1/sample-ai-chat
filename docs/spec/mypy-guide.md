Zenith AI Chat / mypy Guide

# mypy ガイド

このリポジトリでは Python 側の型検査を strict mypy で行う。目的は service 境界、公開関数、設定まわりの型安全性を実装時に潰し込むことにある。

## 1. 現在の設定（ルート `pyproject.toml` の `[tool.mypy]`）

| 項目 | 設定値 | 説明 |
| --- | --- | --- |
| `python_version` | `3.14` | 解析対象を Python 3.14 前提にする。 |
| `strict` | `true` | 厳格モードを既定とする。 |
| `namespace_packages` | `true` | workspace 内 package 構成と整合させる。 |
| `explicit_package_bases` | `true` | package base を明示し import 解決を安定させる。 |
| `mypy_path` | `["agent", "mcp/src"]` | 名前解決のベースパスとして使う。 |

## 2. 対象範囲

ルートの script と pre-commit では `pnpm run typecheck:py` が次を実行する。

```
uv run mypy -p src && uv run mypy mcp/src mcp/tests
```

（前者は agent package、`src` は agent 側のレイアウトに依存。）

`exclude` で `^web/` と `^docs/` は型検査から外している。

## 3. 運用上の心得

- 公開関数、service 境界、tool handler には型注釈を付ける。
- 境界で `dict[str, Any]` に逃げない。Pydantic model などで構造化する。
- 環境変数は設定モジュールへ集約し、ばらまかない。
- package ごとに `py.typed` を維持する。

## 4. 実行コマンド

```
pnpm run typecheck:py
pnpm run typecheck
pnpm run check
uv run pre-commit run mypy --all-files
```

`typecheck` は TypeScript と Python を続けて実行する。mypy のエラーだけ直したいときは `pnpm run typecheck:py` が読みやすい。
