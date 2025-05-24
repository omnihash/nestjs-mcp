// mcp.service.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { MCP_CONFIG } from './mcp.constants';
import { McpModuleOptions } from './mcp.interface';

@Injectable()
export class McpService implements OnModuleInit, OnModuleDestroy {
  private server: McpServer;
  private transports = {
    streamable: {} as Record<string, StreamableHTTPServerTransport>,
    sse: {} as Record<string, SSEServerTransport>,
  };

  constructor(@Inject(MCP_CONFIG) private readonly config: McpModuleOptions) {}

  async onModuleInit() {
    await this.initializeServer();
  }

  async onModuleDestroy() {
    // Clean up all transports
    Object.values(this.transports.streamable).forEach((transport) => {
      if (transport.close) transport.close();
    });
    Object.values(this.transports.sse).forEach((transport) => {
      if (transport.close) transport.close();
    });
  }

  private async initializeServer() {
    // Create MCP server with provided config
    this.server = new McpServer({
      name: this.config.name,
      version: this.config.version,
      description: this.config.description,
    });

    // Register all tools
    for (const tool of this.config.tools) {
      // @ts-expect-error unsafe any
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      this.server.tool(tool.name, tool.schema.shape, async (params) => {
        const result = await tool.handler(params);
        return {
          content: [{ type: 'text', text: String(result) }],
        };
      });
    }
  }

  async handleMcpPost(req: Request, res: Response) {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && this.transports.streamable[sessionId]) {
      transport = this.transports.streamable[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId) => {
          this.transports.streamable[sessionId] = transport;
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          delete this.transports.streamable[transport.sessionId];
        }
      };

      await this.server.connect(transport);
    } else {
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      });
      return;
    }

    await transport.handleRequest(req, res, req.body);
  }

  async handleSseGet(req: Request, res: Response) {
    const transport = new SSEServerTransport('/messages', res);
    this.transports.sse[transport.sessionId] = transport;

    res.on('close', () => {
      delete this.transports.sse[transport.sessionId];
    });

    await this.server.connect(transport);
  }

  async handleMessages(req: Request, res: Response) {
    const sessionId = req.query.sessionId as string;
    const transport = this.transports.sse[sessionId];

    if (transport) {
      await transport.handlePostMessage(req, res, req.body);
    } else {
      res.status(400).send('No transport found for sessionId');
    }
  }

  async handleSessionRequest(req: Request, res: Response) {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (!sessionId || !this.transports.streamable[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }

    const transport = this.transports.streamable[sessionId];
    await transport.handleRequest(req, res);
  }
}
