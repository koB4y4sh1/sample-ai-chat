'use client';

import {
  CopilotKitProvider,
  useAgentContext,
  useConfigureSuggestions,
} from '@copilotkit/react-core/v2';
import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildChatControlContext,
  buildToolAwareSuggestions,
  type ChatControlsState,
  DEFAULT_CHAT_CONTROLS,
  getModelOption,
  isChatModelId,
} from '../../lib/chat-controls';
import { syncAgentProvider } from '../../lib/copilotkit/agents';
import { ChatControlsProvider } from './ChatControlsContext';
import { ConversationView, type ConversationViewHandle } from './ConversationView';
import { GenerativeUIInteractionProvider } from './GenerativeUIInteractionContext';
import { GenerativeUIRegistry } from './GenerativeUIRegistry';
import { HomeView } from './HomeView';
import { Sidebar } from './Sidebar';

export type Session = {
  id: string;
  title: string;
};

type PendingInitialMessage = {
  id: string;
  sessionId: string;
  content: string;
  messageId?: string;
};

const SESSIONS_STORAGE_KEY = 'zenith_sessions';
const THEME_STORAGE_KEY = 'theme';
const PENDING_INITIAL_MESSAGE_STORAGE_KEY = 'zenith_pending_initial_message';
const SESSION_MESSAGES_STORAGE_PREFIX = 'zenith_session_messages:';
const CHAT_CONTROLS_STORAGE_KEY = 'zenith_chat_controls';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const createSessionId = () => globalThis.crypto?.randomUUID?.() ?? Date.now().toString();

const buildSessionTitle = (index: number) => `Conversation ${index}`;

const loadStoredSessions = (): Session[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
  if (!saved) {
    return [];
  }

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((value) => {
      if (!isRecord(value)) {
        return [];
      }

      if (typeof value.id !== 'string' || typeof value.title !== 'string') {
        return [];
      }

      return [
        {
          id: value.id,
          title: value.title,
        },
      ];
    });
  } catch {
    return [];
  }
};

const saveStoredSessions = (sessions: Session[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
};

const loadPendingInitialMessage = (): PendingInitialMessage | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const saved = sessionStorage.getItem(PENDING_INITIAL_MESSAGE_STORAGE_KEY);
  if (!saved) {
    return null;
  }

  try {
    const parsed = JSON.parse(saved);
    if (
      !isRecord(parsed) ||
      typeof parsed.id !== 'string' ||
      typeof parsed.sessionId !== 'string' ||
      typeof parsed.content !== 'string' ||
      ('messageId' in parsed && typeof parsed.messageId !== 'string')
    ) {
      return null;
    }

    return parsed as PendingInitialMessage;
  } catch {
    return null;
  }
};

const savePendingInitialMessage = (message: PendingInitialMessage | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (!message) {
    sessionStorage.removeItem(PENDING_INITIAL_MESSAGE_STORAGE_KEY);
    return;
  }

  sessionStorage.setItem(PENDING_INITIAL_MESSAGE_STORAGE_KEY, JSON.stringify(message));
};

const removeStoredSessionMessages = (sessionId: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(`${SESSION_MESSAGES_STORAGE_PREFIX}${sessionId}`);
};

const saveInitialSessionMessage = (
  sessionId: string,
  message: { id: string; role: 'user'; content: string },
) => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(`${SESSION_MESSAGES_STORAGE_PREFIX}${sessionId}`, JSON.stringify([message]));
};

const loadStoredChatControls = (): ChatControlsState => {
  if (typeof window === 'undefined') {
    return DEFAULT_CHAT_CONTROLS;
  }

  const saved = localStorage.getItem(CHAT_CONTROLS_STORAGE_KEY);
  if (!saved) {
    return DEFAULT_CHAT_CONTROLS;
  }

  try {
    const parsed = JSON.parse(saved);
    if (!isRecord(parsed)) {
      return DEFAULT_CHAT_CONTROLS;
    }

    return {
      selectedModel:
        typeof parsed.selectedModel === 'string' && isChatModelId(parsed.selectedModel)
          ? parsed.selectedModel
          : DEFAULT_CHAT_CONTROLS.selectedModel,
      selectedTools: Array.isArray(parsed.selectedTools)
        ? (parsed.selectedTools.filter(
            (tool) => typeof tool === 'string',
          ) as ChatControlsState['selectedTools'])
        : DEFAULT_CHAT_CONTROLS.selectedTools,
    };
  } catch {
    return DEFAULT_CHAT_CONTROLS;
  }
};

const saveStoredChatControls = (controls: ChatControlsState) => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(CHAT_CONTROLS_STORAGE_KEY, JSON.stringify(controls));
};

