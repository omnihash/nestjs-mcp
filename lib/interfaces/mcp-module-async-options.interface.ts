import { ModuleMetadata, Type } from '@nestjs/common';
import { McpModuleOptions } from './mcp-module-options.interface';
import { McpOptionsFactory } from './mcp-options-factory.interface';

export interface McpModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useClass?: Type<McpOptionsFactory>;
  useExisting?: Type<McpOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<McpModuleOptions> | McpModuleOptions;
  inject?: any[];
}
