'use client';

import { useEffect, useState } from 'react';
import { ActionButton, DecorativeElements, StepContainer, StepHeader, StepItem } from './step-ui';
import type { Step } from './types';

export type StepsFeedbackProps = {
  args: { steps: Step[] };
  respond?: (value: { accepted: boolean; steps?: Step[] }) => void;
  status?: string;
};

export function StepsFeedback({ args, respond, status }: StepsFeedbackProps) {
  const [localSteps, setLocalSteps] = useState<Step[]>([]);
  const [accepted, setAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    if (
      status === 'executing' &&
      localSteps.length === 0 &&
      Array.isArray(args.steps) &&
      args.steps.length > 0
    ) {
      setLocalSteps(args.steps);
    }
  }, [status, args.steps, localSteps.length]);

  if (!Array.isArray(args.steps) || args.steps.length === 0) {
    return null;
  }

  const steps: Step[] = localSteps.length > 0 ? localSteps : args.steps;
  const enabledCount = steps.filter((step) => step.status === 'enabled').length;

  const handleStepToggle = (index: number) => {
    setLocalSteps((prevSteps) => {
      const base = prevSteps.length > 0 ? prevSteps : args.steps;
      return base.map((step, i) =>
        i === index
          ? { ...step, status: step.status === 'enabled' ? 'disabled' : 'enabled' }
          : step,
      );
    });
  };

  const handleReject = () => {
    setAccepted(false);
    respond?.({ accepted: false });
  };

  const handleConfirm = () => {
    const working = localSteps.length > 0 ? localSteps : args.steps;
    const confirmedSteps = working.filter((step) => step.status === 'enabled');
    setAccepted(true);
    respond?.({ accepted: true, steps: confirmedSteps });
  };

  return (
    <StepContainer>
      <StepHeader
        enabledCount={enabledCount}
        totalCount={steps.length}
        status={status}
        showStatus
      />

      <div className="mb-6 space-y-3">
        {steps.map((step, index) => (
          <StepItem
            key={step.description}
            step={step}
            status={status}
            onToggle={() => handleStepToggle(index)}
            disabled={status !== 'executing'}
          />
        ))}
      </div>

      {accepted === null ? (
        <div className="flex justify-center gap-4">
          <ActionButton
            variant="secondary"
            disabled={status !== 'executing'}
            onClick={handleReject}
          >
            <span className="mr-2">✗</span>
            Reject
          </ActionButton>
          <ActionButton variant="success" disabled={status !== 'executing'} onClick={handleConfirm}>
            <span className="mr-2">✓</span>
            Confirm
            <span className="ml-2 rounded-full bg-green-600/20 px-2 py-1 text-xs font-bold dark:bg-green-800/50">
              {enabledCount}
            </span>
          </ActionButton>
        </div>
      ) : (
        <div className="flex justify-center">
          <div
            className={`flex items-center gap-2 rounded-lg px-6 py-3 font-semibold ${
              accepted
                ? 'border border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-900/30 dark:text-green-300'
                : 'border border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-900/30 dark:text-red-300'
            }`}
          >
            <span className="text-lg">{accepted ? '✓' : '✗'}</span>
            {accepted ? 'Accepted' : 'Rejected'}
          </div>
        </div>
      )}

      <DecorativeElements
        variant={accepted === true ? 'success' : accepted === false ? 'danger' : 'default'}
      />
    </StepContainer>
  );
}
