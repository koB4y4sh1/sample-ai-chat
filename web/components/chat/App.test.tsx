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
  messages?: MockMessage[];
  welcomeScreen?: (props: {
    input: React.ReactNode;
    suggestionView: React.ReactNode;
  }) => React.ReactNode;
  onSubmitMessage?: (message: string) => void;
};

type MockCopilotChatProps = {
  className?: string;
  labels?: {
    chatInputPlaceholder?: string;
    modalHeaderTitle?: string;
  };
  onSubmitMessage?: (message: string) => void;
  welcomeScreen?: MockCopilotChatViewProps['welcomeScreen'];
};

let capturedRuntimeUrl: string | undefined;
let capturedHeaders: Record<string, string> | undefined;

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
  setState: vi.fn(),
  setMessages: vi.fn((messages: MockMessage[]) => {
    agent.messages = messages;
    notifyAgentListeners();
  }),
};
const runAgent = vi.fn();
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
    function MockCopilotChatAssistantMessage() {
      return <div />;
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
    function MockCopilotChatUserMessage() {
      return <div />;
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

  const readMessageContent = (content: unknown) => {
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
  };

  const MockCopilotChatView = Object.assign(
    function MockCopilotChatView({
      input,
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
            {messages.map((message) => (
              <div key={message.id}>{readMessageContent(message.content)}</div>
            ))}
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
      className,
      labels,
      onSubmitMessage,
      welcomeScreen,
    }: MockCopilotChatProps) {
      const [draft, setDraft] = React.useState('');
      useAgentMock();

      const submit = () => {
        onSubmitMessage?.(draft);
      };

      const inputElement = (
        <div className={className}>
          <div>
            {agent.messages.map((message) => (
              <div key={message.id}>{readMessageContent(message.content)}</div>
            ))}
          </div>
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

      if (typeof welcomeScreen === 'function') {
        return <div>{welcomeScreen({ input: inputElement, suggestionView: <div /> })}</div>;
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
    }: {
      children: React.ReactNode;
      runtimeUrl?: string;
      headers?: Record<string, string>;
    }) => {
      capturedRuntimeUrl = runtimeUrl;
      capturedHeaders = headers;
      return <div data-testid="copilot-kit">{children}</div>;
    },
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
    runAgent.mockClear();
    useAgentMock.mockClear();
    useCopilotKitMock.mockClear();
    pushMock.mockClear();
    capturedRuntimeUrl = undefined;
    capturedHeaders = undefined;
  });

  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue(routerMock as ReturnType<typeof useRouter>);
  });

  it('shows the home screen before a conversation starts', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'How can I help?' })).toBeInTheDocument();
    expect(screen.getByTestId('copilot-kit')).toBeInTheDocument();
  });

  it('creates a session from the home input and mounts CopilotKit for that thread', async () => {
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(
      '00000000-0000-0000-0000-000000000001',
    );

    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByPlaceholderText('Ask anything...'), 'test');
    await user.keyboard('{Enter}');

    expect(pushMock).toHaveBeenCalledWith('/chat/00000000-0000-0000-0000-000000000001');
    expect(screen.getByText('Conversation 1')).toBeInTheDocument();
    expect(await screen.findByTestId('copilot-kit')).toBeInTheDocument();
    expect(await screen.findByPlaceholderText('Type a message...')).toBeInTheDocument();
    expect(await screen.findByText('Tools 有効')).toBeInTheDocument();
    await waitFor(() => expect(runAgent).toHaveBeenCalledTimes(1));
    expect(agent.addMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'test',
        role: 'user',
      }),
    );
    expect(agent.setState).toHaveBeenCalledWith({ model: 'gpt-5.4-nano', provider: 'openai' });
  });

  it('sends the initial home message only once in StrictMode', async () => {
    vi.spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000001')
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000002')
      .mockReturnValue('00000000-0000-0000-0000-000000000003');

    const user = userEvent.setup();
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );

    await user.type(screen.getByPlaceholderText('Ask anything...'), 'strict mode');
    await user.keyboard('{Enter}');

    await waitFor(() => expect(runAgent).toHaveBeenCalledTimes(1));
    expect(agent.addMessage).toHaveBeenCalledTimes(1);
    expect(agent.setState).toHaveBeenCalledWith({ model: 'gpt-5.4-nano', provider: 'openai' });
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
});
