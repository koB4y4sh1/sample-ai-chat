'use client';

import type { UserMessage } from '@copilotkit/react-core/v2';
import { useCallback, useState } from 'react';
import { getMessageText } from '@/features/chat/lib/build-message';
import type { EditingDraft } from '@/features/chat/types/message';

export function useMessageEditingDraft() {
  const [editingDraft, setEditingDraft] = useState<EditingDraft | null>(null);

  const openEditUserMessage = useCallback((message: UserMessage) => {
    setEditingDraft({
      message,
      text: getMessageText(message.content),
    });
  }, []);

  return { editingDraft, setEditingDraft, openEditUserMessage };
}
