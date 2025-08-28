import { McpServer } from 'npm:@modelcontextprotocol/sdk@1.17.4/server/mcp.js';

export function createMCPServer(): McpServer {
  const server = new McpServer({
    name: 'lambda-mcp-server',
    version: '1.0.0',
  });

  server.registerTool(
    'get_time',
    {
      title: 'Get current time',
    },
    () => {
      return {
        content: [
          {
            type: 'text',
            text: new Date().toISOString(),
          },
        ],
      };
    }
  );

  return server;
}
