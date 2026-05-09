'use client';

import { motion } from 'motion/react';
import { HomeView } from '@/features/chat/components/home-view';
import { useChatContext } from '@/features/chat/context/chat-context';

/**
 * `/` の見た目の配置。
 * Sidebar・CopilotKit の外枠は `layout.tsx` → `App`。
 */
export function HomePageBody() {
  const { chatControls, updateChatControls, startConversation } = useChatContext();

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center">
      <motion.div
        layout
        key="home"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mx-auto w-full max-w-3xl px-6"
      >
        <HomeView
          onSendMessage={startConversation}
          controls={chatControls}
          onControlsChange={updateChatControls}
        />
      </motion.div>
    </div>
  );
}

export default function HomePage() {
  return <HomePageBody />;
}