function ChatControlsBridge({ controls }: { controls: ChatControlsState }) {
  useAgentContext({
    description: 'Current Zenith chat controls selected by the user',
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

interface AppProps {
  activeSessionId?: string | null;
}

export default function App({ activeSessionId = null }: AppProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [transientSessionId, setTransientSessionId] = useState<string | null>(activeSessionId);
  const [hasLoadedClientState, setHasLoadedClientState] = useState(false);
  const [pendingInitialMessage, setPendingInitialMessage] = useState<PendingInitialMessage | null>(
    loadPendingInitialMessage,
  );
  const [activeToolCallIds, setActiveToolCallIds] = useState<Set<string>>(new Set());
  const [chatControls, setChatControls] = useState<ChatControlsState>(DEFAULT_CHAT_CONTROLS);
  const [conversationViewReadyTick, setConversationViewReadyTick] = useState(0);
  const chatControlsRef = useRef(chatControls);
  const conversationViewHandleRef = useRef<ConversationViewHandle | null>(null);
  const currentSessionId = activeSessionId ?? transientSessionId;
  const currentSessionIdRef = useRef<string | null>(currentSessionId);
  const pendingInitialMessageRef = useRef<PendingInitialMessage | null>(null);
  const hasLoadedClientStateRef = useRef(hasLoadedClientState);
  const consumedPendingInitialMessageIdsRef = useRef<Set<string>>(new Set());

  currentSessionIdRef.current = currentSessionId;
  pendingInitialMessageRef.current = pendingInitialMessage;
  chatControlsRef.current = chatControls;
  hasLoadedClientStateRef.current = hasLoadedClientState;

  const updateChatControls = useCallback(
    (next: ChatControlsState | ((current: ChatControlsState) => ChatControlsState)) => {
      setChatControls((current) => {
        const resolved = typeof next === 'function' ? next(current) : next;
        syncAgentProvider(resolved);
        chatControlsRef.current = resolved;
        return resolved;
      });
    },
    [],
  );

  useEffect(() => {
    setSessions(loadStoredSessions());

    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme(storedTheme);
    }

    const storedControls = loadStoredChatControls();
    syncAgentProvider(storedControls);
    setChatControls(storedControls);
    setHasLoadedClientState(true);
  }, []);

  useEffect(() => {
    setTransientSessionId(activeSessionId);
  }, [activeSessionId]);

  useEffect(() => {
    if (!hasLoadedClientState) {
      return;
    }

    document.body.className = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [hasLoadedClientState, theme]);

  useEffect(() => {
    if (!hasLoadedClientState) {
      return;
    }

    saveStoredSessions(sessions);
  }, [hasLoadedClientState, sessions]);

  useEffect(() => {
    if (!hasLoadedClientState) {
      return;
    }

    saveStoredChatControls(chatControls);
  }, [chatControls, hasLoadedClientState]);

  useEffect(() => {
    if (!hasLoadedClientState) {
      return;
    }

    if (!currentSessionId) {
      return;
    }

    setSessions((prev) => {
      if (prev.some((session) => session.id === currentSessionId)) {
        return prev;
      }

      const nextSessions = [
        {
          id: currentSessionId,
          title: buildSessionTitle(prev.length + 1),
        },
        ...prev,
      ];
      saveStoredSessions(nextSessions);
      return nextSessions;
    });
  }, [currentSessionId, hasLoadedClientState]);

  const consumePendingInitialMessage = useCallback(
    (
      message: PendingInitialMessage,
      options?: {
        currentSessionId: string | null;
        hasLoadedClientState: boolean;
      },
    ) => {
      const handle = conversationViewHandleRef.current;
      const canConsume = options?.hasLoadedClientState ?? hasLoadedClientStateRef.current;
      const targetSessionId = options?.currentSessionId ?? currentSessionIdRef.current;

      if (!canConsume || !handle) {
        return;
      }

      if (message.sessionId !== targetSessionId) {
        return;
      }

      if (consumedPendingInitialMessageIdsRef.current.has(message.id)) {
        return;
      }

      consumedPendingInitialMessageIdsRef.current.add(message.id);
      pendingInitialMessageRef.current = null;
      savePendingInitialMessage(null);
      setPendingInitialMessage((prev) => (prev?.id === message.id ? null : prev));
      queueMicrotask(() => {
        void handle.sendMessage(message.content, { messageId: message.messageId });
      });
    },
    [],
  );

  useEffect(() => {
    if (!pendingInitialMessage) {
      return;
    }

    if (conversationViewReadyTick === 0) {
      return;
    }

    consumePendingInitialMessage(pendingInitialMessage, {
      currentSessionId,
      hasLoadedClientState,
    });
  }, [
    consumePendingInitialMessage,
    conversationViewReadyTick,
    currentSessionId,
    hasLoadedClientState,
    pendingInitialMessage,
  ]);

  const attachConversationViewHandle = useCallback((handle: ConversationViewHandle | null) => {
    conversationViewHandleRef.current = handle;
    if (handle) {
      setConversationViewReadyTick((tick) => tick + 1);
    }
  }, []);

  const submitGenerativeUIInteraction = useCallback(async (content: string) => {
    await conversationViewHandleRef.current?.sendMessage(content);
  }, []);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const showHome = () => {
    setTransientSessionId(null);
    router.push('/');
  };

  const startConversation = (content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return;
    }

    const newSession: Session = {
      id: createSessionId(),
      title: buildSessionTitle(sessions.length + 1),
    };
    const initialMessage = {
      id: createSessionId(),
      role: 'user' as const,
      content: trimmedContent,
    };
    const nextSessions = [newSession, ...sessions];
    const nextPendingMessage = {
      id: createSessionId(),
      sessionId: newSession.id,
      content: trimmedContent,
      messageId: initialMessage.id,
    };

    setSessions(nextSessions);
    saveStoredSessions(nextSessions);
    saveStoredChatControls(chatControlsRef.current);
    saveInitialSessionMessage(newSession.id, initialMessage);
    setPendingInitialMessage(nextPendingMessage);
    savePendingInitialMessage(nextPendingMessage);
    router.push(`/chat/${newSession.id}`);
  };

  const selectSession = (id: string) => {
    setTransientSessionId(id);
    router.push(`/chat/${id}`);
  };

  const deleteSession = (id: string, event: MouseEvent) => {
    event.stopPropagation();
    setSessions((prev) => {
      const nextSessions = prev.filter((session) => session.id !== id);
      saveStoredSessions(nextSessions);
      return nextSessions;
    });
    removeStoredSessionMessages(id);
    if (currentSessionId === id) {
      setTransientSessionId(null);
      router.push('/');
    }
  };

  const currentSession =
    sessions.find((session) => session.id === currentSessionId) ??
    (currentSessionId
      ? {
          id: currentSessionId,
          title: buildSessionTitle(sessions.length + 1),
        }
      : null);

  return (
    <div className="flex h-screen w-full overflow-hidden transition-colors duration-500 bg-bg text-text-primary">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={selectSession}
        onNewChat={showHome}
        onDeleteSession={deleteSession}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main
        className={
          currentSession
            ? 'relative flex flex-1 flex-col overflow-hidden'
            : 'relative flex flex-1 flex-col items-center justify-center overflow-hidden'
        }
      >
        <div className={currentSession ? 'flex h-full min-h-0 flex-1 flex-col' : 'w-full'}>
          <CopilotKitProvider
            runtimeUrl="/api/copilotkit"
            headers={{
              'x-zenith-provider': getModelOption(chatControls.selectedModel).provider,
            }}
            useSingleEndpoint
            showDevConsole={false}
          >
            <ChatControlsProvider
              value={{ controls: chatControls, setControls: updateChatControls }}
            >
              <ChatControlsBridge controls={chatControls} />
              <GenerativeUIInteractionProvider
                onSubmit={submitGenerativeUIInteraction}
                activeToolCallIds={activeToolCallIds}
              >
                <GenerativeUIRegistry agentId="zenith" />
                <AnimatePresence mode="wait">
                  {!currentSession ? (
                    <motion.div
                      key="home"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className="w-full max-w-3xl px-6"
                    >
                      <HomeView
                        onSendMessage={startConversation}
                        controls={chatControls}
                        onControlsChange={updateChatControls}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key={currentSession.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex h-full w-full flex-1 min-h-0 "
                    >
                      <div className="flex h-full min-h-0 flex-1 flex-col border border-border bg-sidebar-bg shadow-sm">
                        <div className="border-b border-border px-5 py-2">
                          <h2 className="text-base font-semibold text-text-primary">
                            {currentSession.title}
                          </h2>
                        </div>
                        <div className="flex h-full min-h-0 flex-1">
                          <ConversationView
                            ref={attachConversationViewHandle}
                            sessionId={currentSession.id}
                            controlsRef={chatControlsRef}
                            onActiveToolCallIdsChange={setActiveToolCallIds}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GenerativeUIInteractionProvider>
            </ChatControlsProvider>
          </CopilotKitProvider>
        </div>
      </main>
    </div>
  );
}
