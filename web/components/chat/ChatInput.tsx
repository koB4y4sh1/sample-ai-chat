import { ArrowUp, Mic } from 'lucide-react';
import type React from 'react';
import { useRef, useState } from 'react';
import { cn } from '../../lib/utils';

interface ChatInputProps {
  onSend: (msg: string) => void;
  placeholder?: string;
  modelSelector?: React.ReactNode;
  toolSelector?: React.ReactNode;
  className?: string;
}

export function ChatInput({
  onSend,
  placeholder = 'Ask anything...',
  modelSelector,
  toolSelector,
  className,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = () => {
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
      }
    });
  };

  const handleSend = () => {
    if (input.trim()) {
      onSend(input);
      setInput('');
      resizeTextarea();
    }
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn('mx-auto w-full max-w-3xl', className)}>
      <div className="mx-auto rounded-[28px] border border-border bg-sidebar-bg px-4 pt-4 pb-3 shadow-xs transition-colors focus-within:border-text-secondary/40">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            resizeTextarea();
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          rows={4}
          className="min-h-28 w-full bg-transparent border-none focus:ring-0 text-text-primary placeholder-text-secondary px-2 py-2 resize-none leading-relaxed text-[15px]"
        />

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-border pt-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {toolSelector}
            {modelSelector}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-full p-2 text-text-secondary transition-colors hover:text-text-primary"
            >
              <Mic className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim()}
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300',
                input.trim()
                  ? 'bg-accent-gradient shadow-sm'
                  : 'bg-slate-200 text-white opacity-50 dark:bg-slate-800',
              )}
            >
              <ArrowUp className={cn('w-4 h-4 text-white', !input.trim() && 'opacity-0')} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
