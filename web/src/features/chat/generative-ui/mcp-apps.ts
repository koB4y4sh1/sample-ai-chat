export const DEFAULT_MCP_APPS_SERVER_URL = 'http://127.0.0.1:8101/mcp';
export const ZENITH_MCP_APPS_SERVER_ID = 'zenith-local-mcp';

type McpAppsConfig = {
  mcpApps: {
    servers: Array<{
      type: 'http';
      url: string;
      serverId: string;
    }>;
  };
};

export const buildMcpAppsConfig = (): McpAppsConfig => ({
  mcpApps: {
    servers: [
      {
        type: 'http',
        url: DEFAULT_MCP_APPS_SERVER_URL,
        serverId: ZENITH_MCP_APPS_SERVER_ID,
      },
    ],
  },
});
