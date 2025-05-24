import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { McpModuleOptions } from './interfaces/mcp-module-options.interface';
import { McpTool } from './interfaces/mcp-tool.interface';
import { McpToolExplorerService } from './mcp-tool-explorer.service';
import { McpToolsProvider } from './mcp-tools.provider';
import { MCP_CONFIG } from './mcp.constants';

@Injectable()
export class McpService
  implements OnModuleInit, OnModuleDestroy, OnApplicationBootstrap
{
  private readonly logger = new Logger(McpService.name);
  // @ts-expect-error uninitialized
  private server: McpServer;
  private transports = {
    streamable: {} as Record<string, StreamableHTTPServerTransport>,
    sse: {} as Record<string, SSEServerTransport>,
  };
  private initialized = false;

  constructor(
    @Inject(MCP_CONFIG) private readonly config: McpModuleOptions,
    private readonly toolsProvider: McpToolsProvider,
    private readonly toolExplorer: McpToolExplorerService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing MCP server...');
    await this.initializeServer();
  }

  async onApplicationBootstrap() {
    this.logger.log('Discovering and registering decorated tools...');
    await this.discoverAndRegisterTools();

    const toolCount = this.toolsProvider.getToolCount();
    this.logger.log(`MCP server ready with ${toolCount} tools`);
  }

  async onModuleDestroy() {
    Object.values(this.transports.streamable).forEach((transport) => {
      if (transport.close) transport.close();
    });
    Object.values(this.transports.sse).forEach((transport) => {
      if (transport.close) transport.close();
    });
  }

  private async initializeServer() {
    this.server = new McpServer({
      name: this.config.name,
      version: this.config.version,
      description: this.config.description,
    });

    // Register tools from config
    if (this.config.tools) {
      this.logger.log(
        `Registering ${this.config.tools.length} tools from config`,
      );
      for (const tool of this.config.tools) {
        this.logger.debug(`[Registering MCP Tool] default:${tool.name}`);
        this.registerTool(tool);
        this.toolsProvider.registerTool(tool);
      }
    }

    this.initialized = true;
  }

  private async discoverAndRegisterTools() {
    const decoratedTools = this.toolExplorer.getDiscoveredTools();

    this.logger.log(`Found ${decoratedTools.length} decorated tools`);
    for (const tool of decoratedTools) {
      this.logger.debug(
        `[Registering MCP Tool] ${tool.serviceName}:${tool.name}`,
      );
      this.registerTool(tool);
      this.toolsProvider.registerTool(tool);
    }
  }

  private registerTool(tool: McpTool) {
    const schema = tool.schema as any;
    const schemaShape = schema.shape || schema._def?.shape || schema;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.server.tool(tool.name, schemaShape, async (params) => {
      try {
        const result = await tool.handler(params);

        if (typeof result === 'object' && result.content) {
          return result;
        }

        return {
          content: [
            {
              type: 'text',
              text:
                typeof result === 'string' ? result : JSON.stringify(result),
            },
          ],
        };
      } catch (error) {
        this.logger.error(`Error in tool ${tool.name}:`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async handleSseGet(req: Request, res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

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

  async handleSessionRequest(req: Request, res: Response) {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (!sessionId || !this.transports.streamable[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }

    const transport = this.transports.streamable[sessionId];
    await transport.handleRequest(req, res);
  }

  getRegisteredTools() {
    return this.toolsProvider.getTools();
  }

  getServerInfo() {
    return {
      name: this.config.name,
      version: this.config.version,
      description: this.config.description,
      toolCount: this.toolsProvider.getToolCount(),
      tools: this.toolsProvider.getToolNames(),
    };
  }
}
