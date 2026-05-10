import { HttpAgent } from '@ag-ui/client';
import { CopilotRuntime } from '@copilotkit/runtime';
import { buildMcpAppsConfig } from '@/features/chat/generative-ui/mcp-apps';
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
  });

  const { mcpApps } = buildMcpAppsConfig();

  return new CopilotRuntime({
    agents: {
      zenith: agent,
    },
    a2ui: {
      injectA2UITool: true,
    },
    mcpApps,
  });
};
