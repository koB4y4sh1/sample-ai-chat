import { HttpAgent } from '@ag-ui/client';
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  ExperimentalEmptyAdapter,
} from '@copilotkit/runtime';
import { LangGraphHttpAgent } from '@copilotkit/runtime/langgraph';
import { BuiltInAgent } from '@copilotkit/runtime/v2';
import type { NextRequest } from 'next/server';

const AGENT_BASE_URL = process.env.AG_UI_BASE_URL ?? 'http://127.0.0.1:8100';

const serviceAdapter = new ExperimentalEmptyAdapter();

const runtime = new CopilotRuntime({
  agents: {
    default: new BuiltInAgent({
      model: 'openai:gpt-5.4-nano',
      prompt: 'You are a helpful assistant.',
      apiKey: process.env.OPENAI_API_KEY ?? '',
      providerOptions: { openai: { reasoningEffort: 'medium' } },
    }),
    'mfa-openai': new HttpAgent({ url: `${AGENT_BASE_URL}/mfa/openai` }),
    'mfa-anthropic': new HttpAgent({ url: `${AGENT_BASE_URL}/mfa/anthropic` }),
    'lang-chain': new LangGraphHttpAgent({ url: `${AGENT_BASE_URL}/lang-chain/ag-ui` }),
  },
});

async function handleRequest(req: NextRequest) {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: '/api/copilotkit',
  });
  return handleRequest(req);
}

export const GET = handleRequest;
export const POST = handleRequest;
export const OPTIONS = handleRequest;
