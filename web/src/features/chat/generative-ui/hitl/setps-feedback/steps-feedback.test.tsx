import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StepsFeedback } from './steps-feedback';
import type { Step } from './types';

const sampleSteps: Step[] = [
  { description: 'Step A', status: 'enabled' },
  { description: 'Step B', status: 'enabled' },
];

describe('StepsFeedback', () => {
  it('lists steps and toggles selection while executing', async () => {
    const user = userEvent.setup();
    const respond = vi.fn();

    render(<StepsFeedback args={{ steps: sampleSteps }} respond={respond} status="executing" />);

    expect(screen.getByText('Step A')).toBeInTheDocument();
    expect(screen.getByText('Step B')).toBeInTheDocument();

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);

    await user.click(screen.getByRole('button', { name: /Confirm/i }));

    expect(respond).toHaveBeenCalledWith({
      accepted: true,
      steps: [{ description: 'Step B', status: 'enabled' }],
    });
  });

  it('rejects without confirmed steps', async () => {
    const user = userEvent.setup();
    const respond = vi.fn();

    render(<StepsFeedback args={{ steps: sampleSteps }} respond={respond} status="executing" />);

    await user.click(screen.getByRole('button', { name: /Reject/i }));

    expect(respond).toHaveBeenCalledWith({ accepted: false });
  });

  it('renders nothing when steps are empty', () => {
    const { container } = render(<StepsFeedback args={{ steps: [] }} status="executing" />);
    expect(container.firstChild).toBeNull();
  });
});
