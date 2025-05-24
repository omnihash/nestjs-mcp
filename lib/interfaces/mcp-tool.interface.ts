import { z } from 'zod';

export interface McpTool {
  serviceName?: string;
  name: string;
  description?: string;
  schema: z.ZodObject<any> | z.ZodType<any>;
  handler: (params: any) => Promise<any>;
}
