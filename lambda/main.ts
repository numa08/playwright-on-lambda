import { StreamableHTTPServerTransport } from 'npm:@modelcontextprotocol/sdk/server/streamableHttp.js';
import cors from 'npm:cors';
import express, { type Request, type Response } from 'npm:express';
import { createMCPServer } from './mcp.ts';

const PORT = parseInt(Deno.env.get('PORT') || '8000', 10);

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

const transports = new Map<string, StreamableHTTPServerTransport>();

// Streamable HTTPのエンドポイント
app.post('/mcp', async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string;
  let transport: StreamableHTTPServerTransport;
  if (sessionId && transports.has(sessionId)) {
    console.log('Session found:', sessionId);
    transport = transports.get(sessionId) as StreamableHTTPServerTransport;
  } else {
    const server = await createMCPServer();
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => {
        return crypto.randomUUID();
      },
      onsessioninitialized: sessionId => {
        console.log('Session initialized:', sessionId);
        transports.set(sessionId, transport);
      },
      onsessionclosed: sessionId => {
        console.log('Session closed:', sessionId);
        transports.delete(sessionId);
      },
    });
    await server.connect(transport);
  }

  try {
    res.on('close', () => {
      console.log('Request closed');
    });

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy' });
});

app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
});

// Lambda関数URL用のエクスポート
export default app;
