export interface CopilotRequestContext {
  sessionId?: string;
  userId?: string;
}

export const createCopilotRequestContext = (): CopilotRequestContext => ({});
