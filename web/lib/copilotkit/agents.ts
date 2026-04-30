import { HttpAgent, type RunAgentInput } from '@ag-ui/client';
import type { ChatControlsState } from '../chat-controls';
import { getModelOption } from '../chat-controls';

const agUiBaseUrl = process.env.AG_UI_BASE_URL ?? 'http://127.0.0.1:8100';

export const OPENAI_AGENT_URL = new URL('/copilotkit', agUiBaseUrl).toString();
export const ANTHROPIC_AGENT_URL = new URL('/copilotkit/anthropic', agUiBaseUrl).toString();

let currentProvider: 'openai' | 'anthropic' = 'openai';

export const syncAgentProvider = (controls: ChatControlsState) => {
  currentProvider = getModelOption(controls.selectedModel).provider;
};

const resolveProvider = (_input: RunAgentInput): 'openai' | 'anthropic' => currentProvider;

export const resolveAgentUrl = (controls: ChatControlsState) =>
  getModelOption(controls.selectedModel).provider === 'anthropic'
    ? ANTHROPIC_AGENT_URL
    : OPENAI_AGENT_URL;

class ProviderRoutedAgent extends HttpAgent {
  private openaiUrl: string;
  private anthropicUrl: string;

  constructor(config: { agentId: string; openaiUrl: string; anthropicUrl: string }) {
    super({
      agentId: config.agentId,
      url: config.openaiUrl,
    });
    this.openaiUrl = config.openaiUrl;
    this.anthropicUrl = config.anthropicUrl;
  }

  override run(input: RunAgentInput) {
    this.url = resolveProvider(input) === 'anthropic' ? this.anthropicUrl : this.openaiUrl;
    return super.run(input);
  }

  override clone(): ProviderRoutedAgent {
    const clone = super.clone() as ProviderRoutedAgent;
    clone.openaiUrl = this.openaiUrl;
    clone.anthropicUrl = this.anthropicUrl;
    return clone;
  }
}

export const agents = {
  zenith: new ProviderRoutedAgent({
    agentId: 'zenith',
    openaiUrl: OPENAI_AGENT_URL,
    anthropicUrl: ANTHROPIC_AGENT_URL,
  }),
};
