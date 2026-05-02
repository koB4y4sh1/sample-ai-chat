Zenith AI Chat / Dependency Policy

# 依存関係ポリシー仕様

この仕様は、依存を追加・更新するときの判断基準をまとめる。ルールの中心は package manager の統一、lockfile の単一管理、runtime 依存追加の正当性である。

## 1. 使う package manager

| 領域 | 利用 | 方針 |
| --- | --- | --- |
| JavaScript / TypeScript | `pnpm` | npm は使わない。workspace 全体の依存は `pnpm-lock.yaml` に集約する。 |
| Python | `uv` | `pip install` は使わない。workspace 依存は `uv.lock` に集約する。 |

## 2. 追加前に確認すること

- 本当に runtime 依存が必要か。標準ライブラリや既存ツールで代替できないか。
- どの package で使うか（web / agent / mcp のどこに置くか）。
- package 名、import 名、API が確定しているか。
- lockfile の更新と品質ゲートまで一連で完了できるか。

## 3. 依存が置かれる場所

| 場所 | 置くもの |
| --- | --- |
| `package.json` | ルート共通 script と、ルートで共有する開発依存。 |
| `web/package.json` | frontend と BFF 実装に必要な JS 依存。 |
| `pyproject.toml` | workspace 共通の Python 開発設定と Ruff、mypy、pytest 設定。 |
| `agent/pyproject.toml` と `mcp/pyproject.toml` | 各 Python package の runtime 依存。 |

## 4. 現在の方針

- runtime 依存は必要性、利用箇所、代替手段を確認してから追加する。
- dev 依存は品質ゲート、生成、テスト、開発体験に必要なものに限定する。
- lockfile は必ず更新する。
- 未確定な runtime API に依存ライブラリを足さない。
