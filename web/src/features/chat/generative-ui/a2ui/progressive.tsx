'use client';

import { useRenderTool } from '@copilotkit/react-core/v2';
import { memo } from 'react';
import { z } from 'zod';

// 1. Props定義の作成
interface A2UIProgressProps {
  parameters: Record<string, unknown>;
}

// 2. コンポーネントの作成
const A2UIProgress = memo(function A2UIProgress({ parameters }: A2UIProgressProps) {
  // LLM がデータをストリーミングするにつれて、`parameters.components` および `parameters.items`に順次データが格納されていきます。
  const componentCount = Array.isArray(parameters?.components) ? parameters.components.length : 0;
  const itemCount = Array.isArray(parameters?.items) ? parameters.items.length : 0;
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        <span>Building interface...</span>
      </div>
      {componentCount > 0 && (
        <p className="mt-2 text-xs text-gray-500">
          {componentCount} components, {itemCount} items
        </p>
      )}
    </div>
  );
});

// 3. フックの作成
export function useA2UIProgress() {
  useRenderTool(
    {
      name: 'render_a2ui',
      parameters: z.any(),
      render: ({ status, parameters }) => {
        // A2UI レンダリング完了時は非表示にする
        if (status === 'complete') return null;
        return <A2UIProgress parameters={parameters ?? {}} />;
      },
    },
    [],
  );
}
