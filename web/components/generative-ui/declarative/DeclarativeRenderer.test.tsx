import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { UISpec } from '../../../lib/generative-ui/schemas/declarative';
import { DeclarativeRenderer } from './DeclarativeRenderer';

describe('DeclarativeRenderer chat-business blocks', () => {
  it('renders chat workflow blocks without requiring interactive handlers', () => {
    const spec: UISpec = {
      version: '1',
      title: 'Chat Operations',
      blocks: [
        {
          type: 'answer_card',
          title: 'Answer',
          body: 'Use the declarative renderer for structured chat outcomes.',
          tone: 'positive',
          items: [{ label: 'Decision', description: 'Renderer-owned UI' }],
        },
        {
          type: 'source_list',
          title: 'Sources',
          items: [
            {
              label: 'Registry',
              path: 'web/components/chat/GenerativeUIRegistry.tsx',
              line: '887',
            },
          ],
        },
        {
          type: 'task_plan',
          title: 'Plan',
          items: [{ label: 'Add catalog blocks', status: 'Done', owner: 'web' }],
        },
        {
          type: 'confirmation_panel',
          title: 'Confirm',
          body: 'Apply these generated changes?',
          actions: [
            { label: 'Apply', description: 'Run the proposed change.', variant: 'primary' },
            {
              label: 'Cancel',
              description: 'Leave the current state unchanged.',
              variant: 'danger',
            },
          ],
        },
        {
          type: 'form_fill',
          title: 'Input',
          items: [{ label: 'Ticket ID', value: 'ZEN-101', required: true }],
        },
      ],
    };

    render(<DeclarativeRenderer spec={spec} status="complete" />);

    expect(screen.getByText('Chat Operations')).toBeInTheDocument();
    expect(screen.getByText('Renderer-owned UI')).toBeInTheDocument();
    expect(
      screen.getByText('web/components/chat/GenerativeUIRegistry.tsx:887'),
    ).toBeInTheDocument();
    expect(screen.getByText('Add catalog blocks')).toBeInTheDocument();
    expect(screen.getByText('Approval required')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
    expect(screen.getByText('Run the proposed change.')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ZEN-101')).toBeInTheDocument();
  });

  it('renders troubleshooting, attachment, choice, diff, and progress blocks', () => {
    const spec: UISpec = {
      version: '1',
      title: 'Support Flow',
      blocks: [
        {
          type: 'choice_picker',
          title: 'Choices',
          items: [
            { label: 'Run diagnostics', description: 'Collect logs first', status: 'Recommended' },
          ],
        },
        {
          type: 'diff_preview',
          title: 'Patch',
          items: [
            { label: 'route.ts', before: 'return old;', after: 'return next;', language: 'ts' },
          ],
        },
        {
          type: 'error_diagnosis',
          title: 'Diagnosis',
          body: 'The tool payload is incomplete.',
          items: [
            {
              label: 'Missing field',
              severity: 'Error',
              cause: 'No rows',
              reproduction: 'Call the tool without rows.',
              fix: 'Add rows',
            },
          ],
        },
        {
          type: 'file_attachment_card',
          title: 'Files',
          items: [{ label: 'Report', fileName: 'report.pdf', size: '180 KB', status: 'Ready' }],
        },
        {
          type: 'progress_tracker',
          title: 'Progress',
          items: [{ label: 'Verification', percent: 80, status: 'Running', tone: 'neutral' }],
        },
      ],
    };

    render(<DeclarativeRenderer spec={spec} status="complete" />);

    expect(screen.getByRole('button', { name: /Run diagnostics/ })).toBeInTheDocument();
    expect(screen.getByText('return old;')).toBeInTheDocument();
    expect(screen.getByText('Call the tool without rows.')).toBeInTheDocument();
    expect(screen.getByText('Add rows')).toBeInTheDocument();
    expect(screen.getByText('report.pdf')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('submits generated UI interactions back as chat messages', async () => {
    const user = userEvent.setup();
    const onSubmitInteraction = vi.fn();
    const spec: UISpec = {
      version: '1',
      title: 'Interactive Flow',
      blocks: [
        {
          type: 'confirmation_panel',
          title: 'Confirm deploy',
          body: 'Deploy the release candidate?',
          actions: [{ label: 'Approve deploy', description: 'Proceed with production deploy.' }],
        },
        {
          type: 'choice_picker',
          title: 'Model',
          items: [{ label: 'Fast model', description: 'Lower latency.' }],
        },
        {
          type: 'form_fill',
          title: 'Request details',
          items: [{ label: 'Reason', placeholder: 'Enter reason', required: true }],
        },
        {
          type: 'diff_preview',
          title: 'Edited copy',
          items: [{ label: 'Message', before: 'old copy', after: 'new copy' }],
        },
      ],
    };

    render(
      <DeclarativeRenderer
        spec={spec}
        status="complete"
        onSubmitInteraction={onSubmitInteraction}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Approve deploy' }));
    await user.click(screen.getByRole('button', { name: /Fast model/ }));
    await user.type(screen.getByLabelText('Reason'), 'Need release validation');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await user.click(screen.getByRole('button', { name: 'Use revised' }));

    expect(onSubmitInteraction).toHaveBeenCalledWith(
      expect.stringContaining('Selected action: Approve deploy'),
      expect.objectContaining({ interactionKey: 'confirmation:Approve deploy' }),
    );
    expect(onSubmitInteraction).toHaveBeenCalledWith(
      expect.stringContaining('Selected option: Fast model'),
      expect.objectContaining({ interactionKey: 'choice:Fast model' }),
    );
    expect(onSubmitInteraction).toHaveBeenCalledWith(
      expect.stringContaining('- Reason: Need release validation'),
      expect.objectContaining({ interactionKey: 'form:Request details' }),
    );
    expect(onSubmitInteraction).toHaveBeenCalledWith(
      expect.stringContaining('new copy'),
      expect.objectContaining({ interactionKey: 'diff:use:Message' }),
    );
  });

  it('disables interactions for past tool calls and marks selected actions', async () => {
    const user = userEvent.setup();
    const onSubmitInteraction = vi.fn();
    const spec: UISpec = {
      version: '1',
      title: 'Past Flow',
      blocks: [
        {
          type: 'choice_picker',
          title: 'Choices',
          items: [{ label: 'Use option', description: 'Already selected.' }],
        },
      ],
    };

    render(
      <DeclarativeRenderer
        spec={spec}
        status="complete"
        toolCallId="tool-1"
        interactionDisabled
        selectedInteractionKeys={new Set(['tool-1:choice:Use option'])}
        onSubmitInteraction={onSubmitInteraction}
      />,
    );

    const option = screen.getByRole('button', { name: /Use option/ });
    expect(screen.getByText('Past message - interactions disabled')).toBeInTheDocument();
    expect(option).toBeDisabled();

    await user.click(option);
    expect(onSubmitInteraction).not.toHaveBeenCalled();
  });
});
