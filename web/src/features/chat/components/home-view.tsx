'use client';

import { Sparkles } from 'lucide-react';
import { ModelSelector } from '@/components/common/ModelSelector';
import { ToolSelector } from '@/components/common/ToolSelector';
import { ChatInput } from '@/features/chat/components/chat-input';
import { type ChatControlsState, HOME_PROMPT_SUGGESTIONS } from '@/lib/chat-controls';

interface HomeViewProps {
  onSendMessage: (msg: string) => void;
  controls: ChatControlsState;
  onControlsChange: (controls: ChatControlsState) => void;
}

export function HomeView({ onSendMessage, controls, onControlsChange }: HomeViewProps) {
  return (
    <div className="flex h-[min(760px,calc(100vh-6rem))] flex-col items-center gap-8 overflow-y-auto py-10 text-center">
      <div className="flex flex-col items-center gap-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-gradient shadow-lg">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">How can I help?</h1>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-text-secondary">
            Zenith AI helps you move work and thinking forward.
          </p>
        </div>
      </div>

      <ChatInput
        onSend={(message) => onSendMessage(message.trim())}
        placeholder="Ask anything..."
        toolSelector={
          <ToolSelector
            value={controls.selectedTools}
            onChange={(selectedTools) => onControlsChange({ ...controls, selectedTools })}
          />
        }
        modelSelector={
          <ModelSelector
            value={controls.selectedModel}
            onChange={(selectedModel) => onControlsChange({ ...controls, selectedModel })}
          />
        }
        className="w-full"
      />

      <div className="grid w-full max-w-3xl grid-cols-1 gap-3 text-left sm:grid-cols-2">
        {HOME_PROMPT_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion.title}
            type="button"
            onClick={() => onSendMessage(suggestion.message)}
            className="rounded-xl border border-border bg-sidebar-bg p-4 text-left transition-colors hover:border-text-secondary/40 hover:bg-bg focus:outline-none focus:ring-2 focus:ring-text-secondary/20"
          >
            <span className="block text-sm font-semibold text-text-primary">
              {suggestion.title}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-text-secondary">
              {suggestion.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
