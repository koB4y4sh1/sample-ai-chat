---
name: copilotkit-contracts
description: CopilotKit runtime 統合、frontend tool、agent context、Generative UI 契約の変更またはレビューで使う。
argument-hint: "[CopilotKit 変更]"
---
# CopilotKit Contract Skill

CopilotKit 境界の外側から変更を検証する。

確認する契約:

- ユーザーから見える chat UI の挙動。
- `/api/copilotkit` の request、response、error 形式。
- agent context 経由で渡される値。
- provider / model による endpoint 選択。
- frontend tool の名前、schema、登録、render 入力、失敗 UI。
- React component 内に agent の意思決定ロジックがないこと。

CopilotKit runtime の内部、呼び出し順序、private state に依存するテストは避ける。
