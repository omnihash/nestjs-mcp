// calculator-tools.service.ts
import { Injectable } from '@nestjs/common';
import { McpTool, McpTools } from '@omnihash/nestjs-mcp';
import { z } from 'zod';

// Define the output schema type
const CalculationResult = z.object({
  result: z.number(),
  operation: z.string(),
  timestamp: z.string(),
});

@Injectable()
@McpTools('calculator')
export class CalculatorToolsService {
  @McpTool({
    name: 'add',
    description: 'Add two numbers with output validation',
    schema: z.object({
      a: z.number().describe('First number'),
      b: z.number().describe('Second number'),
    }),
    outputSchema: CalculationResult,
  })
  async add({ a, b }: { a: number; b: number }) {
    const result = a + b;
    return {
      result,
      operation: 'addition',
      timestamp: new Date().toISOString(),
    };
  }

  @McpTool({
    name: 'divide',
    description: 'Divide two numbers with output validation and error handling',
    schema: z.object({
      dividend: z.number().describe('The number to be divided'),
      divisor: z.number().describe('The number to divide by'),
    }),
    outputSchema: z.object({
      result: z.number(),
      operation: z.string(),
      timestamp: z.string(),
      warning: z.string().optional(),
    }),
  })
  async divide({ dividend, divisor }: { dividend: number; divisor: number }) {
    if (divisor === 0) {
      throw new Error('Division by zero is not allowed');
    }

    const result = dividend / divisor;
    return {
      result,
      operation: 'division',
      timestamp: new Date().toISOString(),
      ...(Number.isFinite(result)
        ? {}
        : { warning: 'Result might be imprecise' }),
    };
  }

  @McpTool({
    name: 'stats',
    description: 'Calculate statistics with complex output schema',
    schema: z.object({
      numbers: z
        .array(z.number())
        .min(1)
        .describe('Array of numbers to analyze'),
    }),
    outputSchema: z.object({
      results: z.object({
        sum: z.number(),
        average: z.number(),
        min: z.number(),
        max: z.number(),
        count: z.number(),
      }),
      metadata: z.object({
        processedAt: z.string(),
        duration: z.number(),
      }),
    }),
  })
  async stats({ numbers }: { numbers: number[] }) {
    const startTime = Date.now();

    const results = {
      sum: numbers.reduce((a, b) => a + b, 0),
      average: numbers.reduce((a, b) => a + b, 0) / numbers.length,
      min: Math.min(...numbers),
      max: Math.max(...numbers),
      count: numbers.length,
    };

    return {
      results,
      metadata: {
        processedAt: new Date().toISOString(),
        duration: Date.now() - startTime,
      },
    };
  }
}
