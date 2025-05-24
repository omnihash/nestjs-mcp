import { McpTool } from './mcp-tool.interface';

export interface McpModuleOptions {
  name: string;
  version: string;
  description: string;
  tools?: McpTool[];
}
