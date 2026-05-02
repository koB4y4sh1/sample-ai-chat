Zenith AI Chat / pre-commit Guide

# pre-commit ガイド

このリポジトリでは pre-commit をコミット前の品質ゲートとして使う。`fail_fast` が有効なので、上から順に失敗したフックの修正が先になる。

## 1. 初期セットアップ

```
uv run pre-commit install
```

フックの定義はルートの `.pre-commit-config.yaml` にある。

## 2. 除外対象

Next.js の build 生成物、`node_modules`、`.venv`、Ruff と mypy のキャッシュは pre-commit の除外にある。

```
web/.next/
web/node_modules/
.venv/
.ruff_cache/
.mypy_cache/
```

## 3. フック一覧

| 種別 | hook | 役割 |
| --- | --- | --- |
| 基本検証 | `check-yaml`, `check-toml`, `check-json` | 設定ファイルの構文崩れを早期検知する。 |
| 事故防止 | `check-merge-conflict`, `detect-private-key`, `check-added-large-files` | マーカー残り、秘密鍵、大きすぎるファイル追加を抑止する。 |
| 整形 | `end-of-file-fixer`, `mixed-line-ending`, `trailing-whitespace` | 末尾と改行スタイルを整える。`mixed-line-ending` は LF に揃える。 |
| lockfile | `uv-lock` | Python 依存変更時に `uv.lock` を維持する。 |
| TypeScript 品質 | `biome-check` | `pnpm exec biome check .` をフル実行する。 |
| Python 品質 | `ruff-check`, `ruff-format`, `mypy` | Python の lint、format、strict type check を回す。 |

## 4. よく使うコマンド

```
uv run pre-commit run --all-files
uv run pre-commit run mypy --all-files
uv run pre-commit run biome-check --all-files
```

変更範囲が広いときは `--all-files` で全体チェックする。単一 hook を試したいときは hook 名を指定する。自動修正フックが走ったら、修正後にもう一度同じ hook を通す。

## 5. 失敗したときの心得

- 自動修正系 hook が変更を出したら、差分を確認してから再度フックを実行する。
- mypy は `pnpm run typecheck:py` と同様に agent / mcp を対象にする。mounted アプリと child の型も見えるようにしている。
- Biome は `pass_filenames: false` のため、ステージしたファイルだけでなくワークスペース全体をチェックする。
