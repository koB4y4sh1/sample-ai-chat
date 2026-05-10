'use client';

import { CheckCircle2, Loader2, Wrench, XCircle } from 'lucide-react';
import { truncateToolContent } from '@/features/chat/lib/build-message';
import { isRecord } from '@/features/chat/lib/message-validation';
import { cn } from '@/lib/utils';

function parseJsonRecord(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

const isErrorStatus = (value: unknown) =>
  typeof value === 'string' && ['error', 'failed', 'failure'].includes(value.toLowerCase());

/** ツール結果の本文がエラー JSON かどうか（`message-validation` は触らずこのモジュール内で完結）。 */
function isErroredToolResultContent(content: string): boolean {
  const parsed = parseJsonRecord(content);
  if (!parsed) {
    return false;
  }

  if (isErrorStatus(parsed.status) || parsed.error === true || parsed.isError === true) {
    return true;
  }

  if (typeof parsed.errorText === 'string' && parsed.errorText.trim()) {
    return true;
  }

  return false;
}

export type WildcardToolStatus = 'inProgress' | 'executing' | 'complete';

export type WildcardToolCardProps = {
  name: string;
  status: WildcardToolStatus;
  parameters: Record<string, unknown>;
  result: string | undefined;
};

function formatParameters(parameters: Record<string, unknown>): string | null {
  if (!parameters || Object.keys(parameters).length === 0) {
    return null;
  }

  try {
    return JSON.stringify(parameters, null, 2);
  } catch {
    return String(parameters);
  }
}

function resolveDisplayStatus(props: WildcardToolCardProps): 'Running' | 'Success' | 'Error' {
  if (props.status !== 'complete') {
    return 'Running';
  }

  if (!props.result) {
    return 'Success';
  }

  return isErroredToolResultContent(props.result) ? 'Error' : 'Success';
}

/** CopilotKit `useRenderTool` のワイルドカード向け。`useRenderToolCall` からも同じ見た目で呼ばれる。 */
export function WildcardToolCard(props: WildcardToolCardProps) {
  const displayStatus = resolveDisplayStatus(props);
  const argumentsText = formatParameters(props.parameters);
  const resultText = props.status === 'complete' && props.result ? props.result : null;

  return (
    <details
      data-testid="mcp-tool-status"
      className="group rounded-lg border border-border/60 bg-sidebar-bg/70 text-xs text-text-secondary shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 marker:hidden">
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-bg">
            {props.status !== 'complete' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-primary" />
            ) : displayStatus === 'Success' ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            ) : displayStatus === 'Error' ? (
              <XCircle className="h-3.5 w-3.5 text-red-500" />
            ) : (
              <Wrench className="h-3.5 w-3.5 text-text-secondary" />
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-text-primary">{props.name}</span>
            <span className="text-text-secondary/70">Tool execution</span>
          </span>
        </span>
        <span
          className={cn(
            'shrink-0 rounded-full border px-2 py-0.5 font-medium',
            displayStatus === 'Success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
              : displayStatus === 'Error'
                ? 'border-red-500/30 bg-red-500/10 text-red-600'
                : displayStatus === 'Running'
                  ? 'border-accent-primary/30 bg-accent-primary/10 text-accent-primary'
                  : 'border-border bg-bg text-text-secondary',
          )}
        >
          {props.status === 'inProgress'
            ? 'Streaming'
            : props.status === 'executing'
              ? 'Running'
              : displayStatus}
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
        {resultText ? (
          <div className={argumentsText ? 'mt-2' : undefined}>
            <p className="mb-1 font-medium text-text-secondary/80">
              {displayStatus === 'Error' ? 'Error' : 'Result'}
            </p>
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-bg px-2 py-1.5 font-mono text-[11px] leading-relaxed text-text-secondary">
              {truncateToolContent(resultText)}
            </pre>
          </div>
        ) : null}
      </div>
    </details>
  );
}
