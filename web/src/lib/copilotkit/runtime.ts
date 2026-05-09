import { HttpAgent } from '@ag-ui/client';
import { MCPAppsMiddleware } from '@ag-ui/mcp-apps-middleware';
import { CopilotRuntime } from '@copilotkit/runtime';
import {
  type AgentProvider,
  ANTHROPIC_AGENT_URL,
  LANG_CHAIN_AGENT_URL,
  OPENAI_AGENT_URL,
} from './agents';

export const DEFAULT_MCP_APPS_SERVER_URL = 'http://127.0.0.1:8101/mcp';
export const ZENITH_MCP_APPS_SERVER_ID = 'zenith-local-mcp';

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
      mcpServers: [
        {
          type: 'http',
          url: DEFAULT_MCP_APPS_SERVER_URL,
          serverId: ZENITH_MCP_APPS_SERVER_ID,
        },
      ],
    }),
  );

  return new CopilotRuntime({
    agents: {
      zenith: agent,
    },
  });
};
