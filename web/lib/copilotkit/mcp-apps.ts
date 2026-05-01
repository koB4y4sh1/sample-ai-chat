export const DEFAULT_MCP_APPS_SERVER_URL = 'http://127.0.0.1:8101/mcp';
export const ZENITH_MCP_APPS_SERVER_ID = 'zenith-local-mcp';

type ZenithMcpAppsConfig = {
  servers: Array<{
    type: 'http';
    url: string;
    serverId: string;
  }>;
};

export const buildMcpAppsConfig = (url = process.env.MCP_SERVER_URL): ZenithMcpAppsConfig => ({
  servers: [
    {
      type: 'http',
      url: url || DEFAULT_MCP_APPS_SERVER_URL,
      serverId: ZENITH_MCP_APPS_SERVER_ID,
    },
  ],
});
