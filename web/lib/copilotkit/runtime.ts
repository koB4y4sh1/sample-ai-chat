import { HttpAgent } from '@ag-ui/client';
import { MCPAppsMiddleware } from '@ag-ui/mcp-apps-middleware';
import { CopilotRuntime } from '@copilotkit/runtime';
import {
  type AgentProvider,
  ANTHROPIC_AGENT_URL,
  LANG_CHAIN_AGENT_URL,
  OPENAI_AGENT_URL,
} from './agents';

export const createCopilotRuntime = (provider: AgentProvider = 'openai') => {
  const agent = new HttpAgent({
    agentId: 'zenith',
    url:
      provider === 'anthropic'
        ? ANTHROPIC_AGENT_URL
        : provider === 'lang-chain'
          ? LANG_CHAIN_AGENT_URL
          : OPENAI_AGENT_URL,
  }).use(
    new MCPAppsMiddleware({
      mcpServers: [{ type: 'http', url: 'http://localhost:8101/mcp', serverId: 'mcp-server' }],
    }),
  );

  return new CopilotRuntime({
    agents: {
      zenith: agent,
    },
  });
};
