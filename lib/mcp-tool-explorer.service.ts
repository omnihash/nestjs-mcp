import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { McpTool } from './interfaces/mcp-tool.interface';
import { MCP_TOOLS_METADATA, MCP_TOOL_PROVIDER } from './mcp-tool.decorator';

@Injectable()
export class McpToolExplorerService implements OnModuleInit {
  private discoveredTools: McpTool[] = [];

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {}

  onModuleInit() {
    this.explore();
  }

  explore(): McpTool[] {
    const providers = this.discoveryService.getProviders();
    const tools: McpTool[] = [];

    providers.forEach((wrapper: InstanceWrapper) => {
      const { instance, metatype } = wrapper;

      if (!instance || !metatype || typeof instance !== 'object') {
        return;
      }

      // Check if class is marked as tool provider
      const toolProviderName = Reflect.getMetadata(MCP_TOOL_PROVIDER, metatype);
      if (!toolProviderName) {
        return;
      }

      // Get tool metadata
      const toolsMetadata =
        Reflect.getMetadata(MCP_TOOLS_METADATA, metatype) || [];

      toolsMetadata.forEach((toolMeta: any) => {
        const handler = instance[toolMeta.methodName];
        if (typeof handler === 'function') {
          tools.push({
            serviceName: toolProviderName,
            name: toolMeta.name,
            description: toolMeta.description,
            schema: toolMeta.schema,
            handler: handler.bind(instance),
          });
        }
      });
    });

    this.discoveredTools = tools;
    return tools;
  }

  getDiscoveredTools(): McpTool[] {
    return this.discoveredTools;
  }
}
