'use client';

/**
 * Display-only frontend tool（チャット内に UI のみ表示、副作用は最小）。
 * @see https://docs.copilotkit.ai/microsoft-agent-framework/generative-ui/your-components/display-only
 */
import { useFrontendTool } from '@copilotkit/react-core/v2';
import { z } from 'zod';

const sayHelloParameters = z.object({
  name: z.string().describe('The name of the user to greet'),
});

export function FrontendTool() {
  useFrontendTool({
    name: 'sayHello',
    description:
      'Show a greeting card in the chat. Use when the user asks to greet someone, say hello by name, or similar.',
    parameters: sayHelloParameters,
    followUp: false,
    handler: async ({ name }) => {
      alert(`Hello, ${name}!`);
      return `Said hello to ${name}!`;
    },
    render: ({ args, status }) => (
      <div className="rounded-lg border border-border bg-sidebar-bg p-4 shadow-sm">
        <p className="text-lg font-semibold text-text-primary">Hello, {args.name}!</p>
        <p className="mt-1 text-sm text-text-secondary">
          {status === 'complete' ? 'Shown above in the chat.' : 'Rendering…'}
        </p>
      </div>
    ),
  });

  return null;
}
