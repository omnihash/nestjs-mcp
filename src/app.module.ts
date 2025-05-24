import { Module } from '@nestjs/common';
import axios from 'axios';
import { z } from 'zod';
import { McpModule } from './mcp/mcp.module';

@Module({
  imports: [
    McpModule.forRoot({
      name: 'math-and-todos',
      version: '1.0.0',
      description:
        'A server that provides math calculation tools and todo list retrieval',
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
        {
          name: 'getTodoList',
          schema: z.object({
            id: z.string().describe('Todo list ID'),
          }),
          handler: async ({ id }) => {
            const result = await axios.get(
              `https://jsonplaceholder.typicode.com/todos/${id}`,
            );
            return JSON.stringify(result.data);
          },
        },
      ],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
