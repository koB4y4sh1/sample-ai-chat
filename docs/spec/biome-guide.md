Zenith AI Chat / Biome Guide

# Biome ガイド

このリポジトリでは TypeScript と JSON 周りの整形および lint に Biome を使う。frontend だけでなくルートからモノレポ全体を対象とするのが位置づけである。

## 1. 役割

- formatter: インデント幅、行長、シングルクォート、セミコロンなどを統一する。
- linter: 未使用 import、未使用変数、`import type` の使い分けなどを拾う。
- assist: `organizeImports` を有効にし、import の並びを整理する。

## 2. 現在の主な設定（`biome.json`）

| 項目 | 設定値 | 説明 |
| --- | --- | --- |
| indentStyle | `space` | タブではなくスペースを使う。 |
| indentWidth | `2` | JS/TS のインデント幅は 2。 |
| lineWidth | `100` | 長すぎる行を折り返す基準。 |
| quoteStyle | `single` | JavaScript 文字列はシングルクォートに寄せる。 |
| trailingCommas | `all` | JavaScript では末尾カンマを付ける。 |

## 3. 代表的な lint rule の読み方

| rule | level | 意味 |
| --- | --- | --- |
| `noUnusedImports` | error | 未使用 import をコミット前に潰す。 |
| `noUnusedVariables` | error | 使っていない変数を残さない。 |
| `useExhaustiveDependencies` | warn | React の依存配列漏れを警告する。 |
| `noExplicitAny` | warn | `any` を濫用しない場合に限定して許容する。 |
| `useImportType` | error | type import を明示し、値と型の境界を分ける。 |

## 4. 対象と除外

Biome はワークスペース全体から見るが、生成物や依存、`node_modules`、キャッシュ、lockfile、`*.tsbuildinfo`、Next.js の `.next` などは除外する。

```
!**/.venv
!**/node_modules
!**/dist
!**/.ruff_cache
!**/.mypy_cache
!uv.lock
!pnpm-lock.yaml
!**/*.tsbuildinfo
!web/.next
```

テンプレート HTML（`docs/template`）はプレースホルダのため Biome 対象外としている。

## 5. よく使うコマンド

```
pnpm run format
pnpm run lint
pnpm exec biome check .
pnpm exec biome check --write .
```

`format` は Biome の自動修正に加え Python 側の Ruff format を続けて実行する。`lint` は TypeScript 側では Biome check、Python 側では Ruff check を含む。

## 6. 運用メモ

このリポジトリでは ESLint ではなく Biome を第一選択としている。frontend の細かい規約の多くは、可能な限り Biome の設定に寄せて一貫して直すのがよい。
