---
name: zenith-tdd
description: Zenith AI Chat の TDD 手順に従う変更の実装またはレビューで使う。
argument-hint: "[変更要求]"
---
# Zenith TDD Skill

[tdd-specification.md](../../../tdd-specification.md) を正とする。

手順:

1. 要求された挙動を 1 文に変換する。
2. 受け入れ条件を観測可能な結果に分解する。
3. 先に最小の失敗テストを書く、または更新する。
4. 失敗原因が環境や typo ではなく、欠けている挙動であることを確認する。
5. Green に必要な最小コードを実装する。
6. テストが Green の状態を維持したままリファクタリングする。
7. 対象テストと関連する品質ゲートを実行する。

API route、agent 状態遷移、MCP tool、CopilotKit 契約が関係する場合、import smoke test だけで十分とは扱わない。
