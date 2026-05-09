'use client';

import { HttpAgent } from '@ag-ui/client';
import {
  CopilotChat,
  CopilotChatAssistantMessage,
  type CopilotChatAssistantMessageProps,
  CopilotChatInput,
  type CopilotChatInputProps,
  CopilotChatUserMessage,
  type CopilotChatUserMessageProps,
} from '@copilotkit/react-core/v2';
import { forwardRef, memo, type RefObject, useEffect, useImperativeHandle, useMemo } from 'react';
import { ChatInputWithControls } from '@/features/chat/components/chat-input';
import { EditMessageForm } from '@/features/chat/components/edit-message-form';
import { MessageItemToolStatus } from '@/features/chat/components/message-item';
import { useChatControls } from '@/features/chat/context/chat-controls-context';
import { useConversation } from '@/features/chat/hooks/use-conversation';
import { buildRunState } from '@/features/chat/lib/build-message';
import type { ConversationViewHandle } from '@/features/chat/types/message';
import type { ChatControlsState } from '@/lib/chat-controls';
import { resolveAgentUrl } from '@/lib/copilotkit/agents';

export type { ConversationViewHandle } from '@/features/chat/types/message';

interface ConversationViewProps {
  sessionId: string;
  controlsRef: RefObject<ChatControlsState>;
  onActiveToolCallIdsChange?: (toolCallIds: Set<string>) => void;
}

function ChatInputSlot(props: CopilotChatInputProps) {
  return (
    <div className="pointer-events-none px-4 pb-5 pt-3 sm:px-6">
      <ChatInputWithControls
        className="pointer-events-auto"
        onSend={(message) => props.onSubmitMessage?.(message)}
        placeholder="Type a message..."
      />
    </div>
  );
}

function AgentStateSync({
  agent,
}: {
  agent: { setState: (state: ReturnType<typeof buildRunState>) => void };
}) {
  const { controls } = useChatControls();

  useEffect(() => {
    agent.setState(buildRunState(controls));
  }, [agent, controls]);

  return null;
}

function AgentEndpointSync({ agent }: { agent: unknown }) {
  const { controls } = useChatControls();

  useEffect(() => {
    if (agent instanceof HttpAgent) {
      agent.url = resolveAgentUrl(controls);
    }
  }, [agent, controls]);

  return null;
}

const ConversationViewBase = forwardRef<ConversationViewHandle, ConversationViewProps>(
  function ConversationView(
    { sessionId, controlsRef, onActiveToolCallIdsChange }: ConversationViewProps,
    ref,
  ) {
    const {
      agent,
      agentId,
      mergedMessages,
      editingDraft,
      setEditingDraft,
      sendMessage,
      submitEditedUserMessage,
      regenerateAssistantMessage,
      editUserMessage,
    } = useConversation({ sessionId, controlsRef, onActiveToolCallIdsChange });

    useImperativeHandle(ref, () => ({ sendMessage }), [sendMessage]);

    const assistantMessageSlot = useMemo(
      () =>
        ((props: CopilotChatAssistantMessageProps) => {
          return (
            <>
              <CopilotChatAssistantMessage {...props} onRegenerate={regenerateAssistantMessage} />
              <MessageItemToolStatus
                message={props.message}
                messages={mergedMessages}
                isRunning={agent.isRunning}
              />
            </>
          );
        }) as typeof CopilotChatAssistantMessage,
      [agent.isRunning, mergedMessages, regenerateAssistantMessage],
    );

    const userMessageSlot = useMemo(
      () =>
        ((props: CopilotChatUserMessageProps) => {
          return (
            <CopilotChatUserMessage
              {...props}
              onEditMessage={({ message }) => void editUserMessage(message)}
            />
          );
        }) as typeof CopilotChatUserMessage,
      [editUserMessage],
    );

    const inputSlot = useMemo(
      () =>
        Object.assign(
          (props: CopilotChatInputProps) => <ChatInputSlot {...props} />,
          CopilotChatInput,
        ),
      [],
    );

    return (
      <div className="zenith-conversation-shell relative flex h-full min-h-0 flex-1">
        <AgentStateSync agent={agent} />
        <AgentEndpointSync agent={agent} />
        <div className="h-full min-h-0 flex-1 overflow-y-auto">
          <CopilotChat
            agentId={agentId}
            threadId={sessionId}
            className="zenith-copilot-chat flex min-h-full flex-col"
            welcomeScreen={false}
            autoScroll="pin-to-send"
            suggestionView="flex flex-wrap gap-2"
            scrollView={{
              className: 'px-4 pt-6 sm:px-6 lg:px-8',
              feather: 'hidden',
            }}
            input={inputSlot}
            messageView={{
              className: 'zenith-copilot-messages',
              assistantMessage: assistantMessageSlot,
              userMessage: userMessageSlot,
            }}
            attachments={{
              enabled: true,
              accept: 'image/*,.txt,.md,.mdx,.json,.csv,.ts,.tsx,.js,.jsx,.py,.html,.css,.log,.pdf',
              maxSize: 15 * 1024 * 1024,
            }}
            labels={{
              chatInputPlaceholder: 'Type a message...',
              chatInputToolbarAddButtonLabel: 'Add file or image',
              chatDisclaimerText: '',
              modalHeaderTitle: 'Assistant',
            }}
          />
        </div>
        {editingDraft ? (
          <EditMessageForm
            draft={editingDraft}
            setDraft={setEditingDraft}
            onCancel={() => setEditingDraft(null)}
            onSubmit={submitEditedUserMessage}
          />
        ) : null}
      </div>
    );
  },
);

export const ConversationView = memo(ConversationViewBase);
