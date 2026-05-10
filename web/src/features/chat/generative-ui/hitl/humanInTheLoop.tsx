import { useHumanInTheLoop } from '@copilotkit/react-core/v2';
import { ApprovalCard } from './approval/approval-card';
import { StepsFeedback } from './setps-feedback/steps-feedback';
import { type GenerateTaskStepsArgs, generateTaskStepsParameters } from './setps-feedback/types';

export function HumanInTheLoop() {
  /** Human-In-the-Loop: 「東京の天気について調べて」など
   *  「承認」後、Server Tool が実行される
   */
  useHumanInTheLoop({
    name: 'get_weather',
    description: 'Get the current weather',
    render: ({ status, respond }) => {
      return (
        <ApprovalCard
          title="Would you like to allow the weather retrieval tool to run?"
          status={status}
          respond={respond}
        />
      );
    },
  });

  /** Human-In-the-Loop: コマンド承認・タスクステップ選択など */
  useHumanInTheLoop({
    name: 'generate_task_steps',
    description: 'Generates a list of steps for the user to perform',
    parameters: generateTaskStepsParameters,
    render: ({ args, respond, status }) => {
      const parsed = generateTaskStepsParameters.safeParse(args);
      if (!parsed.success) {
        return null;
      }
      const data = parsed.data as GenerateTaskStepsArgs;
      return <StepsFeedback args={data} respond={respond} status={status} />;
    },
  });

  return null;
}
