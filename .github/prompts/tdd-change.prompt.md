---
name: "tdd-change"
description: "このリポジトリの TDD 手順で、範囲を絞った変更を計画して実装する。"
agent: "agent"
---
要求された変更を、このリポジトリの TDD 手順で実装する。

1. 挙動要求を 1 文で示す。
2. 最初に失敗させる最小の観測可能なテストを特定する。
3. そのテストを追加または更新し、Red の失敗を確認する。
4. Green にするための最小実装を行う。
5. 対象テストを再実行する。
6. 関連する品質ゲートを実行する。最低限 `pnpm run check` は実行する。

[TDD](../../tdd-specification.md)、[AGENTS.md](../../AGENTS.md)、[CODING.md](../../CODING.md) に従う。
