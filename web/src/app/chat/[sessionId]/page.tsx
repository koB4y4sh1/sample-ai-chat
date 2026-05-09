'use client';

import { motion } from 'motion/react';
import { use } from 'react';
import { ConversationView } from '@/features/chat/components/conversation-view';
import { useChatContext } from '@/features/chat/context/chat-context';

interface ChatSessionPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export function ChatSessionPageBody({ sessionId }: { sessionId: string }) {
  const {
    attachConversationViewHandle,
    chatControlsRef,
    onActiveToolCallIdsChange,
    resolveSessionTitle,
  } = useChatContext();

  const title = resolveSessionTitle(sessionId);

  return (
    <motion.div
      key={sessionId}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full min-h-0 w-full flex-1"
    >
      <div className="flex h-full min-h-0 flex-1 flex-col border border-border bg-bg shadow-sm">
        <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)]">
          <header className="border-b border-border px-5 py-2">
            <h2 className="text-base font-semibold text-text-primary">{title}</h2>
          </header>
          <div className="flex min-h-0">
            <ConversationView
              ref={attachConversationViewHandle}
              sessionId={sessionId}
              controlsRef={chatControlsRef}
              onActiveToolCallIdsChange={onActiveToolCallIdsChange}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ChatSessionPage({ params }: ChatSessionPageProps) {
  const { sessionId } = use(params);

  return <ChatSessionPageBody sessionId={sessionId} />;
}
