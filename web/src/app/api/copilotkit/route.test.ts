import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  agentUrls: new Map<string, string>(),
  runtimeConfigs: [] as Array<{ agents?: Record<string, unknown> }>,
}));

vi.mock('@ag-ui/client', () => ({
  HttpAgent: class MockHttpAgent {
    constructor({ url }: { url: string }) {
      mocks.agentUrls.set(url, url);
    }
  },
}));

vi.mock('@copilotkit/runtime/langgraph', () => ({
  LangGraphHttpAgent: class MockLangGraphHttpAgent {
    constructor({ url }: { url: string }) {
      mocks.agentUrls.set('lang-chain', url);
    }
  },
}));

vi.mock('@copilotkit/runtime/v2', () => ({
  BuiltInAgent: class MockBuiltInAgent {},
}));

vi.mock('@copilotkit/runtime', () => ({
  CopilotRuntime: class MockCopilotRuntime {
    constructor(config: { agents?: Record<string, unknown> }) {
      mocks.runtimeConfigs.push(config);
    }
  },
  ExperimentalEmptyAdapter: class MockExperimentalEmptyAdapter {},
  copilotRuntimeNextJSAppRouterEndpoint: () => ({
    handleRequest: () => new Response(null, { status: 204 }),
  }),
}));

describe('/api/copilotkit route', () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.agentUrls.clear();
    mocks.runtimeConfigs.length = 0;
    delete process.env.AG_UI_BASE_URL;
  });

  it('registers the LangGraph agent at the mounted /lang-chain AG-UI endpoint', async () => {
    await import('./route');

    expect(mocks.agentUrls.get('lang-chain')).toBe('http://127.0.0.1:8100/lang-chain/ag-ui');
    expect(mocks.runtimeConfigs).toHaveLength(1);
  });
});
