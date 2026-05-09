import { describe, expect, it } from 'vitest';
import type { ChatControlsState } from '../chat-controls';
import { LANG_CHAIN_AGENT_URL, resolveAgentUrl } from './agents';

describe('resolveAgentUrl', () => {
  it('keeps the LangGraph model on the general LangGraph endpoint', () => {
    const controls: ChatControlsState = {
      selectedModel: 'lang-chain',
      selectedTools: [],
    };

    expect(resolveAgentUrl(controls)).toBe(LANG_CHAIN_AGENT_URL);
  });
});
