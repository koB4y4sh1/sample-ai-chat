'use client';

import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { ModelSelector } from '../common/ModelSelector';
import { ToolSelector } from '../common/ToolSelector';
import { ChatInput } from './ChatInput';

interface HomeViewProps {
  onSendMessage: (msg: string) => void;
}

export function HomeView({ onSendMessage }: HomeViewProps) {
  const [selectedModel, setSelectedModel] = useState('zenith');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  return (
    <div className="flex flex-col items-center gap-12 py-10 text-center">
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
        toolSelector={<ToolSelector value={selectedTools} onChange={setSelectedTools} />}
        modelSelector={<ModelSelector value={selectedModel} onChange={setSelectedModel} />}
        className="w-full"
      />
    </div>
  );
}
