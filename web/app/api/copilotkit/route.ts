import { copilotRuntimeNextJSAppRouterEndpoint } from '@copilotkit/runtime';
import { createCopilotRuntime } from '../../../lib/copilotkit/runtime';

const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
  runtime: createCopilotRuntime(),
  endpoint: '/api/copilotkit',
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handleRequest;
export const POST = handleRequest;
export const OPTIONS = handleRequest;
