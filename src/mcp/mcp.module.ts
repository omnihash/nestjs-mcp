// mcp.module.ts
import { DynamicModule, Module } from '@nestjs/common';
import { MCP_CONFIG } from './mcp.constants';
import { McpController } from './mcp.controller';
import { McpModuleOptions } from './mcp.interface';
import { McpService } from './mcp.service';

@Module({})
export class McpModule {
  static forRoot(options: McpModuleOptions): DynamicModule {
    return {
      module: McpModule,
      controllers: [McpController],
      providers: [
        {
          provide: MCP_CONFIG,
          useValue: options,
        },
        McpService,
      ],
      exports: [McpService],
    };
  }
}

// mcp.const
