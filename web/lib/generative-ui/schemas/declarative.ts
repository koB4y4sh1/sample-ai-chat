import { z } from 'zod';

export const uiBlockSchema = z.object({
  type: z
    .enum([
      'metric_grid',
      'list',
      'table',
      'callout',
      'actions',
      'text',
      'divider',
      'key_value',
      'progress',
      'checklist',
      'timeline',
      'comparison',
      'risk_matrix',
      'decision',
      'tabs',
      'accordion',
      'quote',
      'status_strip',
      'flight_card',
      'sales_funnel',
    ])
    .describe('The UI block type to render.'),
  title: z.string().optional().describe('Optional block title.'),
  tone: z.enum(['neutral', 'positive', 'warning']).optional().describe('Block tone.'),
  body: z.string().optional().describe('Main body text.'),
  subtitle: z.string().optional().describe('Secondary title or supporting text.'),
  verdict: z.string().optional().describe('Decision or final result label.'),
  ordered: z.boolean().optional().describe('Whether a list block should be ordered.'),
  items: z
    .array(
      z.object({
        label: z.string().optional(),
        value: z.string().optional(),
        delta: z.string().optional(),
        text: z.string().optional(),
        description: z.string().optional(),
        status: z.string().optional(),
        tone: z.enum(['neutral', 'positive', 'warning']).optional(),
        percent: z.number().min(0).max(100).optional(),
        from: z.string().optional(),
        to: z.string().optional(),
        owner: z.string().optional(),
        priority: z.string().optional(),
        likelihood: z.string().optional(),
        impact: z.string().optional(),
        score: z.string().optional(),
      }),
    )
    .optional()
    .describe('Reusable block items. Fields are interpreted by block type.'),
  columns: z.array(z.string()).optional().describe('Table column labels.'),
  rows: z.array(z.array(z.string())).optional().describe('Table rows.'),
  actions: z
    .array(
      z.object({
        label: z.string(),
        description: z.string().optional(),
      }),
    )
    .optional()
    .describe('Action items for an actions block.'),
});

export const uiSpecSchema = z.object({
  version: z.literal('1').describe('The UI schema version. Always use "1".'),
  title: z.string().describe('The title of the rendered UI.'),
  summary: z.string().optional().describe('Short summary shown under the title.'),
  blocks: z.array(uiBlockSchema).min(1).max(8).describe('UI blocks to render.'),
});

export const showUiSpecSchema = uiSpecSchema;

export type MetricGridBlock = {
  type: 'metric_grid';
  title?: string;
  items: Array<{
    label: string;
    value: string;
    delta?: string;
  }>;
};

export type ListBlock = {
  type: 'list';
  title?: string;
  ordered?: boolean;
  items: string[];
};

export type TableBlock = {
  type: 'table';
  title?: string;
  columns: string[];
  rows: string[][];
};

export type CalloutBlock = {
  type: 'callout';
  tone: 'neutral' | 'positive' | 'warning';
  title?: string;
  body: string;
};

export type ActionsBlock = {
  type: 'actions';
  title?: string;
  actions: Array<{
    label: string;
    description?: string;
  }>;
};

export type TextBlock = {
  type: 'text';
  title?: string;
  body: string;
};

export type DividerBlock = {
  type: 'divider';
  title?: string;
};

export type KeyValueBlock = {
  type: 'key_value';
  title?: string;
  items: Array<{
    label: string;
    value: string;
    description?: string;
  }>;
};

export type ProgressBlock = {
  type: 'progress';
  title?: string;
  items: Array<{
    label: string;
    value?: string;
    percent: number;
    tone?: 'neutral' | 'positive' | 'warning';
  }>;
};

export type ChecklistBlock = {
  type: 'checklist';
  title?: string;
  items: Array<{
    label: string;
    description?: string;
    status?: string;
  }>;
};

export type TimelineBlock = {
  type: 'timeline';
  title?: string;
  items: Array<{
    label: string;
    description?: string;
    status?: string;
  }>;
};

export type ComparisonBlock = {
  type: 'comparison';
  title?: string;
  items: Array<{
    label: string;
    from: string;
    to: string;
    description?: string;
  }>;
};

export type RiskMatrixBlock = {
  type: 'risk_matrix';
  title?: string;
  items: Array<{
    label: string;
    likelihood?: string;
    impact?: string;
    score?: string;
    tone?: 'neutral' | 'positive' | 'warning';
  }>;
};

export type DecisionBlock = {
  type: 'decision';
  title?: string;
  verdict: string;
  body?: string;
  tone?: 'neutral' | 'positive' | 'warning';
};

export type TabsBlock = {
  type: 'tabs';
  title?: string;
  items: Array<{
    label: string;
    body: string;
  }>;
};

export type AccordionBlock = {
  type: 'accordion';
  title?: string;
  items: Array<{
    label: string;
    body: string;
  }>;
};

export type QuoteBlock = {
  type: 'quote';
  title?: string;
  body: string;
  subtitle?: string;
};

export type StatusStripBlock = {
  type: 'status_strip';
  title?: string;
  items: Array<{
    label: string;
    value: string;
    tone?: 'neutral' | 'positive' | 'warning';
  }>;
};

export type FlightCardBlock = {
  type: 'flight_card';
  title?: string;
  from: string;
  to: string;
  status?: string;
  body?: string;
};

export type SalesFunnelBlock = {
  type: 'sales_funnel';
  title?: string;
  items: Array<{
    label: string;
    value: string;
    percent?: number;
  }>;
};

export type UIBlock =
  | MetricGridBlock
  | ListBlock
  | TableBlock
  | CalloutBlock
  | ActionsBlock
  | TextBlock
  | DividerBlock
  | KeyValueBlock
  | ProgressBlock
  | ChecklistBlock
  | TimelineBlock
  | ComparisonBlock
  | RiskMatrixBlock
  | DecisionBlock
  | TabsBlock
  | AccordionBlock
  | QuoteBlock
  | StatusStripBlock
  | FlightCardBlock
  | SalesFunnelBlock;

export type UISpec = {
  version: '1';
  title: string;
  summary?: string;
  blocks: UIBlock[];
};

export type ShowUiSpecArgs = z.infer<typeof showUiSpecSchema>;
