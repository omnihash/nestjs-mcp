// mcp.interface.ts
import { z } from 'zod';

export interface McpTool {
  name: string;
  schema: z.ZodObject<any>;
  handler: (params: any) => Promise<any>;
}

export interface McpModuleOptions {
  name: string;
  version: string;
  description: string;
  tools: McpTool[];
}
