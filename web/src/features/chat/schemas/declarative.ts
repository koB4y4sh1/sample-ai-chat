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
      'flight_options',
      'sales_funnel',
      'sales_dashboard',
      'answer_card',
      'source_list',
      'task_plan',
      'confirmation_panel',
      'form_fill',
      'choice_picker',
      'diff_preview',
      'diff',
      'text_diff',
      'revision_diff',
      'proofreading_diff',
      'error_diagnosis',
      'file_attachment_card',
      'progress_tracker',
    ])
    .describe('The UI block type to render.'),
  title: z.string().optional().describe('Optional block title.'),
  tone: z.enum(['neutral', 'positive', 'warning']).optional().describe('Block tone.'),
  body: z.string().optional().describe('Main body text.'),
  description: z.string().optional().describe('Optional supporting text.'),
  subtitle: z.string().optional().describe('Secondary title or supporting text.'),
  verdict: z.string().optional().describe('Decision or final result label.'),
  ordered: z.boolean().optional().describe('Whether a list block should be ordered.'),
  severity: z.string().optional().describe('Severity label for diagnostic blocks.'),
  cause: z.string().optional().describe('Cause text for diagnostic blocks.'),
  reproduction: z.string().optional().describe('Reproduction steps for diagnostic blocks.'),
  fix: z.string().optional().describe('Fix text for diagnostic blocks.'),
  before: z.string().optional().describe('Before content for diff preview blocks.'),
  after: z.string().optional().describe('After content for diff preview blocks.'),
  from: z.string().optional().describe('Before value alias for diff and comparison blocks.'),
  to: z.string().optional().describe('After value alias for diff and comparison blocks.'),
  original: z.string().optional().describe('Original content alias for diff preview blocks.'),
  input: z.string().optional().describe('Input content alias for diff preview blocks.'),
  source: z.string().optional().describe('Source content alias for diff preview blocks.'),
  current: z.string().optional().describe('Current content alias for diff preview blocks.'),
  revised: z.string().optional().describe('Revised content alias for diff preview blocks.'),
  corrected: z.string().optional().describe('Corrected content alias for diff preview blocks.'),
  edited: z.string().optional().describe('Edited content alias for diff preview blocks.'),
  proposed: z.string().optional().describe('Proposed content alias for diff preview blocks.'),
  output: z.string().optional().describe('Output content alias for diff preview blocks.'),
  updated: z.string().optional().describe('Updated content alias for diff preview blocks.'),
  oldText: z.string().optional().describe('Old text alias for diff preview blocks.'),
  newText: z.string().optional().describe('New text alias for diff preview blocks.'),
  language: z.string().optional().describe('Language label for code or diff blocks.'),
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
        id: z.string().optional(),
        airline: z.string().optional(),
        airlineLogo: z.string().optional(),
        flightNumber: z.string().optional(),
        origin: z.string().optional(),
        destination: z.string().optional(),
        date: z.string().optional(),
        departureTime: z.string().optional(),
        arrivalTime: z.string().optional(),
        duration: z.string().optional(),
        price: z.string().optional(),
        customer: z.string().optional(),
        region: z.string().optional(),
        total: z.string().optional(),
        url: z.string().optional(),
        path: z.string().optional(),
        line: z.string().optional(),
        fileName: z.string().optional(),
        filePath: z.string().optional(),
        mimeType: z.string().optional(),
        size: z.string().optional(),
        severity: z.string().optional(),
        cause: z.string().optional(),
        reproduction: z.string().optional(),
        fix: z.string().optional(),
        before: z.string().optional(),
        after: z.string().optional(),
        original: z.string().optional(),
        input: z.string().optional(),
        source: z.string().optional(),
        current: z.string().optional(),
        revised: z.string().optional(),
        corrected: z.string().optional(),
        edited: z.string().optional(),
        proposed: z.string().optional(),
        output: z.string().optional(),
        updated: z.string().optional(),
        oldText: z.string().optional(),
        newText: z.string().optional(),
        body: z.string().optional(),
        language: z.string().optional(),
        required: z.boolean().optional(),
        placeholder: z.string().optional(),
        inputType: z.string().optional(),
        checked: z.boolean().optional(),
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
        tone: z.enum(['neutral', 'positive', 'warning']).optional(),
        variant: z.enum(['primary', 'secondary', 'danger']).optional(),
      }),
    )
    .optional()
    .describe('Action items for an actions block.'),
  periodTitle: z.string().optional().describe('Sales dashboard period title.'),
  dateRange: z.string().optional().describe('Sales dashboard date range.'),
  kpis: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
        subtitle: z.string().optional(),
        trend: z.enum(['up', 'down', 'neutral']).optional(),
        trendValue: z.string().optional(),
      }),
    )
    .optional()
    .describe('KPI cards for a sales dashboard.'),
  regionData: z
    .array(
      z.object({
        label: z.string(),
        value: z.number().min(0).max(100),
        color: z.string().optional(),
      }),
    )
    .optional()
    .describe('Revenue share by region.'),
  monthlyData: z
    .array(
      z.object({
        label: z.string(),
        value: z.number().min(0),
      }),
    )
    .optional()
    .describe('Monthly values for a compact bar chart.'),
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

