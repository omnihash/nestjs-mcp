![Omnihash + Nest](oh_nest.png)

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
yarn add @omnihash/nestjs-mcp
# or
npm install @omnihash/nestjs-mcp
```

## Usage

### 1. Import the Module

There are 3 ways to use the MCP module: using decorators, manual registration or both.

#### Using Decorators (Recommended)

First, create your tool services using decorators:

```typescript
// math-tools.service.ts
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { McpTool, McpTools } from '@omnihash/nestjs-mcp';

@Injectable()
@McpTools('math')
export class MathToolsService {
  @McpTool({
    name: 'add',
    description: 'Add two numbers',
    schema: z.object({
      a: z.number().describe('First number'),
      b: z.number().describe('Second number'),
    }),
  })
  async add({ a, b }: { a: number; b: number }): Promise<number> {
    return a + b;
  }

  @McpTool({
    name: 'multiply',
    description: 'Multiply two numbers',
    schema: z.object({
      a: z.number().describe('First number'),
      b: z.number().describe('Second number'),
    }),
  })
  async multiply({ a, b }: { a: number; b: number }): Promise<number> {
    return a * b;
  }

  @McpTool({
    name: 'divide',
    description: 'Divide two numbers',
    schema: z.object({
      dividend: z.number().describe('The dividend'),
      divisor: z.number().describe('The divisor'),
    }),
  })
  async divide({
    dividend,
    divisor,
  }: {
    dividend: number;
    divisor: number;
  }): Promise<number> {
    if (divisor === 0) {
      throw new Error('Division by zero is not allowed');
    }
    return dividend / divisor;
  }

  @McpTool({
    name: 'sqrt',
    description: 'Calculate square root',
    schema: z.object({
      n: z.number().min(0).describe('Number to find square root of'),
    }),
  })
  async sqrt({ n }: { n: number }): Promise<number> {
    return Math.sqrt(n);
  }

  @McpTool({
    name: 'power',
    description: 'Calculate power',
    schema: z.object({
      base: z.number().describe('Base number'),
      exponent: z.number().describe('Exponent'),
    }),
  })
  async power({
    base,
    exponent,
  }: {
    base: number;
    exponent: number;
  }): Promise<number> {
    return Math.pow(base, exponent);
  }
}

// string-tools.service.ts
@Injectable()
@McpTools('string')
export class StringToolsService {
  @McpTool({
    name: 'reverse',
    description: 'Reverse a string',
    schema: z.object({
      text: z.string().describe('Text to reverse'),
    }),
  })
  async reverse({ text }: { text: string }): Promise<string> {
    return text.split('').reverse().join('');
  }

