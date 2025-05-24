import { McpModuleOptions } from './mcp-module-options.interface';

export interface McpOptionsFactory {
  createMcpOptions(): Promise<McpModuleOptions> | McpModuleOptions;
}
