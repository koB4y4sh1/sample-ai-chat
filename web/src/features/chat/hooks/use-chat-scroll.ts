'use client';

import { useEffect, useRef } from 'react';

export function useChatScroll(isStreaming: boolean | undefined, messageCount: number) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageCount >= 0 || isStreaming !== undefined) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isStreaming, messageCount]);

  return bottomRef;
}
