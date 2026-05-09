import { copilotRuntimeNextJSAppRouterEndpoint } from '@copilotkit/runtime';
import type { NextRequest } from 'next/server';
import type { AgentProvider } from '@/lib/copilotkit/agents';
import { createCopilotRuntime } from '@/lib/copilotkit/runtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handleRequest(req: NextRequest) {
  const requestedProvider = req.headers.get('x-zenith-provider');
  const provider: AgentProvider =
    requestedProvider === 'anthropic' || requestedProvider === 'lang-chain'
      ? requestedProvider
      : 'openai';
  const { handleRequest: handle } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime: createCopilotRuntime(provider),
    endpoint: '/api/copilotkit',
  });
  return handle(req);
}

export const GET = handleRequest;
export const POST = handleRequest;
export const OPTIONS = handleRequest;
