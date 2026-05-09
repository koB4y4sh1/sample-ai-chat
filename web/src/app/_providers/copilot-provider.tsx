'use client';

import {
  CopilotKitProvider,
  useAgentContext,
  useConfigureSuggestions,
} from '@copilotkit/react-core/v2';
import type { ReactNode } from 'react';
import type { ChatContextValue } from '@/features/chat/context/chat-context';
import { ChatProvider } from '@/features/chat/context/chat-context';
import { ChatControlsProvider } from '@/features/chat/context/chat-controls-context';
import { GenerativeUIRegistry } from '@/features/chat/generative-ui/components/GenerativeUIRegistry';
import { GenerativeUIInteractionProvider } from '@/features/chat/generative-ui/context/generative-ui-interaction-context';
import {
  buildChatControlContext,
  buildToolAwareSuggestions,
  type ChatControlsState,
  getModelOption,
} from '@/lib/chat-controls';

function ChatControlsBridge({ controls }: { controls: ChatControlsState }) {
  useAgentContext({
    description: 'Current chat controls selected by the user',
    value: buildChatControlContext(controls),
  });

  useConfigureSuggestions(
    {
      consumerAgentId: 'zenith',
      available: 'after-first-message',
      suggestions: buildToolAwareSuggestions(controls.selectedTools).map((suggestion) => ({
        title: suggestion.title,
        message: suggestion.message,
      })),
    },
    [controls.selectedTools.join(',')],
  );

  return null;
}

type CopilotProviderProps = {
  children: ReactNode;
  chatControls: ChatControlsState;
  updateChatControls: (
    next: ChatControlsState | ((current: ChatControlsState) => ChatControlsState),
  ) => void;
  chatContextValue: ChatContextValue;
  activeToolCallIds: Set<string>;
  submitGenerativeUIInteraction: (content: string) => Promise<void> | void;
};

export function CopilotProvider({
  children,
  chatControls,
  updateChatControls,
  chatContextValue,
  activeToolCallIds,
  submitGenerativeUIInteraction,
}: CopilotProviderProps) {
  return (
    <CopilotKitProvider
      runtimeUrl="/api/copilotkit"
      headers={{
        'x-zenith-provider': getModelOption(chatControls.selectedModel).provider,
      }}
      useSingleEndpoint
      showDevConsole={false}
    >
      <ChatControlsProvider value={{ controls: chatControls, setControls: updateChatControls }}>
        <ChatProvider value={chatContextValue}>
          <ChatControlsBridge controls={chatControls} />
          <GenerativeUIInteractionProvider
            onSubmit={submitGenerativeUIInteraction}
            activeToolCallIds={activeToolCallIds}
          >
            <GenerativeUIRegistry agentId="zenith" />
            {children}
          </GenerativeUIInteractionProvider>
        </ChatProvider>
      </ChatControlsProvider>
    </CopilotKitProvider>
  );
}
