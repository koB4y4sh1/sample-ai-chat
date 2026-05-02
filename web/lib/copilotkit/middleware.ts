import { buildMcpAppsConfig } from './mcp-apps';

export const copilotRuntimeMiddleware = {
  mcpApps: buildMcpAppsConfig(),
  auth: null,
  logging: null,
};
