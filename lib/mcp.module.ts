import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import {
  DiscoveryModule,
  DiscoveryService,
  MetadataScanner,
  Reflector,
} from '@nestjs/core';
import { McpModuleAsyncOptions } from './interfaces/mcp-module-async-options.interface';
import { McpModuleOptions } from './interfaces/mcp-module-options.interface';
import { McpToolExplorerService } from './mcp-tool-explorer.service';
import { McpToolsProvider } from './mcp-tools.provider';
import { MCP_CONFIG } from './mcp.constants';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';

@Global()
@Module({})
export class McpModule {
  static forRoot(options: McpModuleOptions): DynamicModule {
    return {
      module: McpModule,
      imports: [DiscoveryModule],
      controllers: [McpController],
      providers: [
        {
          provide: MCP_CONFIG,
          useValue: options,
        },
        McpService,
        McpToolsProvider,
        McpToolExplorerService,
        DiscoveryService,
        MetadataScanner,
        Reflector,
      ],
      exports: [McpService, McpToolsProvider, McpToolExplorerService],
      global: true,
    };
  }

  static forRootAsync(options: McpModuleAsyncOptions): DynamicModule {
    const providers: Provider[] = [
      ...this.createAsyncProviders(options),
      McpService,
      McpToolsProvider,
      McpToolExplorerService,
      DiscoveryService,
      MetadataScanner,
      Reflector,
    ];

    return {
      module: McpModule,
      imports: [DiscoveryModule, ...(options.imports || [])],
      controllers: [McpController],
      providers,
      exports: [McpService, McpToolsProvider, McpToolExplorerService],
      global: true,
    };
  }

  private static createAsyncProviders(
    options: McpModuleAsyncOptions,
  ): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: MCP_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
      ];
    }

    return [
      {
        provide: MCP_CONFIG,
        useFactory: async (optionsFactory: any) => {
          return await optionsFactory.createMcpOptions();
        },
        inject: [options.useClass, options.useExisting].filter(
          (v): v is NonNullable<typeof v> => v !== undefined,
        ),
      },
    ];
  }
}
