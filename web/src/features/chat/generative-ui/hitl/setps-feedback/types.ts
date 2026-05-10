import { z } from 'zod';

export type StepStatus = 'enabled' | 'disabled' | 'executing';

export type Step = {
  description: string;
  status: StepStatus;
};

export const stepSchema = z.object({
  description: z.string(),
  status: z.enum(['enabled', 'disabled', 'executing']),
});

/** `generate_task_steps` human-in-the-loop のパラメータ */
export const generateTaskStepsParameters = z.object({
  steps: z.array(stepSchema),
});

/** z.infer は strict 無効時にプロパティが optional と推論されるため明示する */
export type GenerateTaskStepsArgs = {
  steps: Step[];
};
