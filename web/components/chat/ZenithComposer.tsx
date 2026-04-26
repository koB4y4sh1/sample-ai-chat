import { CopilotChatInput, type CopilotChatInputProps } from '@copilotkit/react-core/v2';
import { ModelSelector } from '../common/ModelSelector';
import { ToolSelector } from '../common/ToolSelector';

interface ZenithComposerProps extends Omit<CopilotChatInputProps, 'children'> {
  placeholder: string;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  selectedTools: string[];
  setSelectedTools: (tools: string[]) => void;
  anchored?: boolean;
}

export const ZenithComposer = Object.assign(function ZenithComposer({
  placeholder,
  selectedModel,
  setSelectedModel,
  selectedTools,
  setSelectedTools,
  anchored = false,
  className,
  ...props
}: ZenithComposerProps) {
  return (
    <CopilotChatInput
      {...props}
      positioning="static"
      bottomAnchored={anchored}
      showDisclaimer={false}
      className={className}
      textArea={{
        className:
          'min-h-28 w-full resize-none bg-transparent px-2 py-2 text-[15px] leading-relaxed text-text-primary placeholder:text-text-secondary focus:ring-0',
        placeholder,
        rows: 4,
      }}
      sendButton="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-gradient text-white shadow-sm"
      startTranscribeButton="rounded-full p-2 text-text-secondary transition-colors hover:text-text-primary"
    >
      {({ textArea, sendButton, startTranscribeButton }) => (
        <div className="mx-auto w-full max-w-3xl">
          <div className="mx-auto rounded-[28px] border border-border bg-sidebar-bg px-4 pt-4 pb-3 shadow-xs transition-colors focus-within:border-text-secondary/40">
            <div className="px-2">{textArea}</div>

            <div className="mt-4 flex items-end justify-between gap-3 border-t border-border pt-3">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <ToolSelector value={selectedTools} onChange={setSelectedTools} />
                <ModelSelector value={selectedModel} onChange={setSelectedModel} />
              </div>

              <div className="flex items-center gap-2">
                {startTranscribeButton}
                {sendButton}
              </div>
            </div>
          </div>
        </div>
      )}
    </CopilotChatInput>
  );
}, CopilotChatInput);
