import type { Message, UserMessage } from '@copilotkit/react-core/v2';
import { isRecord } from '@/features/chat/lib/message-validation';
import { type ChatControlsState, getModelOption } from '@/lib/chat-controls';

const SESSION_MESSAGES_STORAGE_PREFIX = 'zenith_session_messages:';

export const getSessionMessagesStorageKey = (sessionId: string) =>
  `${SESSION_MESSAGES_STORAGE_PREFIX}${sessionId}`;

export const loadStoredMessages = (sessionId: string): Message[] => {
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

export const saveStoredMessages = (sessionId: string, messages: unknown[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(
    getSessionMessagesStorageKey(sessionId),
    JSON.stringify(removeOrphanToolCallMessages(messages)),
  );
};

export const buildRunState = (controls: ChatControlsState) => ({
  model: getModelOption(controls.selectedModel).model,
  provider: getModelOption(controls.selectedModel).provider,
});

// Removes assistant messages whose tool calls have no corresponding tool result.
export const removeOrphanToolCallMessages = (messages: unknown[]): unknown[] => {
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

export const mergeMessages = (baseMessages: Message[], incomingMessages: Message[]) => {
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

export const getMessageText = (content: unknown): string => {
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

export const replaceMessageText = (content: unknown, text: string): UserMessage['content'] => {
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

export const findPreviousUserMessageIndex = (messages: Message[], fromIndex: number) => {
  for (let index = fromIndex - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === 'user') {
      return index;
    }
  }

  return -1;
};

export const getToolCallName = (toolCall: unknown) => {
  if (!isRecord(toolCall)) {
    return null;
  }

  const fn = toolCall.function;
  if (isRecord(fn) && typeof fn.name === 'string') {
    return fn.name;
  }

  return typeof toolCall.name === 'string' ? toolCall.name : null;
};

export const getToolCallArguments = (toolCall: unknown) => {
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

export const getToolResultContent = (message: unknown) => {
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

export const findToolResultMessage = (messages: unknown[], toolCallId: string) =>
  messages.find(
    (message) => isRecord(message) && message.role === 'tool' && message.toolCallId === toolCallId,
  );

export const truncateToolContent = (content: string) =>
  content.length > 240 ? `${content.slice(0, 240)}...` : content;

export const getLatestAssistantToolCallIds = (messages: unknown[]) => {
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
