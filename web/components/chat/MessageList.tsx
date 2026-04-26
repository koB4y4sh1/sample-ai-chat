import { motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../../lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface MessageListProps {
  messages: Message[];
  isStreaming?: boolean;
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length >= 0 || isStreaming !== undefined) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isStreaming]);

  return (
    <div className="flex-1 w-full overflow-y-auto px-[15%] py-10 space-y-10">
      <div className="flex flex-col gap-10 pb-10">
        {messages.map((message, i) => (
          <motion.div
            key={message.id || i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              'flex flex-col gap-2 max-w-full group',
              message.role === 'user' ? 'items-end' : 'items-start',
            )}
          >
            <div
              className={cn(
                'bubble rounded-xl text-[15px] leading-relaxed transition-colors',
                message.role === 'user'
                  ? 'bg-sidebar-bg border border-border text-text-primary px-5 py-4'
                  : 'bg-transparent text-text-primary py-2 pr-4 pl-0',
              )}
            >
              <div className="prose dark:prose-invert prose-slate max-w-none">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        ))}
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start"
          >
            <div className="bg-transparent py-2 pr-4 pl-0">
              <span className="inline-block w-[2px] h-[18px] bg-text-primary/80 animate-pulse ml-1 align-middle" />
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
