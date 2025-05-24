# NestJS MCP (Model Context Protocol) Module

A NestJS module for implementing Model Context Protocol servers. This module provides a robust integration of the MCP protocol into NestJS applications, supporting Server-Sent Events (SSE) for real-time communication and tool execution.

## Features

- 🔄 Server-Sent Events (SSE) support
- 🛠️ Tool registration and execution
- 📝 JSON-RPC message format
- ❤️ Heartbeat mechanism
- ✅ Zod schema validation
- 🚀 Easy integration with NestJS

## Installation

```bash
npm install @omnihash/nestjs-mcp
```

## Usage

### 1. Import the Module

In your `app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { McpModule } from '@omnihash/nestjs-mcp';
import { z } from 'zod';

@Module({
  imports: [
    McpModule.forRoot({
      name: 'my-mcp-server',
      version: '1.0.0',
      description: 'My MCP Server Implementation',
      tools: [
        {
          name: 'add',
          schema: z.object({
            a: z.number().describe('First number'),
            b: z.number().describe('Second number'),
          }),
          handler: async ({ a, b }) => {
            return a + b;
          },
        },
        {
          name: 'multiply',
          schema: z.object({
            a: z.number().describe('First number'),
            b: z.number().describe('Second number'),
          }),
          handler: async ({ a, b }) => {
            return a * b;
          },
        },
      ],
    }),
  ],
})
export class AppModule {}
```

### 2. Available Endpoints

Once the module is imported, the following endpoints will be available:

- `GET /sse` - Establishes an SSE connection
- `POST /messages` - Handles MCP messages
- `GET /health` - Health check endpoint
- `GET /capabilities` - Returns server capabilities

### 3. Making Requests

To make a request to a tool:

```json
POST /messages
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "tools/call/add",
  "params": {
    "a": 5,
    "b": 3
  }
}
```

Response:

```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "8"
      }
    ]
  }
}
```

### 4. SSE Connection

To establish an SSE connection:

```typescript
const eventSource = new EventSource('/sse');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

eventSource.onerror = (error) => {
  console.error('SSE Error:', error);
};
```

## Configuration Options

The `McpModule.forRoot()` method accepts the following options:

```typescript
interface McpModuleOptions {
  name: string; // Server name
  version: string; // Server version
  description: string; // Server description
  tools: McpTool[]; // Array of tools
}

interface McpTool {
  name: string; // Tool name
  schema: z.ZodObject; // Zod schema for input validation
  handler: (params: any) => Promise<any>; // Tool implementation
}
```

## License

MIT
