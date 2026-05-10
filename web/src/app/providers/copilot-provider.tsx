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
import { useA2UIProgress } from '@/features/chat/generative-ui/a2ui/progressive';
import { a2uiCatalog } from '@/features/chat/generative-ui/a2ui/renderers';
import { DisplayComponent } from '@/features/chat/generative-ui/component';
import { FrontendTool } from '@/features/chat/generative-ui/frontend-tool';
import { HumanInTheLoop } from '@/features/chat/generative-ui/hitl/human-in-the-loop';
import { ToolRender } from '@/features/chat/generative-ui/tool-render';
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

  useA2UIProgress(); // A2UI の進行状況を表示するカスタムフック

  return null;
}

type CopilotProviderProps = {
  children: ReactNode;
  chatControls: ChatControlsState;
  updateChatControls: (
    next: ChatControlsState | ((current: ChatControlsState) => ChatControlsState),
  ) => void;
  chatContextValue: ChatContextValue;
};

export function CopilotProvider({
  children,
  chatControls,
  updateChatControls,
  chatContextValue,
}: CopilotProviderProps) {
  return (
    <CopilotKitProvider
      runtimeUrl="/api/copilotkit"
      headers={{
        'x-zenith-provider': getModelOption(chatControls.selectedModel).provider,
      }}
      useSingleEndpoint={true}
      showDevConsole={true}
      a2ui={{ catalog: a2uiCatalog }}
    >
      <ChatControlsProvider value={{ controls: chatControls, setControls: updateChatControls }}>
        <ChatProvider value={chatContextValue}>
          <ChatControlsBridge controls={chatControls} />
          <FrontendTool />
          <HumanInTheLoop />
          <DisplayComponent />
          <ToolRender />
          {children}
        </ChatProvider>
      </ChatControlsProvider>
    </CopilotKitProvider>
  );
}
