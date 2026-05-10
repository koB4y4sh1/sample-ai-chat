import { useHumanInTheLoop } from '@copilotkit/react-core/v2';
import { ApprovalCard } from './approval/approval-card';
import { StepsFeedback } from './steps-feedback/steps-feedback';
import { type GenerateTaskStepsArgs, generateTaskStepsParameters } from './steps-feedback/types';

export function HumanInTheLoop() {
  // Human-in-the-loop approval for weather tool execution.
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

  // Human-in-the-loop flow for selecting task steps.
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
