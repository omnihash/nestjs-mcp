import { Injectable } from '@nestjs/common';
import { McpTool } from './interfaces/mcp-tool.interface';

/**
 * Provider that manages the registration and storage of MCP tools
 */
@Injectable()
export class McpToolsProvider {
  private tools: Map<string, McpTool> = new Map();

  /**
   * Register a single tool
   */
  registerTool(tool: McpTool): void {
    if (this.tools.has(tool.name)) {
      console.warn(`Tool "${tool.name}" is already registered. Overwriting...`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Register multiple tools at once
   */
  registerTools(tools: McpTool[]): void {
    tools.forEach((tool) => this.registerTool(tool));
  }

  /**
   * Get all registered tools
   */
  getTools(): McpTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get a specific tool by name
   */
  getTool(name: string): McpTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Check if a tool is registered
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Remove a tool
   */
  removeTool(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * Clear all tools
   */
  clearTools(): void {
    this.tools.clear();
  }

  /**
   * Get the count of registered tools
   */
  getToolCount(): number {
    return this.tools.size;
  }

  /**
   * Get all tool names
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }
}
