---
name: "Python Services"
description: "agent と mcp の Python 作業に適用するルール。"
applyTo: "agent/**/*.py,mcp/**/*.py"
---
# Python Services

- Python 関連コマンドは `uv` だけを使う。
- format と lint は Ruff、型検査は strict mypy を使う。
- `agent` の挙動と MCP tool 実装を分離する。
- 公開関数、service 境界、tool handler には型注釈を付ける。
- 境界では広い `dict[str, Any]` ではなく構造化された model を使う。
- 範囲と理由なしに Ruff や mypy の診断を抑制しない。
- 先に対象 `pytest` を実行し、完了前に `pnpm run check` を実行する。
