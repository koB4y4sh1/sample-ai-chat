Zenith AI Chat / A2UI Guide

# A2UI ガイド

このリポジトリでは A2UI を「LLM が直接 HTML を生成して描画する」方式としては採用していない。frontend が所有する block catalog を agent に渡し、その catalog に沿って UI を組み立てる関係として位置づける。

## 1. 前提としていること

- agent は UI の部品そのものを生成しない。
- frontend がレンダリング可能な宣言的 schema として契約を渡す。
- 標準 block とカスタム block を catalog として扱うこと。

## 2. このリポジトリでの参照関係

| 参照 | 説明 |
| --- | --- |
| `web/lib/generative-ui/schemas/declarative.ts` | block type を定義した zod schema を置き、agent に渡す引数仕様を合わせる。 |
| `DeclarativeRenderer` | schema を React UI に変換する renderer。catalog の選択に対応する。 |
| `docs/spec/generative-ui.md` | 生成 HTML は `docs/html/generative-ui.html`。Basic / Custom Catalog と block の対応を記載する。 |

## 3. catalog の例

| 区分 | block type の例 | 用途 |
| --- | --- | --- |
| 基本表示 | `text`, `list`, `table`, `callout` | 説明文、一覧、表、注記の表示。 |
| サマリー | `metric_grid`, `key_value`, `progress` | 指標・状態・進捗のわかりやすい提示。 |
| 判断支援 | `decision`, `risk_matrix`, `task_plan` | 意思決定、リスク整理、タスク計画。 |
| カスタム | `flight_card`, `sales_dashboard`, `diff_preview` | 旅行、売上、差分などドメイン固有の表示。 |

## 4. 依存関係との関係

lockfile には `@a2ui/web_core` や `@copilotkit/a2ui-renderer` が含まれることがある。ただしこのアプリケーションコードが A2UI API をフルスタックで直接駆動しているとは限らない。現在は CopilotKit と declarative schema の設計境界として A2UI 由来の概念を参照しているだけであることが多い。

## 5. まとめ

Zenith AI Chat における A2UI は、agent が UI のカタログを使って structured response を返し、frontend がそれを描画するという説明が妥当である。HTML をそのままストリーミングする設計とは異なる。
