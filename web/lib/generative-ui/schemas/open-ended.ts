import { z } from 'zod';

export const showMcpAppSchema = z.object({
  appId: z.enum(['project-dashboard', 'data-table', 'workflow-board']),
  title: z.string(),
  prompt: z.string().optional(),
  height: z.number().int().min(280).max(720).default(420),
});

export type ShowMcpAppArgs = z.infer<typeof showMcpAppSchema>;
