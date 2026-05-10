'use client';

import type { ReactNode } from 'react';
import { CopilotProvider } from '@/app/_providers/copilot-provider';
import { Sidebar } from '@/components/common/Sidebar';
import { useChatSession } from '@/features/chat/hooks/use-chat-session';

/**
 * 全ページ共通のアプリ枠（Sidebar・CopilotKit / CopilotProvider）。
 * セッション状態はチャットドメインの `useChatSession` に委譲する。
 */
export default function App({ children }: { children: ReactNode }) {
  const {
    sessions,
    theme,
    toggleTheme,
    currentSessionId,
    currentSession,
    chatControls,
    updateChatControls,
    chatContextValue,
    showHome,
    selectSession,
    deleteSession,
  } = useChatSession();

  return (
    <div className="flex h-screen w-full overflow-hidden transition-colors duration-500 bg-bg text-text-primary">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={selectSession}
        onNewChat={showHome}
        onDeleteSession={deleteSession}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main
        className={
          currentSession
            ? 'relative flex flex-1 flex-col overflow-hidden'
            : 'relative flex flex-1 flex-col items-center justify-center overflow-hidden'
        }
      >
        <div className={currentSession ? 'flex h-full min-h-0 flex-1 flex-col' : 'w-full'}>
          <CopilotProvider
            chatControls={chatControls}
            updateChatControls={updateChatControls}
            chatContextValue={chatContextValue}
          >
            {children}
          </CopilotProvider>
        </div>
      </main>
    </div>
  );
}
