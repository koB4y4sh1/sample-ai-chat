---
name: "TypeScript React"
description: "web の TypeScript、React、Next.js、CopilotKit 作業に適用するルール。"
applyTo: "web/**/*.ts,web/**/*.tsx"
---
# TypeScript, React, and CopilotKit

## 命名規則

`web` ディレクトリ全体で以下の命名規則を統一する。

| 対象 | 規則 | 例 |
|------|------|------|
| ディレクトリ | kebab-case | `components`, `common`, `generative-ui`, `chat-input` |
| ファイル | kebab-case | `chat-input.tsx`, `use-chat-session.ts`, `chat-context.tsx` |
| React component 名 | PascalCase | `ChatInput`, `Sidebar`, `HumanInTheLoop` |
| hooks 名 | camelCase、useXxx 接頭辞 | `useChatSession`, `useChatInput`, `useConversation` |
| 関数名 | camelCase | `buildChatControlContext`, `fetchChatHistory`, `validateMessage` |
| 変数名 | camelCase | `chatControls`, `selectedModel`, `messageList` |
| 型名 | PascalCase | `ChatContextValue`, `Message`, `SessionState` |
| 定数名 | UPPER_SNAKE_CASE | `DEFAULT_MODEL`, `MAX_MESSAGE_LENGTH`, `API_ENDPOINT` |

### 適用範囲の注記

- **ルートパラメータ**: Next.js の `[param]` 規則に従う。例：`[session-id]` → `[sessionId]` として TypeScript で参照
- **インポートパス**: type/const は PascalCase、それ以外はファイル名（kebab-case）に従う
  - `import { useChatSession } from '@/features/chat/hooks/use-chat-session'`
  - `import type { ChatContextValue } from '@/features/chat/context/chat-context'`

## 実装ルール

- 新しい抽象を追加する前に、既存の実装パターンを優先する。
- React component は表示とユーザー操作に集中させる。
- BFF 呼び出しは `web` の route handler または既存の client helper の背後に置く。
- Biome の format と import 順序に従う。
- `any` は避ける。`unknown` は境界で schema または type guard により検証する。
- button には必ず明示的な `type` を指定する。
- CopilotKit 変更では runtime 内部ではなく公開契約をテストする。
- 先に対象テストを実行し、完了前に `pnpm run check` を実行する。
