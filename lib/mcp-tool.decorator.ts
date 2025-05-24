import 'reflect-metadata';
import { McpToolOptions } from './interfaces/mcp-tool-options.interface';

export const MCP_TOOLS_METADATA = Symbol('mcp:tools');
export const MCP_TOOL_PROVIDER = Symbol('mcp:tool-provider');

/**
 * Decorator to mark a method as an MCP tool
 */
export function McpTool(options: McpToolOptions): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const constructor = target.constructor;
    const existingTools =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      Reflect.getMetadata(MCP_TOOLS_METADATA, constructor) || [];

    existingTools.push({
      ...options,
      methodName: propertyKey,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    Reflect.defineMetadata(MCP_TOOLS_METADATA, existingTools, constructor);

    return descriptor;
  };
}

/**
 * Decorator to mark a class as containing MCP tools
 */
export function McpTools(name?: string): ClassDecorator {
  return (target: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    Reflect.defineMetadata(MCP_TOOL_PROVIDER, name || 'default', target);
  };
}