  @McpTool({
    name: 'wordCount',
    description: 'Count words in text',
    schema: z.object({
      text: z.string().describe('Text to count words in'),
      includeNumbers: z
        .boolean()
        .default(false)
        .describe('Include numbers in word count'),
    }),
  })
  async wordCount({
    text,
    includeNumbers,
  }: {
    text: string;
    includeNumbers: boolean;
  }): Promise<{
    totalWords: number;
    uniqueWords: number;
    wordFrequency: Record<string, number>;
  }> {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const filteredWords = includeNumbers
      ? words
      : words.filter((word) => isNaN(Number(word)));

    const frequency: Record<string, number> = {};
    filteredWords.forEach((word) => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return {
      totalWords: filteredWords.length,
      uniqueWords: Object.keys(frequency).length,
      wordFrequency: frequency,
    };
  }

  @McpTool({
    name: 'capitalize',
    description: 'Capitalize first letter of each word',
    schema: z.object({
      text: z.string().describe('Text to capitalize'),
    }),
  })
  async capitalize({ text }: { text: string }): Promise<string> {
    return text.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  @McpTool({
    name: 'extractEmails',
    description: 'Extract all email addresses from text',
    schema: z.object({
      text: z.string().describe('Text to search for emails'),
    }),
  })
  async extractEmails({ text }: { text: string }): Promise<string[]> {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return text.match(emailRegex) || [];
  }
}

// Create a module to provide your tools
@Module({
  providers: [MathToolsService, StringToolsService],
  exports: [MathToolsService, StringToolsService],
})
export class ToolsModule {}
```

Then in your `app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { McpModule } from '@omnihash/nestjs-mcp';
import { ToolsModule } from './tools/tools.module';

@Module({
  imports: [
    McpModule.forRoot({
      name: 'my-mcp-server',
      version: '1.0.0',
      description: 'My MCP Server Implementation',
    }),
    ToolsModule,
  ],
})
export class AppModule {}
```

#### Manual Registration

Alternatively, you can manually register tools:

```typescript
import { Module } from '@nestjs/common';
import { McpModule } from '@omnihash/nestjs-mcp';
import { z } from 'zod';

@Module({
  imports: [
    McpModule.forRootAsync({
      useFactory: () => ({
        name: 'my-mcp-server',
        version: '1.0.0',
        description: 'MCP server with manual tools',
        tools: [
          {
            name: 'greet',
            schema: z.object({
              name: z.string().describe('Name to greet'),
            }),
            handler: async ({ name }) => {
              return `Hello, ${name}!`;
            },
          },
        ],
      }),
    }),
    // Note: You can also register decorator tools alongside your
    // manual registration by importing your ToolsModule
    ToolsModule,
  ],
})
export class AppModule {}
```

### Available Endpoints

Once the module is imported, the following endpoints will be available:

- `GET /sse` - Establishes an SSE connection
- `POST /messages` - Handles MCP messages
- `GET /health` - Health check endpoint
- `GET /capabilities` - Returns server capabilities

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

## More Examples

## Sample Project Structure

```
src/
  ├── app.module.ts           # Example application module
  ├── main.ts                # Application entry point
  └── tools/                 # Example tool implementations
      ├── api-tools.service.ts
      ├── math-tools.service.ts
      ├── string-tools.service.ts
      └── tools.module.ts
```

#### API Tools

```typescript
// api-tools.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { z } from 'zod';
import { McpTool, McpTools } from '@omnihash/nestjs-mcp';

@Injectable()
@McpTools('api')
export class ApiToolsService {
  @McpTool({
    name: 'getTodoList',
    description: 'Get a todo item by ID',
    schema: z.object({
      id: z.string().describe('Todo list ID'),
    }),
  })
  async getTodoList({ id }: { id: string }): Promise<any> {
    const response = await axios.get(
      `https://jsonplaceholder.typicode.com/todos/${id}`,
    );
    return response.data;
  }
}
```

#### Math Tools (Extended)

```typescript
@McpTool({
  name: 'divide',
  description: 'Divide two numbers',
  schema: z.object({
    dividend: z.number().describe('The dividend'),
    divisor: z.number().describe('The divisor'),
  }),
})
async divide({
  dividend,
  divisor,
}: {
  dividend: number;
  divisor: number;
}): Promise<number> {
  if (divisor === 0) {
    throw new Error('Division by zero is not allowed');
  }
  return dividend / divisor;
}

@McpTool({
  name: 'sqrt',
  description: 'Calculate square root',
  schema: z.object({
    n: z.number().min(0).describe('Number to find square root of'),
  }),
})
async sqrt({ n }: { n: number }): Promise<number> {
  return Math.sqrt(n);
}

@McpTool({
  name: 'power',
  description: 'Calculate power',
  schema: z.object({
    base: z.number().describe('Base number'),
    exponent: z.number().describe('Exponent'),
  }),
})
async power({
  base,
  exponent,
}: {
  base: number;
  exponent: number;
}): Promise<number> {
  return Math.pow(base, exponent);
}
```

#### String Tools (Extended)

```typescript
@McpTool({
  name: 'capitalize',
  description: 'Capitalize first letter of each word',
  schema: z.object({
    text: z.string().describe('Text to capitalize'),
  }),
})
async capitalize({ text }: { text: string }): Promise<string> {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}

@McpTool({
  name: 'extractEmails',
  description: 'Extract all email addresses from text',
  schema: z.object({
    text: z.string().describe('Text to search for emails'),
  }),
})
async extractEmails({ text }: { text: string }): Promise<string[]> {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return text.match(emailRegex) || [];
}
```

## Advanced Usage

### Tool Discovery

The module automatically discovers tools decorated with `@McpTool` in services decorated with `@McpTools`. This means you can organize your tools into logical groups:

```typescript
@Injectable()
@McpTools('math')      // Tools will be prefixed with 'math/'
export class MathTools {
  @McpTool({
    name: 'add',       // Will be available as 'math/add'
    description: '...',
    schema: z.object({...}),
  })
  async add() {...}
}

@Injectable()
@McpTools('string')    // Tools will be prefixed with 'string/'
export class StringTools {
  @McpTool({
    name: 'reverse',   // Will be available as 'string/reverse'
    description: '...',
    schema: z.object({...}),
  })
  async reverse() {...}
}
```

### Error Handling

Tools can throw errors which will be properly formatted in the MCP response:

```typescript
@McpTool({
  name: 'divide',
  schema: z.object({
    dividend: z.number(),
    divisor: z.number(),
  }),
})
async divide({ dividend, divisor }) {
  if (divisor === 0) {
    throw new Error('Division by zero');  // Will be returned as a JSON-RPC error
  }
  return dividend / divisor;
}
```

### Async Configuration

You can use `forRootAsync` for dynamic configuration:

```typescript
@Module({
  imports: [
    McpModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        name: config.get('MCP_SERVER_NAME'),
        version: config.get('MCP_SERVER_VERSION'),
        description: config.get('MCP_SERVER_DESCRIPTION'),
      }),
    }),
  ],
})
export class AppModule {}
```

### Custom Tool Response Types

Tools can return complex objects which will be automatically converted to MCP content:

```typescript
@McpTool({
  name: 'analyze',
  schema: z.object({
    text: z.string(),
  }),
})
async analyze({ text }) {
  return {
    wordCount: text.split(/\s+/).length,
    charCount: text.length,
    sentiment: calculateSentiment(text),
    language: detectLanguage(text),
  };
}
```

## Development

### Prerequisites

- Node.js 18 or later
- npm or yarn

### Setup

1. Clone the repository

```bash
git clone git@github.com:omnihash/nestjs-mcp.git
cd nestjs-mcp
```

2. Install dependencies

```bash
nvm use
```

```bash
yarn install
```

3. Run the example server

```bash
yarn start:dev
```

### Running Tests

```bash
# Unit tests
yarn test

# E2E tests
yarn test:e2e

# Test coverage
yarn test:cov
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Local Development

To develop and test the module locally in another project:

1. Link the package:

```bash
cd nestjs-mcp
npm link
```

2. In your project:

```bash
cd your-project
npm link @omnihash/nestjs-mcp
```

3. Add to your project's `package.json`:

```json
{
  "dependencies": {
    "@omnihash/nestjs-mcp": "*"
  }
}
```
