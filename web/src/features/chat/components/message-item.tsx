'use client';

import type { AssistantMessage, Message } from '@copilotkit/react-core/v2';
import { CheckCircle2, Loader2, Wrench, XCircle } from 'lucide-react';
import {
  findToolResultMessage,
  getToolCallArguments,
  getToolCallName,
  getToolResultContent,
  truncateToolContent,
} from '@/features/chat/lib/build-message';
import { isRecord, isToolResultError } from '@/features/chat/lib/message-validation';
import { cn } from '@/lib/utils';

/** Copilot チャット内のアシスタントメッセージにぶら下がるツール実行ステータス表示。 */
export function MessageItemToolStatus({
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
