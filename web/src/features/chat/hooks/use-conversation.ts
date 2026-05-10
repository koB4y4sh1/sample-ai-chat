'use client';

import type { AssistantMessage } from '@copilotkit/react-core/v2';
import {
  type Message,
  UseAgentUpdate,
  type UserMessage,
  useAgent,
  useCopilotKit,
} from '@copilotkit/react-core/v2';
import type { RefObject } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMessageEditingDraft } from '@/features/chat/hooks/use-message-editing';
import {
  buildRunState,
  findPreviousUserMessageIndex,
  getLatestAssistantToolCallIds,
  loadStoredMessages,
  mergeMessages,
  removeOrphanToolCallMessages,
  replaceMessageText,
  saveStoredMessages,
} from '@/features/chat/lib/build-message';
import type { ChatControlsState, ChatModelId } from '@/lib/chat-controls';
import { getModelOption } from '@/lib/chat-controls';

export type { EditingDraft } from '@/features/chat/types/message';

export interface UseConversationArgs {
  sessionId: string;
  selectedModel: ChatModelId;
  controlsRef: RefObject<ChatControlsState>;
  onActiveToolCallIdsChange?: (toolCallIds: Set<string>) => void;
}

export function useConversation({
  sessionId,
  selectedModel: selectedModelId,
  controlsRef,
  onActiveToolCallIdsChange,
}: UseConversationArgs) {
  const selectedModel = getModelOption(selectedModelId);
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
  const { editingDraft, setEditingDraft, openEditUserMessage } = useMessageEditingDraft();
  const [guaranteedMessages, setGuaranteedMessages] = useState<Message[]>([]);
  const mergedMessages = useMemo(
    () => mergeMessages(guaranteedMessages, agent.messages),
    [guaranteedMessages, agent.messages],
  );
  agentMessagesRef.current = mergedMessages;

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
  }, [editingDraft, rerunFromMessages, setEditingDraft]);

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

  return {
    agent,
    agentId,
    agentMessagesRef,
    mergedMessages,
    editingDraft,
    setEditingDraft,
    sendMessage,
    submitEditedUserMessage,
    regenerateAssistantMessage,
    editUserMessage,
  };
}
