import { describe, expect, it } from 'vitest';
import { buildMcpAppsConfig } from './mcp-apps';

describe('buildMcpAppsConfig', () => {
  it('registers the local Zenith MCP server for MCP Apps rendering', async () => {
    expect(buildMcpAppsConfig('http://127.0.0.1:8101/mcp')).toEqual({
      servers: [
        {
          type: 'http',
          url: 'http://127.0.0.1:8101/mcp',
          serverId: 'zenith-local-mcp',
        },
      ],
    });
  });
});
