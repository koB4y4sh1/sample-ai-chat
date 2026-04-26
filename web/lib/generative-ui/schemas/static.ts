import { z } from 'zod';

export const metricSchema = z.object({
  label: z.string(),
  value: z.string(),
  delta: z.string().optional(),
});

export const zenithPanelSchema = z.object({
  title: z.string(),
  summary: z.string(),
  tone: z.enum(['neutral', 'positive', 'warning']).default('neutral'),
  metrics: z.array(metricSchema).max(4).default([]),
  nextActions: z.array(z.string()).max(5).default([]),
});

export type ZenithMetric = z.infer<typeof metricSchema>;
export type ZenithPanelArgs = z.infer<typeof zenithPanelSchema>;
