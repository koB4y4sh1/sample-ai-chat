import { CopilotChat, UseAgentUpdate, useAgent, useCopilotKit } from '@copilotkit/react-core/v2';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';

interface ConversationViewProps {
  sessionId: string;
}

export interface ConversationViewHandle {
  sendMessage: (content: string) => Promise<void>;
}

const SESSION_MESSAGES_STORAGE_PREFIX = 'zenith_session_messages:';

const getSessionMessagesStorageKey = (sessionId: string) =>
  `${SESSION_MESSAGES_STORAGE_PREFIX}${sessionId}`;

const loadStoredMessages = (sessionId: string) => {
  if (typeof window === 'undefined') {
    return [];
  }

  const saved = localStorage.getItem(getSessionMessagesStorageKey(sessionId));
  if (!saved) {
    return [];
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveStoredMessages = (sessionId: string, messages: unknown[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(getSessionMessagesStorageKey(sessionId), JSON.stringify(messages));
};

export const ConversationView = forwardRef<ConversationViewHandle, ConversationViewProps>(
  function ConversationView({ sessionId }: ConversationViewProps, ref) {
    const { agent } = useAgent({
      agentId: 'zenith',
      threadId: sessionId,
      updates: [UseAgentUpdate.OnMessagesChanged, UseAgentUpdate.OnRunStatusChanged],
    });
    const { copilotkit } = useCopilotKit();
    const skipNextPersistRef = useRef(false);
    const restoredSessionIdRef = useRef<string | null>(null);

    useEffect(() => {
      restoredSessionIdRef.current = sessionId;

      const storedMessages = loadStoredMessages(sessionId);
      if (storedMessages.length > 0 && agent.messages.length === 0) {
        skipNextPersistRef.current = true;
        agent.setMessages(storedMessages);
      }
    }, [agent, sessionId]);

    useEffect(() => {
      if (restoredSessionIdRef.current !== sessionId) {
        return;
      }

      if (skipNextPersistRef.current) {
        skipNextPersistRef.current = false;
        return;
      }

      saveStoredMessages(sessionId, agent.messages);
    }, [agent.messages, sessionId]);

    const sendMessage = useCallback(
      async (content: string) => {
        agent.addMessage({
          id: globalThis.crypto?.randomUUID?.() ?? Date.now().toString(),
          role: 'user',
          content,
        });

        await copilotkit.runAgent({ agent });
      },
      [agent, copilotkit],
    );

    const handleRef = useRef<ConversationViewHandle>({
      sendMessage: async () => {},
    });
    handleRef.current.sendMessage = sendMessage;

    useImperativeHandle(ref, () => handleRef.current, []);

    return (
      <div className="flex h-full min-h-0 flex-1">
        <CopilotChat
          agentId="zenith"
          threadId={sessionId}
          className="zenith-copilot-chat flex h-full min-h-0 flex-1 flex-col"
          welcomeScreen={false}
          autoScroll="pin-to-bottom"
          suggestionView="hidden"
          scrollView={{
            className: 'min-h-0 flex-1 px-4 py-6 sm:px-6 lg:px-8',
            feather: 'hidden',
          }}
          input="px-4 pb-5 pt-3 sm:px-6"
          messageView="zenith-copilot-messages"
          labels={{
            chatInputPlaceholder: 'Type a message...',
            chatDisclaimerText: '',
            modalHeaderTitle: 'Zenith Agent',
          }}
        />
      </div>
    );
  },
);
