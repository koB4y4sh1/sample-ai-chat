'use client';

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

type SubmitInteractionOptions = {
  toolCallId?: string;
  interactionKey?: string;
};

type GenerativeUIInteractionContextValue = {
  activeToolCallIds: Set<string>;
  selectedInteractionKeys: Set<string>;
  submitInteraction: (content: string, options?: SubmitInteractionOptions) => Promise<void>;
};

const buildSelectedInteractionKey = (toolCallId: string, interactionKey: string) =>
  `${toolCallId}:${interactionKey}`;

const GenerativeUIInteractionContext = createContext<GenerativeUIInteractionContextValue>({
  activeToolCallIds: new Set(),
  selectedInteractionKeys: new Set(),
  submitInteraction: async () => {},
});

export function GenerativeUIInteractionProvider({
  children,
  onSubmit,
  activeToolCallIds,
}: {
  children: ReactNode;
  onSubmit: (content: string) => Promise<void> | void;
  activeToolCallIds: Set<string>;
}) {
  const [selectedInteractionKeys, setSelectedInteractionKeys] = useState<Set<string>>(new Set());

  const submitInteraction = useCallback(
    async (content: string, options?: SubmitInteractionOptions) => {
      const trimmedContent = content.trim();
      if (!trimmedContent) {
        return;
      }

      if (options?.toolCallId && !activeToolCallIds.has(options.toolCallId)) {
        return;
      }

      if (options?.toolCallId && options.interactionKey) {
        const selectedKey = buildSelectedInteractionKey(options.toolCallId, options.interactionKey);
        setSelectedInteractionKeys((prev) => new Set(prev).add(selectedKey));
      }

      await onSubmit(trimmedContent);
    },
    [activeToolCallIds, onSubmit],
  );

  const value = useMemo(
    () => ({
      activeToolCallIds,
      selectedInteractionKeys,
      submitInteraction,
    }),
    [activeToolCallIds, selectedInteractionKeys, submitInteraction],
  );

  return (
    <GenerativeUIInteractionContext.Provider value={value}>
      {children}
    </GenerativeUIInteractionContext.Provider>
  );
}

export const getSelectedInteractionKey = buildSelectedInteractionKey;

export const useGenerativeUIInteraction = () => useContext(GenerativeUIInteractionContext);
