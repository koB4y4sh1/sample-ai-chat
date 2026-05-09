import { HttpAgent } from '@ag-ui/client';
import {
  type AssistantMessage,
  CopilotChat,
  CopilotChatAssistantMessage,
  type CopilotChatAssistantMessageProps,
  CopilotChatInput,
  type CopilotChatInputProps,
  CopilotChatUserMessage,
  type CopilotChatUserMessageProps,
  type Message,
  UseAgentUpdate,
  type UserMessage,
  useAgent,
  useCopilotKit,
} from '@copilotkit/react-core/v2';
import { CheckCircle2, Loader2, Wrench, XCircle } from 'lucide-react';
import {
  forwardRef,
  memo,
  type RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { type ChatControlsState, getModelOption } from '../../lib/chat-controls';
import { resolveAgentUrl } from '../../lib/copilotkit/agents';
import { cn } from '../../lib/utils';
import { ModelSelector } from '../common/ModelSelector';
import { ToolSelector } from '../common/ToolSelector';
import { useChatControls } from './ChatControlsContext';
import { ChatInput } from './ChatInput';

interface ConversationViewProps {
  sessionId: string;
  controlsRef: RefObject<ChatControlsState>;
  onActiveToolCallIdsChange?: (toolCallIds: Set<string>) => void;
}

export interface ConversationViewHandle {
  sendMessage: (content: string, options?: { messageId?: string }) => Promise<void>;
}

type EditingDraft = {
  message: UserMessage;
  text: string;
};

const SESSION_MESSAGES_STORAGE_PREFIX = 'zenith_session_messages:';

const getSessionMessagesStorageKey = (sessionId: string) =>
  `${SESSION_MESSAGES_STORAGE_PREFIX}${sessionId}`;

const loadStoredMessages = (sessionId: string): Message[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const saved = localStorage.getItem(getSessionMessagesStorageKey(sessionId));
  if (!saved) {
    return [];
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? (removeOrphanToolCallMessages(parsed) as Message[]) : [];
  } catch {
    return [];
  }
};

const saveStoredMessages = (sessionId: string, messages: unknown[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(
    getSessionMessagesStorageKey(sessionId),
    JSON.stringify(removeOrphanToolCallMessages(messages)),
  );
};

const buildRunState = (controls: ChatControlsState) => ({
  model: getModelOption(controls.selectedModel).model,
  provider: getModelOption(controls.selectedModel).provider,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

// Removes assistant messages whose tool calls have no corresponding tool result.
// Such orphan messages occur when a run errors before producing tool results.
// Restoring them causes CopilotKit to attempt automatic continuation, triggering
// a second RUN_ERROR event that the AG-UI client rejects as "already errored".
const removeOrphanToolCallMessages = (messages: unknown[]): unknown[] => {
  const toolResultIds = new Set<string>();
  const assistantToolCallIds = new Set<string>();
  for (const msg of messages) {
    if (isRecord(msg) && msg.role === 'tool' && typeof msg.toolCallId === 'string') {
      toolResultIds.add(msg.toolCallId);
    }
    if (isRecord(msg) && msg.role === 'assistant' && Array.isArray(msg.toolCalls)) {
      for (const toolCall of msg.toolCalls) {
        if (isRecord(toolCall) && typeof toolCall.id === 'string') {
          assistantToolCallIds.add(toolCall.id);
        }
      }
    }
  }
  return messages.filter((msg) => {
    if (!isRecord(msg)) return false;
    if (msg.role === 'tool') {
      return typeof msg.toolCallId === 'string' && assistantToolCallIds.has(msg.toolCallId);
    }
    if (msg.role !== 'assistant') return true;
    const toolCalls = Array.isArray(msg.toolCalls) ? msg.toolCalls : [];
    if (toolCalls.length === 0) return true;
    return toolCalls.some(
      (tc) => isRecord(tc) && typeof tc.id === 'string' && toolResultIds.has(tc.id),
    );
  });
};

const mergeMessages = (baseMessages: Message[], incomingMessages: Message[]) => {
  const merged = [...baseMessages];
  const indexesById = new Map(merged.map((message, index) => [message.id, index]));

  for (const message of incomingMessages) {
    const existingIndex = indexesById.get(message.id);
    if (existingIndex === undefined) {
      indexesById.set(message.id, merged.length);
      merged.push(message);
      continue;
    }

    merged[existingIndex] = message;
  }

  return merged;
};

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

const getToolCallName = (toolCall: unknown) => {
  if (!isRecord(toolCall)) {
    return null;
  }

  const fn = toolCall.function;
  if (isRecord(fn) && typeof fn.name === 'string') {
    return fn.name;
  }

  return typeof toolCall.name === 'string' ? toolCall.name : null;
};

const getToolCallArguments = (toolCall: unknown) => {
  if (!isRecord(toolCall)) {
    return null;
  }

  const fn = toolCall.function;
  const args = isRecord(fn) ? fn.arguments : toolCall.arguments;

  if (typeof args === 'string') {
    return args;
  }

  if (args === undefined || args === null) {
    return null;
  }

  try {
    return JSON.stringify(args, null, 2);
  } catch {
    return String(args);
  }
};

const getToolResultContent = (message: unknown) => {
  if (!isRecord(message)) {
    return null;
  }

  const { content } = message;
  if (typeof content === 'string') {
    return content;
  }

  if (content === undefined || content === null) {
    return null;
  }

  try {
    return JSON.stringify(content, null, 2);
  } catch {
    return String(content);
  }
};

const parseJsonRecord = (value: string) => {
  try {
    const parsed = JSON.parse(value);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const isErrorStatus = (value: unknown) =>
  typeof value === 'string' && ['error', 'failed', 'failure'].includes(value.toLowerCase());

const isToolResultError = (message: unknown) => {
  if (!isRecord(message)) {
    return false;
  }

  if (isErrorStatus(message.status) || message.error === true || message.isError === true) {
    return true;
  }

  if (typeof message.errorText === 'string' && message.errorText.trim()) {
    return true;
  }

  if (typeof message.content !== 'string') {
    return false;
  }

  const parsedContent = parseJsonRecord(message.content);
  return Boolean(
    parsedContent &&
      (isErrorStatus(parsedContent.status) ||
        parsedContent.error === true ||
        parsedContent.isError === true ||
        (typeof parsedContent.errorText === 'string' && parsedContent.errorText.trim())),
  );
};

const findToolResultMessage = (messages: unknown[], toolCallId: string) =>
  messages.find(
    (message) => isRecord(message) && message.role === 'tool' && message.toolCallId === toolCallId,
  );

const truncateToolContent = (content: string) =>
  content.length > 240 ? `${content.slice(0, 240)}...` : content;

function McpToolStatusList({
  message,
  messages,
  isRunning,
}: {
  message: AssistantMessage;
  messages: Message[];
  isRunning: boolean;
}) {
  const toolCalls = Array.isArray(message.toolCalls) ? message.toolCalls : [];

  if (toolCalls.length === 0) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Tool execution status"
      data-testid="mcp-tool-status-list"
      className="mt-2 flex flex-col gap-2"
    >
      {toolCalls.map((toolCall) => {
        if (!isRecord(toolCall) || typeof toolCall.id !== 'string') {
          return null;
        }

        const toolName = getToolCallName(toolCall) ?? 'tool';
        const resultMessage = findToolResultMessage(messages, toolCall.id);
        const resultContent = resultMessage ? getToolResultContent(resultMessage) : null;
        const status = resultMessage
          ? isToolResultError(resultMessage)
            ? 'Error'
            : 'Success'
          : isRunning
            ? 'Running'
            : 'Pending';
        const argumentsText = getToolCallArguments(toolCall);

        return (
          <details
            key={toolCall.id}
            data-testid="mcp-tool-status"
            className="group rounded-lg border border-border/60 bg-sidebar-bg/70 text-xs text-text-secondary shadow-sm"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 marker:hidden">
              <span className="flex min-w-0 items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-bg">
                  {status === 'Running' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-primary" />
                  ) : status === 'Success' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : status === 'Error' ? (
                    <XCircle className="h-3.5 w-3.5 text-red-500" />
                  ) : (
                    <Wrench className="h-3.5 w-3.5 text-text-secondary" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium text-text-primary">{toolName}</span>
                  <span className="text-text-secondary/70">Tool execution</span>
                </span>
              </span>
              <span
                className={cn(
                  'shrink-0 rounded-full border px-2 py-0.5 font-medium',
                  status === 'Success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                    : status === 'Error'
                      ? 'border-red-500/30 bg-red-500/10 text-red-600'
                      : status === 'Running'
                        ? 'border-accent-primary/30 bg-accent-primary/10 text-accent-primary'
                        : 'border-border bg-bg text-text-secondary',
                )}
              >
                {status}
              </span>
            </summary>
            <div className="border-t border-border/60 px-3 py-2">
              {argumentsText ? (
                <div>
                  <p className="mb-1 font-medium text-text-secondary/80">Parameters</p>
                  <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-bg px-2 py-1.5 font-mono text-[11px] leading-relaxed text-text-secondary">
                    {argumentsText}
                  </pre>
                </div>
              ) : null}
              {resultContent ? (
                <div className={argumentsText ? 'mt-2' : undefined}>
                  <p className="mb-1 font-medium text-text-secondary/80">
                    {status === 'Error' ? 'Error' : 'Result'}
                  </p>
                  <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-bg px-2 py-1.5 font-mono text-[11px] leading-relaxed text-text-secondary">
                    {truncateToolContent(resultContent)}
                  </pre>
                </div>
              ) : null}
            </div>
          </details>
        );
      })}
    </div>
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

function ZenithChatInputSlot(props: CopilotChatInputProps) {
  const { controls, setControls } = useChatControls();

  return (
    <div className="px-4 pb-5 pt-3 sm:px-6">
      <ChatInput
        onSend={(message) => props.onSubmitMessage?.(message)}
        placeholder="Type a message..."
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
    const selectedModel = getModelOption(controlsRef.current.selectedModel);
    const agentId = selectedModel.agentId;
    const { agent } = useAgent({
      agentId,
      threadId: sessionId,
      updates: [UseAgentUpdate.OnMessagesChanged, UseAgentUpdate.OnRunStatusChanged],
    });
    const { copilotkit } = useCopilotKit();
    const skipNextPersistRef = useRef(false);
    const restoredSessionIdRef = useRef<string | null>(null);
    const agentMessagesRef = useRef(agent.messages);
    const [editingDraft, setEditingDraft] = useState<EditingDraft | null>(null);
    const [guaranteedMessages, setGuaranteedMessages] = useState<Message[]>([]);
    agentMessagesRef.current = mergeMessages(guaranteedMessages, agent.messages);

    useEffect(() => {
      restoredSessionIdRef.current = sessionId;

      const storedMessages = loadStoredMessages(sessionId);
      const cleanedMessages = removeOrphanToolCallMessages(storedMessages) as Message[];
      setGuaranteedMessages(cleanedMessages);
      if (cleanedMessages.length > 0 && agent.messages.length === 0) {
        skipNextPersistRef.current = true;
        agent.setMessages(cleanedMessages);
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

      saveStoredMessages(
        sessionId,
        removeOrphanToolCallMessages(mergeMessages(guaranteedMessages, agent.messages)),
      );
    }, [agent.messages, guaranteedMessages, sessionId]);

    useEffect(() => {
      onActiveToolCallIdsChange?.(getLatestAssistantToolCallIds(agent.messages));
    }, [agent.messages, onActiveToolCallIdsChange]);

    const sendMessage = useCallback(
      async (content: string, options?: { messageId?: string }) => {
        const message = {
          id: options?.messageId ?? globalThis.crypto?.randomUUID?.() ?? Date.now().toString(),
          role: 'user',
          content,
        } as UserMessage;
        const currentMessages = agentMessagesRef.current as Message[];
        const hasMessage = currentMessages.some((item) => item.id === message.id);
        const nextMessages = hasMessage ? currentMessages : [...currentMessages, message];

        agentMessagesRef.current = nextMessages;
        setGuaranteedMessages(nextMessages);
        if (hasMessage) {
          agent.setMessages(nextMessages);
        } else {
          agent.addMessage(message);
        }
        agent.setState(buildRunState(controlsRef.current));
        await copilotkit.runAgent({ agent });
      },
      [agent, controlsRef, copilotkit],
    );

    const rerunFromMessages = useCallback(
      async (messages: Message[]) => {
        setGuaranteedMessages(messages);
        agent.setMessages(messages);
        agent.setState(buildRunState(controlsRef.current));
        await copilotkit.runAgent({ agent });
      },
      [agent, controlsRef, copilotkit],
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

    const assistantMessageSlot = useMemo(
      () =>
        ((props: CopilotChatAssistantMessageProps) => {
          return (
            <>
              <CopilotChatAssistantMessage {...props} onRegenerate={regenerateAssistantMessage} />
              <McpToolStatusList
                message={props.message}
                messages={agentMessagesRef.current as Message[]}
                isRunning={agent.isRunning}
              />
            </>
          );
        }) as typeof CopilotChatAssistantMessage,
      [agent.isRunning, regenerateAssistantMessage],
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
          (props: CopilotChatInputProps) => <ZenithChatInputSlot {...props} />,
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
            autoScroll
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
              modalHeaderTitle: 'Zenith Agent',
            }}
          />
        </div>
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

export const ConversationView = memo(ConversationViewBase);
