import { CopilotChatInput, type CopilotChatInputProps } from '@copilotkit/react-core/v2';
import { Paperclip } from 'lucide-react';
import { useCallback, useLayoutEffect, useRef } from 'react';
import type { ChatModelId, ChatToolId } from '../../lib/chat-controls';
import { cn } from '../../lib/utils';
import { ModelSelector } from '../common/ModelSelector';
import { ToolSelector } from '../common/ToolSelector';

interface ZenithComposerProps extends Omit<CopilotChatInputProps, 'children'> {
  placeholder: string;
  selectedModel: ChatModelId;
  setSelectedModel: (model: ChatModelId) => void;
  selectedTools: ChatToolId[];
  setSelectedTools: (tools: ChatToolId[]) => void;
  anchored?: boolean;
  sticky?: boolean;
}

export function ZenithComposer({
  placeholder,
  selectedModel,
  setSelectedModel,
  selectedTools,
  setSelectedTools,
  anchored = false,
  sticky = false,
  className,
  ...props
}: ZenithComposerProps) {
  const composerRootRef = useRef<HTMLDivElement | null>(null);
  const submitWithCurrentControls = (value: string) => {
    props.onSubmitMessage?.(value);
  };
  const updateComposerHeight = useCallback(() => {
    const composerRoot = composerRootRef.current;
    if (!composerRoot) {
      return;
    }

    const chatRoot = composerRoot.closest<HTMLElement>('.zenith-copilot-chat');
    if (chatRoot) {
      chatRoot.style.setProperty(
        '--zenith-composer-height',
        `${Math.ceil(composerRoot.getBoundingClientRect().height)}px`,
      );
    }

    const shellRoot = composerRoot.closest<HTMLElement>('.zenith-conversation-shell');
    if (shellRoot) {
      shellRoot.style.setProperty(
        '--zenith-composer-height',
        `${Math.ceil(composerRoot.getBoundingClientRect().height)}px`,
      );
    }
  }, []);

  useLayoutEffect(() => {
    const composerRoot = composerRootRef.current;
    if (!composerRoot) {
      return;
    }

    updateComposerHeight();

    const observer = new ResizeObserver(updateComposerHeight);
    observer.observe(composerRoot);
    window.addEventListener('resize', updateComposerHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateComposerHeight);
    };
  }, [updateComposerHeight]);

  return (
    <CopilotChatInput
      {...props}
      onSubmitMessage={submitWithCurrentControls}
      positioning="static"
      bottomAnchored={anchored}
      showDisclaimer={false}
      className={className}
      sendButton="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-gradient text-white shadow-sm"
      startTranscribeButton="rounded-full p-2 text-text-secondary transition-colors hover:text-text-primary"
      addMenuButton="rounded-full p-2 text-text-secondary transition-colors hover:text-text-primary disabled:opacity-40"
    >
      {({
        textArea,
        sendButton,
        startTranscribeButton,
        addMenuButton,
        onAddFile,
        containerRef,
        keyboardHeight,
      }) => (
        <div
          ref={(node) => {
            composerRootRef.current = node;
            if (typeof containerRef === 'function') {
              containerRef(node);
            } else if (containerRef) {
              containerRef.current = node;
            }
          }}
          className={cn(
            anchored ? 'absolute inset-x-0 bottom-0 z-20 px-4 pb-5 pt-3 sm:px-6' : 'relative z-20',
            !anchored && sticky && 'sticky bottom-0 mt-auto bg-sidebar-bg px-4 pb-5 pt-3 sm:px-6',
            !anchored && !sticky && 'mt-auto px-4 pb-5 pt-3 sm:px-6',
            className,
          )}
          style={{
            transform:
              typeof keyboardHeight === 'number' && keyboardHeight > 0
                ? `translateY(-${keyboardHeight}px)`
                : undefined,
            transition: 'transform 0.2s ease-out',
          }}
        >
          <div className="mx-auto w-full max-w-3xl">
            <div className="mx-auto rounded-[28px] border border-border bg-sidebar-bg px-4 pt-4 pb-3 shadow-xs transition-colors focus-within:border-text-secondary/40">
              <div className="px-2">{textArea}</div>

              <div className="mt-4 flex items-end justify-between gap-3 border-t border-border pt-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <ToolSelector value={selectedTools} onChange={setSelectedTools} />
                  <ModelSelector value={selectedModel} onChange={setSelectedModel} />
                </div>

                <div className="flex items-center gap-2">
                  {onAddFile ? addMenuButton : <FallbackAttachButton />}
                  {startTranscribeButton}
                  {sendButton}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </CopilotChatInput>
  );
}

function FallbackAttachButton() {
  return (
    <button
      type="button"
      disabled
      className="rounded-full p-2 text-text-secondary opacity-40"
      aria-label="Attachments are not available"
    >
      <Paperclip className="h-5 w-5" />
    </button>
  );
}
