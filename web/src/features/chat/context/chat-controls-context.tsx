'use client';

import { createContext, type Dispatch, type SetStateAction, useContext } from 'react';
import type { ChatControlsState } from '@/lib/chat-controls';

type ChatControlsContextValue = {
  controls: ChatControlsState;
  setControls: Dispatch<SetStateAction<ChatControlsState>>;
};

const ChatControlsContext = createContext<ChatControlsContextValue | null>(null);

export function ChatControlsProvider({
  value,
  children,
}: {
  value: ChatControlsContextValue;
  children: React.ReactNode;
}) {
  return <ChatControlsContext.Provider value={value}>{children}</ChatControlsContext.Provider>;
}

export function useChatControls() {
  const value = useContext(ChatControlsContext);
  if (!value) {
    throw new Error('useChatControls must be used within ChatControlsProvider');
  }
  return value;
}
