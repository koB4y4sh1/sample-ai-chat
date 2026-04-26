import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
    expect(screen.getByText('ZEN-101')).toBeInTheDocument();
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
});
