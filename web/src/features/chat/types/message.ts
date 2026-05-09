import type { UserMessage } from '@copilotkit/react-core/v2';

export interface ConversationViewHandle {
  sendMessage: (content: string, options?: { messageId?: string }) => Promise<void>;
}

export type EditingDraft = {
  message: UserMessage;
  text: string;
};
