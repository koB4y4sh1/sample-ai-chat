'use client';

import type { ReactNode, RefObject } from 'react';
import { createContext, useContext } from 'react';
import type { ConversationViewHandle } from '@/features/chat/types/message';
import type { ChatControlsState } from '@/lib/chat-controls';

export type ChatContextValue = {
  chatControls: ChatControlsState;
  updateChatControls: (
    next: ChatControlsState | ((current: ChatControlsState) => ChatControlsState),
  ) => void;
  startConversation: (content: string) => void;
  attachConversationViewHandle: (handle: ConversationViewHandle | null) => void;
  chatControlsRef: RefObject<ChatControlsState>;
  onActiveToolCallIdsChange: (toolCallIds: Set<string>) => void;
  resolveSessionTitle: (sessionId: string) => string;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext(): ChatContextValue {
  const value = useContext(ChatContext);
  if (!value) {
    throw new Error('useChatContext must be used within App');
  }
  return value;
}

export function ChatProvider({
  value,
  children,
}: {
  value: ChatContextValue;
  children: ReactNode;
}) {
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
