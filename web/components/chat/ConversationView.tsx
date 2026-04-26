import {
  type AssistantMessage,
  CopilotChat,
  CopilotChatAssistantMessage,
  type CopilotChatAssistantMessageProps,
  type CopilotChatInputProps,
  CopilotChatUserMessage,
  type CopilotChatUserMessageProps,
  type Message,
  UseAgentUpdate,
  type UserMessage,
  useAgent,
  useCopilotKit,
} from '@copilotkit/react-core/v2';
import { ChevronDown } from 'lucide-react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ChatControlsState } from '../../lib/chat-controls';
import { cn } from '../../lib/utils';
import { ZenithComposer } from './ZenithComposer';

interface ConversationViewProps {
  sessionId: string;
  controls: ChatControlsState;
  onControlsChange: (controls: ChatControlsState) => void;
  onActiveToolCallIdsChange?: (toolCallIds: Set<string>) => void;
}

export interface ConversationViewHandle {
  sendMessage: (content: string) => Promise<void>;
}

type EditingDraft = {
  message: UserMessage;
  text: string;
};

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getMessageText = (content: unknown): string => {
  if (typeof content === 'string') {
    return content;
  }

  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .flatMap((part) =>
      isRecord(part) && part.type === 'text' && typeof part.text === 'string' ? [part.text] : [],
    )
    .join('\n');
};

const replaceMessageText = (content: unknown, text: string): UserMessage['content'] => {
  if (!Array.isArray(content)) {
    return text;
  }

  let didReplaceText = false;
  const nextParts = content.map((part) => {
    if (!isRecord(part) || part.type !== 'text') {
      return part;
    }

    if (didReplaceText) {
      return { ...part, text: '' };
    }

    didReplaceText = true;
    return { ...part, text };
  });

  if (didReplaceText) {
    return nextParts as UserMessage['content'];
  }

  return [{ type: 'text', text }, ...nextParts] as UserMessage['content'];
};

const findPreviousUserMessageIndex = (messages: Message[], fromIndex: number) => {
  for (let index = fromIndex - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === 'user') {
      return index;
    }
  }

  return -1;
};

function ZenithScrollToBottomButton({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        className,
        'pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-border bg-sidebar-bg text-text-primary shadow-lg transition-colors hover:bg-bg',
      )}
      aria-label="Scroll to bottom"
    >
      <ChevronDown className="h-4 w-4" />
    </button>
  );
}

const getLatestAssistantToolCallIds = (messages: unknown[]) => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!isRecord(message)) {
      continue;
    }

    if (message.role === 'user') {
      return new Set<string>();
    }

    if (message.role !== 'assistant') {
      continue;
    }

    const toolCalls = Array.isArray(message.toolCalls) ? message.toolCalls : [];
    return new Set(
      toolCalls.flatMap((toolCall) =>
        isRecord(toolCall) && typeof toolCall.id === 'string' ? [toolCall.id] : [],
      ),
    );
  }

  return new Set<string>();
};

