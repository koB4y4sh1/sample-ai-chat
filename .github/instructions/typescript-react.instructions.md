---
name: "TypeScript React"
description: "web の TypeScript、React、Next.js、CopilotKit 作業に適用するルール。"
applyTo: "web/**/*.ts,web/**/*.tsx"
---
# TypeScript, React, and CopilotKit

- 新しい抽象を追加する前に、既存の実装パターンを優先する。
- React component は表示とユーザー操作に集中させる。
- BFF 呼び出しは `web` の route handler または既存の client helper の背後に置く。
- Biome の format と import 順序に従う。
- `any` は避ける。`unknown` は境界で schema または type guard により検証する。
- button には必ず明示的な `type` を指定する。
- CopilotKit 変更では runtime 内部ではなく公開契約をテストする。
- 先に対象テストを実行し、完了前に `pnpm run check` を実行する。
