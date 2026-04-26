import { CopilotRuntime } from '@copilotkit/runtime';
import { agents } from './agents';

export const createCopilotRuntime = () =>
  new CopilotRuntime({
    agents,
  });