export const ConversationView = forwardRef<ConversationViewHandle, ConversationViewProps>(
  function ConversationView(
    { sessionId, controls, onControlsChange, onActiveToolCallIdsChange }: ConversationViewProps,
    ref,
  ) {
    const { agent } = useAgent({
      agentId: 'zenith',
      threadId: sessionId,
      updates: [UseAgentUpdate.OnMessagesChanged, UseAgentUpdate.OnRunStatusChanged],
    });
    const { copilotkit } = useCopilotKit();
    const skipNextPersistRef = useRef(false);
    const restoredSessionIdRef = useRef<string | null>(null);
    const agentMessagesRef = useRef(agent.messages);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const shouldStickToBottomRef = useRef(true);
    const [editingDraft, setEditingDraft] = useState<EditingDraft | null>(null);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    agentMessagesRef.current = agent.messages;

    const updateScrollButton = useCallback(() => {
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) {
        return;
      }

      const distanceFromBottom =
        scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight;
      const isAtBottom = distanceFromBottom < 24;
      shouldStickToBottomRef.current = isAtBottom;
      setShowScrollToBottom(!isAtBottom);
    }, []);

    const scrollToConversationBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) {
        return;
      }

      if (typeof scrollContainer.scrollTo === 'function') {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior,
        });
        return;
      }

      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }, []);

    useEffect(() => {
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) {
        return;
      }

      updateScrollButton();
      scrollContainer.addEventListener('scroll', updateScrollButton, { passive: true });

      const handleResize = () => {
        if (shouldStickToBottomRef.current) {
          scrollToConversationBottom('auto');
        }
        updateScrollButton();
      };

      if (typeof ResizeObserver === 'undefined') {
        window.addEventListener('resize', handleResize);

        return () => {
          scrollContainer.removeEventListener('scroll', updateScrollButton);
          window.removeEventListener('resize', handleResize);
        };
      }

      const observer = new ResizeObserver(handleResize);
      observer.observe(scrollContainer);

      return () => {
        scrollContainer.removeEventListener('scroll', updateScrollButton);
        observer.disconnect();
      };
    }, [scrollToConversationBottom, updateScrollButton]);

    useEffect(() => {
      void agent.messages;
      if (!shouldStickToBottomRef.current) {
        updateScrollButton();
        return;
      }

      requestAnimationFrame(() => {
        scrollToConversationBottom('auto');
        updateScrollButton();
      });
    }, [agent.messages, scrollToConversationBottom, updateScrollButton]);

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

    useEffect(() => {
      onActiveToolCallIdsChange?.(getLatestAssistantToolCallIds(agent.messages));
    }, [agent.messages, onActiveToolCallIdsChange]);

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

    const rerunFromMessages = useCallback(
      async (messages: Message[]) => {
        agent.setMessages(messages);
        await copilotkit.runAgent({ agent });
      },
      [agent, copilotkit],
    );

    const openEditUserMessage = useCallback((message: UserMessage) => {
      setEditingDraft({
        message,
        text: getMessageText(message.content),
      });
    }, []);

    const submitEditedUserMessage = useCallback(async () => {
      if (!editingDraft) {
        return;
      }

      const nextText = editingDraft.text.trim();
      if (!nextText) {
        return;
      }

      const messages = agentMessagesRef.current;
      const messageIndex = messages.findIndex((item) => item.id === editingDraft.message.id);
      if (messageIndex < 0) {
        setEditingDraft(null);
        return;
      }

      const updatedMessage: UserMessage = {
        ...editingDraft.message,
        content: replaceMessageText(editingDraft.message.content, nextText),
      };
      const nextMessages = [...(messages.slice(0, messageIndex) as Message[]), updatedMessage];
      setEditingDraft(null);
      await rerunFromMessages(nextMessages);
    }, [editingDraft, rerunFromMessages]);

    const editUserMessage = useCallback(
      async (message: UserMessage) => {
        const messageIndex = agentMessagesRef.current.findIndex((item) => item.id === message.id);
        if (messageIndex < 0) {
          return;
        }

        openEditUserMessage(message);
      },
      [openEditUserMessage],
    );

    const regenerateAssistantMessage = useCallback(
      async (message: AssistantMessage) => {
        const messages = agentMessagesRef.current as Message[];
        const messageIndex = messages.findIndex((item) => item.id === message.id);
        if (messageIndex < 0) {
          return;
        }

        const userMessageIndex = findPreviousUserMessageIndex(messages, messageIndex);
        if (userMessageIndex < 0) {
          return;
        }

        await rerunFromMessages(messages.slice(0, userMessageIndex + 1));
      },
      [rerunFromMessages],
    );

    const handleRef = useRef<ConversationViewHandle>({
      sendMessage: async () => {},
    });
    handleRef.current.sendMessage = sendMessage;

    useImperativeHandle(ref, () => handleRef.current, []);

    const inputSlot = useMemo(
      () =>
        Object.assign(function ZenithChatInput(props: CopilotChatInputProps) {
          return (
            <ZenithComposer
              {...props}
              placeholder="Type a message..."
              selectedModel={controls.selectedModel}
              setSelectedModel={(selectedModel) => onControlsChange({ ...controls, selectedModel })}
              selectedTools={controls.selectedTools}
              setSelectedTools={(selectedTools) => onControlsChange({ ...controls, selectedTools })}
              sticky
            />
          );
        }, ZenithComposer),
      [controls, onControlsChange],
    );

    const assistantMessageSlot = useMemo(
      () =>
        Object.assign(function ZenithAssistantMessage(props: CopilotChatAssistantMessageProps) {
          return (
            <CopilotChatAssistantMessage {...props} onRegenerate={regenerateAssistantMessage} />
          );
        }, CopilotChatAssistantMessage),
      [regenerateAssistantMessage],
    );

    const userMessageSlot = useMemo(
      () =>
        Object.assign(function ZenithUserMessage(props: CopilotChatUserMessageProps) {
          return (
            <CopilotChatUserMessage
              {...props}
              onEditMessage={({ message }) => void editUserMessage(message)}
            />
          );
        }, CopilotChatUserMessage),
      [editUserMessage],
    );

    return (
      <div className="zenith-conversation-shell relative flex h-full min-h-0 flex-1">
        <div ref={scrollContainerRef} className="h-full min-h-0 flex-1 overflow-y-auto">
          <CopilotChat
            agentId="zenith"
            threadId={sessionId}
            className="zenith-copilot-chat flex min-h-full flex-col"
            welcomeScreen={false}
            autoScroll="none"
            suggestionView="flex flex-wrap gap-2"
            scrollView={{
              className:
                '!h-auto !max-h-none !min-h-0 !flex-none !overflow-visible px-4 pt-6 pb-2 sm:px-6 lg:px-8',
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
              modalHeaderTitle: 'Zenith Agent',
            }}
          />
        </div>
        {showScrollToBottom ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-[calc(var(--zenith-composer-height,7.25rem)+1rem)] z-30 flex justify-center">
            <ZenithScrollToBottomButton onClick={() => scrollToConversationBottom()} />
          </div>
        ) : null}
        {editingDraft ? (
          <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/20 px-4 py-6 backdrop-blur-[1px] sm:items-center">
            <div className="w-full max-w-2xl rounded-2xl border border-border bg-sidebar-bg p-4 shadow-2xl">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-text-primary">Edit message</h3>
                <p className="mt-1 text-xs text-text-secondary">
                  Saving will remove later assistant output and rerun the agent from this message.
                </p>
              </div>
              <textarea
                value={editingDraft.text}
                onChange={(event) =>
                  setEditingDraft((current) =>
                    current ? { ...current, text: event.target.value } : current,
                  )
                }
                rows={8}
                className="min-h-40 w-full resize-y rounded-xl border border-border bg-bg px-3 py-2 text-sm leading-relaxed text-text-primary outline-none focus:border-text-secondary/50"
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDraft(null)}
                  className="rounded-lg border border-border px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void submitEditedUserMessage()}
                  disabled={!editingDraft.text.trim()}
                  className="rounded-lg bg-accent-gradient px-3 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
                >
                  Save and regenerate
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  },
);
