'use client';

import { ArrowUp, Mic } from 'lucide-react';
import type React from 'react';
import { ModelSelector } from '@/components/common/model-selector';
import { ToolSelector } from '@/components/common/tool-selector';
import { useChatControls } from '@/features/chat/context/chat-controls-context';
import { useChatInput } from '@/features/chat/hooks/use-chat-input';
import { cn } from '@/lib/utils';

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
  const { input, setInput, textareaRef, handleSend, onKeyDown, resizeTextareaElement } =
    useChatInput(onSend);

  return (
    <div className={cn('mx-auto w-full max-w-3xl', className)}>
      <div className="mx-auto rounded-[28px] bg-sidebar-bg px-4 pt-4 pb-3 shadow-xs">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            resizeTextareaElement(event.currentTarget);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          rows={1}
          className="min-h-9 w-full resize-none border-none bg-transparent px-2 py-2 text-[15px] leading-relaxed text-text-primary outline-none placeholder-text-secondary focus:outline-none focus:ring-0"
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

/** Copilot の入力スロット用（モデル・ツール選択をコンテキストから注入）。 */
export function ChatInputWithControls(
  props: Omit<ChatInputProps, 'modelSelector' | 'toolSelector'>,
) {
  const { controls, setControls } = useChatControls();

  return (
    <ChatInput
      {...props}
      toolSelector={
        <ToolSelector
          value={controls.selectedTools}
          onChange={(selectedTools) => setControls((current) => ({ ...current, selectedTools }))}
        />
      }
      modelSelector={
        <ModelSelector
          value={controls.selectedModel}
          onChange={(selectedModel) => setControls((current) => ({ ...current, selectedModel }))}
        />
      }
    />
  );
}
