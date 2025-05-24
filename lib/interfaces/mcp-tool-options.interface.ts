import { z } from 'zod';

export interface McpToolOptions {
  name: string;
  description?: string;
  schema: z.ZodObject<any> | z.ZodType<any>;
}
