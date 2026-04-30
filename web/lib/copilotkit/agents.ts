import { HttpAgent, type RunAgentInput } from '@ag-ui/client';
import type { ChatControlsState } from '../chat-controls';
import { getModelOption } from '../chat-controls';

const agUiBaseUrl = process.env.AG_UI_BASE_URL ?? 'http://127.0.0.1:8100';
const langChainBaseUrlOverride = process.env.LANG_CHAIN_AGENT_BASE_URL;
const langChainBaseUrl = langChainBaseUrlOverride ?? agUiBaseUrl;
const langChainPath = langChainBaseUrlOverride ? '/' : '/lang-chain/';

export const OPENAI_AGENT_URL = new URL('/mfa/openai', agUiBaseUrl).toString();
export const ANTHROPIC_AGENT_URL = new URL('/mfa/anthropic', agUiBaseUrl).toString();
export const LANG_CHAIN_AGENT_URL = new URL(langChainPath, langChainBaseUrl).toString();

export type AgentProvider = 'openai' | 'anthropic' | 'lang-chain';

let currentProvider: AgentProvider = 'openai';

export const syncAgentProvider = (controls: ChatControlsState) => {
  currentProvider = getModelOption(controls.selectedModel).provider;
};

const resolveProvider = (_input: RunAgentInput): AgentProvider => currentProvider;

export const resolveAgentUrl = (controls: ChatControlsState) => {
  const provider = getModelOption(controls.selectedModel).provider;
  if (provider === 'anthropic') {
    return ANTHROPIC_AGENT_URL;
  }

  if (provider === 'lang-chain') {
    return LANG_CHAIN_AGENT_URL;
  }

  return OPENAI_AGENT_URL;
};

class ProviderRoutedAgent extends HttpAgent {
  private openaiUrl: string;
  private anthropicUrl: string;
  private langChainUrl: string;

  constructor(config: {
    agentId: string;
    openaiUrl: string;
    anthropicUrl: string;
    langChainUrl: string;
  }) {
    super({
      agentId: config.agentId,
      url: config.openaiUrl,
    });
    this.openaiUrl = config.openaiUrl;
    this.anthropicUrl = config.anthropicUrl;
    this.langChainUrl = config.langChainUrl;
  }

  override run(input: RunAgentInput) {
    const provider = resolveProvider(input);
    this.url =
      provider === 'anthropic'
        ? this.anthropicUrl
        : provider === 'lang-chain'
          ? this.langChainUrl
          : this.openaiUrl;
    return super.run(input);
  }

  override clone(): ProviderRoutedAgent {
    const clone = super.clone() as ProviderRoutedAgent;
    clone.openaiUrl = this.openaiUrl;
    clone.anthropicUrl = this.anthropicUrl;
    clone.langChainUrl = this.langChainUrl;
    return clone;
  }
}

export const agents = {
  zenith: new ProviderRoutedAgent({
    agentId: 'zenith',
    openaiUrl: OPENAI_AGENT_URL,
    anthropicUrl: ANTHROPIC_AGENT_URL,
    langChainUrl: LANG_CHAIN_AGENT_URL,
  }),
};
