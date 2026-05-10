'use client';

import { useRenderTool } from '@copilotkit/react-core/v2';
import { isRecord } from '@/features/chat/lib/message-validation';
import { WildcardToolCard, type WildcardToolStatus } from './tool-card';

type CopilotWildcardRenderProps = {
  name?: string;
  status?: string;
  parameters?: unknown;
  result?: string;
};

function normalizeWildcardStatus(value: unknown): WildcardToolStatus {
  if (typeof value !== 'string') {
    return 'executing';
  }

  const lower = value.toLowerCase();
  if (lower === 'inprogress' || lower === 'in_progress') {
    return 'inProgress';
  }

  if (lower === 'executing') {
    return 'executing';
  }

  if (lower === 'complete') {
    return 'complete';
  }

  return 'executing';
}

/**
 * チャットの agent と同じ `agentId` でマウントすること。
 * `useToolCallRender` が名前一致→ワイルドカードの順で `WildcardToolCard` を解決する。
 */
export function ToolRender() {
  useRenderTool({
    name: '*',
    render: (renderProps: CopilotWildcardRenderProps) => {
      const name = typeof renderProps.name === 'string' ? renderProps.name : 'tool';
      const status = normalizeWildcardStatus(renderProps.status);
      const parameters = isRecord(renderProps.parameters) ? renderProps.parameters : {};
      const result =
        status === 'complete' && typeof renderProps.result === 'string'
          ? renderProps.result
          : undefined;

      return (
        <WildcardToolCard name={name} status={status} parameters={parameters} result={result} />
      );
    },
  });

  return null;
}
