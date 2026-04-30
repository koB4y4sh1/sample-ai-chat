import { HttpAgent } from '@ag-ui/client';
import { CopilotRuntime } from '@copilotkit/runtime';
import { ANTHROPIC_AGENT_URL, OPENAI_AGENT_URL } from './agents';

export const createCopilotRuntime = (provider: 'openai' | 'anthropic' = 'openai') => {
  const agentUrl = provider === 'anthropic' ? ANTHROPIC_AGENT_URL : OPENAI_AGENT_URL;
  return new CopilotRuntime({
    agents: {
      zenith: new HttpAgent({ agentId: 'zenith', url: agentUrl }),
    },
  });
};