export type FlightOptionsBlock = {
  type: 'flight_options';
  title?: string;
  items: Array<{
    id?: string;
    airline: string;
    airlineLogo?: string;
    flightNumber: string;
    origin: string;
    destination: string;
    date: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    status: string;
    price: string;
  }>;
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

export type SalesDashboardBlock = {
  type: 'sales_dashboard';
  title: string;
  dateRange?: string;
  kpis: Array<{
    label: string;
    value: string;
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
  }>;
  regionData: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  monthlyData: Array<{
    label: string;
    value: number;
  }>;
  orders: Array<{
    id: string;
    customer: string;
    region: string;
    total: string;
    status: string;
  }>;
};

export type AnswerCardBlock = {
  type: 'answer_card';
  title?: string;
  body: string;
  tone?: 'neutral' | 'positive' | 'warning';
  items?: Array<{
    label: string;
    description?: string;
  }>;
};

export type SourceListBlock = {
  type: 'source_list';
  title?: string;
  items: Array<{
    label: string;
    url?: string;
    path?: string;
    line?: string;
    description?: string;
  }>;
};

export type TaskPlanBlock = {
  type: 'task_plan';
  title?: string;
  items: Array<{
    label: string;
    status?: string;
    owner?: string;
    description?: string;
  }>;
};

export type ConfirmationPanelBlock = {
  type: 'confirmation_panel';
  title?: string;
  body: string;
  tone?: 'neutral' | 'positive' | 'warning';
  actions: Array<{
    label: string;
    description?: string;
    tone?: 'neutral' | 'positive' | 'warning';
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
};

export type FormFillBlock = {
  type: 'form_fill';
  title?: string;
  items: Array<{
    label: string;
    value?: string;
    placeholder?: string;
    inputType?: string;
    required?: boolean;
    status?: string;
  }>;
};

export type ChoicePickerBlock = {
  type: 'choice_picker';
  title?: string;
  items: Array<{
    label: string;
    description?: string;
    status?: string;
    tone?: 'neutral' | 'positive' | 'warning';
  }>;
};

export type DiffPreviewBlock = {
  type: 'diff_preview';
  title?: string;
  items: Array<{
    label: string;
    before: string;
    after: string;
    language?: string;
    description?: string;
  }>;
};

export type ErrorDiagnosisBlock = {
  type: 'error_diagnosis';
  title?: string;
  body?: string;
  items: Array<{
    label: string;
    severity?: string;
    cause?: string;
    reproduction?: string;
    fix?: string;
    description?: string;
  }>;
};

export type FileAttachmentCardBlock = {
  type: 'file_attachment_card';
  title?: string;
  items: Array<{
    label: string;
    fileName?: string;
    filePath?: string;
    mimeType?: string;
    size?: string;
    status?: string;
  }>;
};

export type ProgressTrackerBlock = {
  type: 'progress_tracker';
  title?: string;
  items: Array<{
    label: string;
    percent: number;
    status?: string;
    description?: string;
    tone?: 'neutral' | 'positive' | 'warning';
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
  | FlightOptionsBlock
  | SalesFunnelBlock
  | SalesDashboardBlock
  | AnswerCardBlock
  | SourceListBlock
  | TaskPlanBlock
  | ConfirmationPanelBlock
  | FormFillBlock
  | ChoicePickerBlock
  | DiffPreviewBlock
  | ErrorDiagnosisBlock
  | FileAttachmentCardBlock
  | ProgressTrackerBlock;

export type UISpec = {
  version: '1';
  title: string;
  summary?: string;
  blocks: UIBlock[];
};

export type ShowUiSpecArgs = z.infer<typeof showUiSpecSchema>;
