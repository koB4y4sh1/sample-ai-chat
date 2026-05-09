'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { EditingDraft } from '@/features/chat/types/message';

type EditMessageFormProps = {
  draft: EditingDraft;
  setDraft: Dispatch<SetStateAction<EditingDraft | null>>;
  onCancel: () => void;
  onSubmit: () => void;
};

export function EditMessageForm({ draft, setDraft, onCancel, onSubmit }: EditMessageFormProps) {
  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/20 px-4 py-6 backdrop-blur-[1px] sm:items-center">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-sidebar-bg p-4 shadow-2xl">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-text-primary">Edit message</h3>
          <p className="mt-1 text-xs text-text-secondary">
            Saving will remove later assistant output and rerun the agent from this message.
          </p>
        </div>
        <textarea
          value={draft.text}
          onChange={(event) =>
            setDraft((current) => (current ? { ...current, text: event.target.value } : current))
          }
          rows={8}
          className="min-h-40 w-full resize-y rounded-xl border border-border bg-bg px-3 py-2 text-sm leading-relaxed text-text-primary outline-none focus:border-text-secondary/50"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void onSubmit()}
            disabled={!draft.text.trim()}
            className="rounded-lg bg-accent-gradient px-3 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
          >
            Save and regenerate
          </button>
        </div>
      </div>
    </div>
  );
}
