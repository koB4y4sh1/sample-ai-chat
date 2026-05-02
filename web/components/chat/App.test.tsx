import { useFrontendTool } from '@copilotkit/react-core/v2';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import React, { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

type MockMessage = {
  id: string;
  role?: string;
  content: unknown;
  error?: boolean;
  errorText?: string;
  status?: string;
  toolCallId?: string;
  toolCalls?: Array<{
    id: string;
    function: {
      name: string;
      arguments?: string;
    };
  }>;
};

type MockCopilotChatInputRenderProps = {
  textArea: React.ReactNode;
  sendButton: React.ReactNode;
  startTranscribeButton: React.ReactNode;
};

type MockCopilotChatInputProps = {
  children?: React.ReactNode | ((props: MockCopilotChatInputRenderProps) => React.ReactNode);
  className?: string;
  onSubmitMessage?: (message: string) => void;
  onChange?: (message: string) => void;
  textArea?: {
    placeholder?: string;
  };
  value?: string;
};

type MockCopilotChatViewProps = {
  input?: string | React.ComponentType<MockCopilotChatInputProps> | { className?: string };
  isRunning?: boolean;
  messageView?: {
    assistantMessage?: React.ComponentType<{
      message: MockMessage;
      messages: MockMessage[];
      isRunning?: boolean;
    }>;
    className?: string;
    userMessage?: React.ComponentType<{
      message: MockMessage;
      messages: MockMessage[];
    }>;
  };
  messages?: MockMessage[];
  welcomeScreen?: (props: {
    input: React.ReactNode;
    suggestionView: React.ReactNode;
  }) => React.ReactNode;
  onSubmitMessage?: (message: string) => void;
};

type MockCopilotChatProps = {
  chatView?: React.ComponentType<MockCopilotChatViewProps>;
  className?: string;
  labels?: {
    chatInputPlaceholder?: string;
    modalHeaderTitle?: string;
  };
  messageView?: MockCopilotChatViewProps['messageView'];
  onSubmitMessage?: (message: string) => void;
  welcomeScreen?: MockCopilotChatViewProps['welcomeScreen'];
};

let capturedRuntimeUrl: string | undefined;
let capturedHeaders: Record<string, string> | undefined;
let capturedRenderActivityMessages: unknown[] | undefined;

const agentListeners = new Set<() => void>();
const notifyAgentListeners = () => {
  for (const listener of agentListeners) {
    listener();
  }
};
const agent = {
  addMessage: vi.fn((message: MockMessage) => {
    agent.messages = [...agent.messages, message];
    notifyAgentListeners();
  }),
  isRunning: false,
  messages: [] as MockMessage[],
  state: {} as Record<string, unknown>,
  setState: vi.fn((state: Record<string, unknown>) => {
    agent.state = { ...agent.state, ...state };
    notifyAgentListeners();
  }),
  setMessages: vi.fn((messages: MockMessage[]) => {
    agent.messages = messages;
    notifyAgentListeners();
  }),
};
const runAgentMessageSnapshots: MockMessage[][] = [];
const runAgent = vi.fn(() => {
  runAgentMessageSnapshots.push([...agent.messages]);
});
const useAgentMock = vi.fn(() => {
  const [, forceRender] = React.useState(0);

  React.useLayoutEffect(() => {
    const listener = () => {
      forceRender((count) => count + 1);
    };

    agentListeners.add(listener);
    return () => {
      agentListeners.delete(listener);
    };
  }, []);

  return { agent };
});
const useCopilotKitMock = vi.fn(() => ({ copilotkit: { runAgent } }));
const pushMock = vi.fn();
const routerMock = {
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
  push: pushMock,
  refresh: vi.fn(),
  replace: vi.fn(),
};

vi.mock('@copilotkit/react-core/v2', async () => {
  const React = await import('react');

  const MockCopilotChatInput = Object.assign(
    function MockCopilotChatInput({
      children,
      onSubmitMessage,
      onChange,
      textArea,
      value = '',
    }: MockCopilotChatInputProps) {
      const [draft, setDraft] = React.useState(value);

      const submit = () => {
        onSubmitMessage?.(draft);
      };

      const textAreaElement = (
        <textarea
          placeholder={textArea?.placeholder}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            onChange?.(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
        />
      );

      const sendButtonElement = (
        <button type="button" onClick={submit}>
          Send
        </button>
      );

      const transcribeButtonElement = <button type="button">Mic</button>;

      if (typeof children === 'function') {
        return children({
          textArea: textAreaElement,
          sendButton: sendButtonElement,
          startTranscribeButton: transcribeButtonElement,
        });
      }

      return (
        <div>
          {textAreaElement}
          {sendButtonElement}
        </div>
      );
    },
    {
      SendButton: () => null,
      ToolbarButton: () => null,
      StartTranscribeButton: () => null,
      CancelTranscribeButton: () => null,
      FinishTranscribeButton: () => null,
      AddMenuButton: () => null,
      AudioRecorder: () => null,
      Disclaimer: () => null,
    },
  );

  const MockCopilotChatMessageView = Object.assign(
    function MockCopilotChatMessageView() {
      return <div />;
    },
    {
      Cursor: () => null,
    },
  );

  const MockCopilotChatAssistantMessage = Object.assign(
    function MockCopilotChatAssistantMessage({ message }: { message?: MockMessage }) {
      return <div>{message ? readMessageContent(message.content) : null}</div>;
    },
    {
      MarkdownRenderer: () => null,
      Toolbar: () => null,
      ToolbarButton: () => null,
      CopyButton: () => null,
      ThumbsUpButton: () => null,
      ThumbsDownButton: () => null,
      ReadAloudButton: () => null,
      RegenerateButton: () => null,
    },
  );

  const MockCopilotChatUserMessage = Object.assign(
    function MockCopilotChatUserMessage({ message }: { message?: MockMessage }) {
      return <div>{message ? readMessageContent(message.content) : null}</div>;
    },
    {
      Container: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
      MessageRenderer: () => null,
      Toolbar: () => null,
      ToolbarButton: () => null,
      CopyButton: () => null,
      EditButton: () => null,
      BranchNavigation: () => null,
    },
  );

  function readMessageContent(content: unknown) {
    if (typeof content === 'string') {
      return content;
    }

    if (!Array.isArray(content)) {
      return '';
    }

    return content
      .flatMap((item) =>
        item?.type === 'text' && typeof item.text === 'string' ? [item.text] : [],
      )
      .join('');
  }

  const MockCopilotChatView = Object.assign(
    function MockCopilotChatView({
      input,
      isRunning,
      messageView,
      messages = [],
      welcomeScreen,
      onSubmitMessage,
    }: MockCopilotChatViewProps) {
      let inputElement: React.ReactNode = null;

      if (typeof input === 'function') {
        inputElement = React.createElement(input, { onSubmitMessage });
      } else if (input) {
        inputElement = (
          <MockCopilotChatInput
            className={typeof input === 'string' ? input : input.className}
            onSubmitMessage={onSubmitMessage}
            textArea={{ placeholder: 'Type a message...' }}
          />
        );
      }

      if (typeof welcomeScreen === 'function') {
        return <div>{welcomeScreen({ input: inputElement, suggestionView: <div /> })}</div>;
      }

      return (
        <div>
          <div>
            {messages.map((message) => {
              if (message.role === 'assistant' && messageView?.assistantMessage) {
                const AssistantMessage = messageView.assistantMessage;
                return (
                  <AssistantMessage
                    key={message.id}
                    message={message}
                    messages={messages}
                    isRunning={isRunning}
                  />
                );
              }

              if (message.role === 'user' && messageView?.userMessage) {
                const UserMessage = messageView.userMessage;
                return <UserMessage key={message.id} message={message} messages={messages} />;
              }

              return <div key={message.id}>{readMessageContent(message.content)}</div>;
            })}
          </div>
          {inputElement}
          <div>Tools 有効</div>
        </div>
      );
    },
    {
      ScrollView: () => null,
      ScrollToBottomButton: () => null,
      Feather: () => null,
      WelcomeMessage: () => null,
      WelcomeScreen: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    },
  );

  const MockCopilotChat = Object.assign(
    function MockCopilotChat({
      chatView,
      className,
      labels,
      messageView,
      onSubmitMessage,
      welcomeScreen,
    }: MockCopilotChatProps) {
      const [draft, setDraft] = React.useState('');
      useAgentMock();

      const submit = () => {
        onSubmitMessage?.(draft);
      };

      const messageListElement = (
        <div>
          {agent.messages.map((message) => (
            <div key={message.id}>{readMessageContent(message.content)}</div>
          ))}
        </div>
      );

      const composerElement = (
        <div className={className}>
          <div>{labels?.modalHeaderTitle}</div>
          <textarea
            placeholder={labels?.chatInputPlaceholder}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
          />
          <button type="button" onClick={submit}>
            Send
          </button>
        </div>
      );
      const inputElement = (
        <div className={className}>
          {messageListElement}
          {composerElement}
        </div>
      );

      if (typeof welcomeScreen === 'function') {
        return <div>{welcomeScreen({ input: inputElement, suggestionView: <div /> })}</div>;
      }

      if (chatView) {
        return (
          <div>
            {React.createElement(chatView, {
              isRunning: agent.isRunning,
              messageView,
              messages: agent.messages,
              onSubmitMessage,
            })}
            {composerElement}
          </div>
        );
      }

      return (
        <div>
          {inputElement}
          <div>Tools 有効</div>
        </div>
      );
    },
    {
      View: MockCopilotChatView,
    },
  );

  return {
    CopilotChat: MockCopilotChat,
    CopilotChatAssistantMessage: MockCopilotChatAssistantMessage,
    CopilotChatConfigurationProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    CopilotChatInput: MockCopilotChatInput,
    CopilotChatMessageView: MockCopilotChatMessageView,
    CopilotChatUserMessage: MockCopilotChatUserMessage,
    CopilotChatView: MockCopilotChatView,
    CopilotKitProvider: ({
      children,
      runtimeUrl,
      headers,
      renderActivityMessages,
    }: {
      children: React.ReactNode;
      runtimeUrl?: string;
      headers?: Record<string, string>;
      renderActivityMessages?: unknown[];
    }) => {
      capturedRuntimeUrl = runtimeUrl;
      capturedHeaders = headers;
      capturedRenderActivityMessages = renderActivityMessages;
      return <div data-testid="copilot-kit">{children}</div>;
    },
    MCPAppsActivityContentSchema: { safeParse: vi.fn() },
    MCPAppsActivityRenderer: vi.fn(() => <div data-testid="mcp-apps-activity" />),
    MCPAppsActivityType: 'mcp-apps',
    UseAgentUpdate: {
      OnMessagesChanged: 'OnMessagesChanged',
      OnRunStatusChanged: 'OnRunStatusChanged',
    },
    useAgent: () => useAgentMock(),
    useAgentContext: vi.fn(),
    useConfigureSuggestions: vi.fn(),
    useCopilotKit: () => useCopilotKitMock(),
    useFrontendTool: vi.fn(),
  };
});

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('App', () => {
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    agent.addMessage.mockClear();
    agent.setMessages.mockClear();
    agent.setState.mockClear();
    agent.messages = [];
    agent.state = {};
    runAgent.mockClear();
    runAgentMessageSnapshots.length = 0;
    useAgentMock.mockClear();
    useCopilotKitMock.mockClear();
    vi.mocked(useFrontendTool).mockClear();
    pushMock.mockClear();
    capturedRuntimeUrl = undefined;
    capturedHeaders = undefined;
    capturedRenderActivityMessages = undefined;
  });

  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue(routerMock as ReturnType<typeof useRouter>);
  });

  it('shows the home screen before a conversation starts', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'How can I help?' })).toBeInTheDocument();
    expect(screen.getByTestId('copilot-kit')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /実行計画をUI化/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /比較表を作成/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /進捗を可視化/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /確認パネルを表示/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /既存MCPを実行/ })).toBeInTheDocument();
  });

  it('shows a Google Maps MCP Apps home suggestion', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: /Google Maps MCP App/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /MCP Appsを試す/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Quote Compare MCP App/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submission Pack MCP App/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Document Review MCP App/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Listing Assist MCP App/ })).toBeInTheDocument();
  });

  it('registers a frontend renderer for the Google Maps MCP tool call', () => {
    render(<App />);

    expect(
      vi.mocked(useFrontendTool).mock.calls.some(([tool]) => tool.name === 'show_mcp_app'),
    ).toBe(false);
    expect(useFrontendTool).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'map_view_show_google_map',
      }),
      expect.anything(),
    );
  });

  it('starts a conversation from a Generative UI home suggestion', async () => {
    vi.spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000001')
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000002')
      .mockReturnValue('00000000-0000-0000-0000-000000000003');

    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /実行計画をUI化/ }));

    expect(pushMock).toHaveBeenCalledWith('/chat/00000000-0000-0000-0000-000000000001');
    expect(
      JSON.parse(
        localStorage.getItem('zenith_session_messages:00000000-0000-0000-0000-000000000001') ??
          '[]',
      ),
    ).toEqual([
      expect.objectContaining({
        id: '00000000-0000-0000-0000-000000000002',
        role: 'user',
        content: expect.stringContaining('Generative UIのtask_plan'),
      }),
    ]);
  });

  it('starts a conversation from an existing MCP follow-up with concrete tool names', async () => {
    vi.spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000011')
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000012')
      .mockReturnValue('00000000-0000-0000-0000-000000000013');

    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /既存MCPを実行/ }));

    expect(pushMock).toHaveBeenCalledWith('/chat/00000000-0000-0000-0000-000000000011');
    expect(
      JSON.parse(
        localStorage.getItem('zenith_session_messages:00000000-0000-0000-0000-000000000011') ??
          '[]',
      ),
    ).toEqual([
      expect.objectContaining({
        id: '00000000-0000-0000-0000-000000000012',
        role: 'user',
        content: expect.stringContaining('map_view_show_google_map'),
      }),
    ]);
    expect(
      JSON.parse(
        localStorage.getItem('zenith_session_messages:00000000-0000-0000-0000-000000000011') ??
          '[]',
      )[0].content,
    ).toContain('document_review_show_document_review_app');
    expect(
      JSON.parse(
        localStorage.getItem('zenith_session_messages:00000000-0000-0000-0000-000000000011') ??
          '[]',
      )[0].content,
    ).toContain('listing_assist_show_listing_app');
  });

  it('queues the home input until the conversation route is active', async () => {
    vi.spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000001')
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000002')
      .mockReturnValue('00000000-0000-0000-0000-000000000003');

    const user = userEvent.setup();
    const { rerender } = render(<App />);

    await user.type(screen.getByPlaceholderText('Ask anything...'), 'test');
    await user.keyboard('{Enter}');

    expect(pushMock).toHaveBeenCalledWith('/chat/00000000-0000-0000-0000-000000000001');
    expect(
      JSON.parse(
        localStorage.getItem('zenith_session_messages:00000000-0000-0000-0000-000000000001') ??
          '[]',
      ),
    ).toEqual([
      {
        id: '00000000-0000-0000-0000-000000000002',
        role: 'user',
        content: 'test',
      },
    ]);
    expect(screen.getByRole('heading', { name: 'How can I help?' })).toBeInTheDocument();
    expect(runAgent).not.toHaveBeenCalled();

    rerender(<App activeSessionId="00000000-0000-0000-0000-000000000001" />);

    expect(screen.getByText('Conversation 1')).toBeInTheDocument();
    expect(await screen.findByTestId('copilot-kit')).toBeInTheDocument();
    expect(await screen.findByPlaceholderText('Type a message...')).toBeInTheDocument();
    expect(await screen.findByText('Tools 有効')).toBeInTheDocument();
    await waitFor(() => expect(runAgent).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('test')).toBeInTheDocument();
    expect(agent.addMessage).not.toHaveBeenCalled();
    expect(agent.setMessages).toHaveBeenCalledWith([
      {
        id: '00000000-0000-0000-0000-000000000002',
        role: 'user',
        content: 'test',
      },
    ]);
    expect(runAgentMessageSnapshots.at(-1)).toEqual([
      {
        id: '00000000-0000-0000-0000-000000000002',
        role: 'user',
        content: 'test',
      },
    ]);
    expect(agent.setState).toHaveBeenCalledWith({ model: 'gpt-5.4-nano', provider: 'openai' });

    agent.setMessages([
      {
        id: 'assistant-1',
        role: 'assistant',
        content: 'answer',
      },
    ]);

    expect(await screen.findByText('answer')).toBeInTheDocument();
    expect(await screen.findByText('test')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        JSON.parse(
          localStorage.getItem('zenith_session_messages:00000000-0000-0000-0000-000000000001') ??
            '[]',
        ),
      ).toEqual([
        {
          id: '00000000-0000-0000-0000-000000000002',
          role: 'user',
          content: 'test',
        },
        {
          id: 'assistant-1',
          role: 'assistant',
          content: 'answer',
        },
      ]),
    );
  });

  it('sends the initial home message only once in StrictMode', async () => {
    vi.spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000001')
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000002')
      .mockReturnValue('00000000-0000-0000-0000-000000000003');

    const user = userEvent.setup();
    const { rerender } = render(
      <StrictMode>
        <App />
      </StrictMode>,
    );

    await user.type(screen.getByPlaceholderText('Ask anything...'), 'strict mode');
    await user.keyboard('{Enter}');

    expect(runAgent).not.toHaveBeenCalled();

    rerender(
      <StrictMode>
        <App activeSessionId="00000000-0000-0000-0000-000000000001" />
      </StrictMode>,
    );

    await waitFor(() => expect(runAgent).toHaveBeenCalledTimes(1));
    expect(agent.addMessage).not.toHaveBeenCalled();
    expect(agent.setMessages).toHaveBeenCalledWith([
      {
        id: '00000000-0000-0000-0000-000000000002',
        role: 'user',
        content: 'strict mode',
      },
    ]);
    expect(runAgentMessageSnapshots.at(-1)).toEqual([
      {
        id: '00000000-0000-0000-0000-000000000002',
        role: 'user',
        content: 'strict mode',
      },
    ]);
    expect(agent.setState).toHaveBeenCalledWith({ model: 'gpt-5.4-nano', provider: 'openai' });
  });

  it('loads stored controls before sending a pending initial message', async () => {
    localStorage.setItem(
      'zenith_chat_controls',
      JSON.stringify({ selectedModel: 'anthropic', selectedTools: [] }),
    );
    sessionStorage.setItem(
      'zenith_pending_initial_message',
      JSON.stringify({
        id: 'pending-1',
        sessionId: 'session-1',
        content: 'use anthropic',
      }),
    );

    render(
      <StrictMode>
        <App activeSessionId="session-1" />
      </StrictMode>,
    );

    await waitFor(() => expect(runAgent).toHaveBeenCalledTimes(1));
    expect(agent.addMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'use anthropic',
        role: 'user',
      }),
    );
    expect(runAgentMessageSnapshots.at(-1)).toEqual([
      expect.objectContaining({
        content: 'use anthropic',
        role: 'user',
      }),
    ]);
    expect(agent.setState).toHaveBeenCalledWith({
      model: 'claude-sonnet-4-5',
      provider: 'anthropic',
    });

    const runAgentOrder = runAgent.mock.invocationCallOrder[0];
    const lastStateBeforeRun = agent.setState.mock.calls
      .map((call, index) => ({
        order: agent.setState.mock.invocationCallOrder[index],
        state: call[0],
      }))
      .filter(({ order }) => order < runAgentOrder)
      .at(-1)?.state;

    expect(lastStateBeforeRun).toEqual({
      model: 'claude-sonnet-4-5',
      provider: 'anthropic',
    });
  });

  it('shows a running tool status inside the assistant message', async () => {
    agent.isRunning = true;
    agent.messages = [
      {
        id: 'assistant-tool-call',
        role: 'assistant',
        content: null,
        toolCalls: [
          {
            id: 'call-1',
            function: {
              name: 'show_zenith_panel',
              arguments: '{"panel":"task_plan"}',
            },
          },
        ],
      },
    ];

    render(<App activeSessionId="session-1" />);

    const statusList = await screen.findByTestId('mcp-tool-status-list');
    expect(statusList).toHaveTextContent('show_zenith_panel');
    expect(statusList).toHaveTextContent('Running');
    expect(statusList).toHaveTextContent('Tool execution');
    expect(screen.queryByTestId('mcp-tool-progress')).not.toBeInTheDocument();
  });

  it('returns to the home screen when New chat is clicked', async () => {
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(
      '00000000-0000-0000-0000-000000000001',
    );

    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByPlaceholderText('Ask anything...'), 'test');
    await user.keyboard('{Enter}');
    await user.click(screen.getByRole('button', { name: 'New chat' }));

    expect(pushMock).toHaveBeenLastCalledWith('/');
    expect(screen.getByRole('heading', { name: 'How can I help?' })).toBeInTheDocument();
    expect(screen.getByText('Conversation 1')).toBeInTheDocument();
    expect(screen.getByTestId('copilot-kit')).toBeInTheDocument();
  });

  it('always uses /api/copilotkit as runtimeUrl regardless of model', () => {
    render(<App />);

    expect(capturedRuntimeUrl).toBe('/api/copilotkit');
  });

  it('overrides the MCP Apps activity renderer with a stable renderer', () => {
    render(<App />);

    expect(capturedRenderActivityMessages).toEqual([
      expect.objectContaining({ activityType: 'mcp-apps' }),
    ]);
  });

  it('passes x-zenith-provider: openai header when openai model is selected (default)', () => {
    render(<App />);

    expect(capturedHeaders).toMatchObject({ 'x-zenith-provider': 'openai' });
  });

  it('passes x-zenith-provider: anthropic header when anthropic model is stored', () => {
    localStorage.setItem(
      'zenith_chat_controls',
      JSON.stringify({ selectedModel: 'anthropic', selectedTools: [] }),
    );

    render(<App />);

    expect(capturedRuntimeUrl).toBe('/api/copilotkit');
    expect(capturedHeaders).toMatchObject({ 'x-zenith-provider': 'anthropic' });
  });

  it('passes x-zenith-provider: lang-chain header when LangGraph model is stored', () => {
    localStorage.setItem(
      'zenith_chat_controls',
      JSON.stringify({ selectedModel: 'lang-chain', selectedTools: [] }),
    );

    render(<App />);

    expect(capturedRuntimeUrl).toBe('/api/copilotkit');
    expect(capturedHeaders).toMatchObject({ 'x-zenith-provider': 'lang-chain' });
  });

  it('restores stored conversation messages for an existing session', async () => {
    localStorage.setItem(
      'zenith_sessions',
      JSON.stringify([{ id: 'session-1', title: 'Conversation 1' }]),
    );
    localStorage.setItem(
      'zenith_session_messages:session-1',
      JSON.stringify([
        {
          id: 'message-1',
          role: 'user',
          content: 'saved message',
        },
      ]),
    );

    render(<App activeSessionId="session-1" />);

    expect(await screen.findByText('saved message')).toBeInTheDocument();
  });

  it('shows a successful tool status when a matching tool result arrives', async () => {
    agent.isRunning = false;
    agent.messages = [
      {
        id: 'assistant-tool-call',
        role: 'assistant',
        content: null,
        toolCalls: [
          {
            id: 'call-1',
            function: {
              name: 'mock_doc_tool',
              arguments: '{"documentId":"D001"}',
            },
          },
        ],
      },
      {
        id: 'tool-result-1',
        role: 'tool',
        toolCallId: 'call-1',
        content: 'Document D001: contents retrieved.',
      },
    ];

    render(<App activeSessionId="session-1" />);

    const statusList = await screen.findByTestId('mcp-tool-status-list');
    const statusCard = screen.getByTestId('mcp-tool-status');
    expect(statusList).toHaveTextContent('mock_doc_tool');
    expect(statusList).toHaveTextContent('Success');
    expect(statusList).toHaveTextContent('Document D001: contents retrieved.');
    expect(statusCard).not.toHaveAttribute('open');
    expect(screen.queryByTestId('mcp-tool-progress')).not.toBeInTheDocument();
  });

  it('shows an error tool status when a matching tool result is marked as error', async () => {
    agent.isRunning = false;
    agent.messages = [
      {
        id: 'assistant-tool-call',
        role: 'assistant',
        content: null,
        toolCalls: [
          {
            id: 'call-1',
            function: {
              name: 'mock_doc_tool',
              arguments: '{"documentId":"D001"}',
            },
          },
        ],
      },
      {
        id: 'tool-result-1',
        role: 'tool',
        toolCallId: 'call-1',
        status: 'error',
        content: 'MCP server timeout',
      },
    ];

    render(<App activeSessionId="session-1" />);

    const statusList = await screen.findByTestId('mcp-tool-status-list');
    const statusCard = screen.getByTestId('mcp-tool-status');
    expect(statusList).toHaveTextContent('mock_doc_tool');
    expect(statusList).toHaveTextContent('Error');
    expect(statusList).toHaveTextContent('MCP server timeout');
    expect(statusCard).not.toHaveAttribute('open');
    expect(statusList).not.toHaveTextContent('Success');
  });

  it('shows tool status from active tool calls before results arrive', async () => {
    agent.isRunning = true;
    agent.messages = [
      {
        id: 'assistant-tool-call',
        role: 'assistant',
        content: null,
        toolCalls: [
          {
            id: 'call-1',
            function: {
              name: 'mock_doc_tool',
            },
          },
        ],
      },
    ];

    render(<App activeSessionId="session-1" />);

    const statusList = await screen.findByTestId('mcp-tool-status-list');
    expect(statusList).toHaveTextContent('mock_doc_tool');
    expect(statusList).toHaveTextContent('Running');
    expect(screen.queryByTestId('mcp-tool-progress')).not.toBeInTheDocument();
  });

  it('filters out orphan tool call messages when restoring conversation history', async () => {
    localStorage.setItem(
      'zenith_sessions',
      JSON.stringify([{ id: 'session-orphan', title: 'Failed Conversation' }]),
    );
    localStorage.setItem(
      'zenith_session_messages:session-orphan',
      JSON.stringify([
        { id: 'u1', role: 'user', content: 'show me flights' },
        {
          id: 'a1',
          role: 'assistant',
          content: null,
          toolCalls: [
            {
              id: 'orphan_call',
              type: 'function',
              function: { name: 'show_flight_options', arguments: '{}' },
            },
          ],
        },
        // No tool result for orphan_call — this assistant message should be filtered out
      ]),
    );

    render(<App activeSessionId="session-orphan" />);

    await waitFor(() => expect(agent.setMessages).toHaveBeenCalled());

    const lastCall = agent.setMessages.mock.calls.at(-1)?.[0] as MockMessage[];
    expect(lastCall.some((m) => m.id === 'a1')).toBe(false);
    expect(lastCall.some((m) => m.id === 'u1')).toBe(true);
  });

  it('does not persist orphan tool call messages to localStorage', async () => {
    render(<App activeSessionId="session-save-test" />);

    await screen.findByPlaceholderText('Type a message...');

    agent.setMessages([
      { id: 'u1', role: 'user', content: 'test query' },
      {
        id: 'a1',
        role: 'assistant',
        content: null,
        toolCalls: [{ id: 'orphan_id', function: { name: 'some_tool' } }],
      },
    ]);

    await waitFor(() => {
      const saved = JSON.parse(
        localStorage.getItem('zenith_session_messages:session-save-test') ?? 'null',
      ) as MockMessage[] | null;
      expect(saved).not.toBeNull();
      expect(saved?.some((m) => m.id === 'a1')).toBe(false);
      expect(saved?.some((m) => m.id === 'u1')).toBe(true);
    });
  });
});
