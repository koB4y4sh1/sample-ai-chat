'use client';

import type React from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

const MAX_TEXTAREA_HEIGHT = 200;

export const resizeTextareaElement = (textarea: HTMLTextAreaElement | null) => {
  if (!textarea) {
    return;
  }

  textarea.style.height = 'auto';
  textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  textarea.style.overflowY = textarea.scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden';
};

export function useChatInput(onSend: (message: string) => void) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    void input;
    resizeTextareaElement(textareaRef.current);
  }, [input]);

  const handleSend = useCallback(() => {
    if (input.trim()) {
      onSend(input);
      setInput('');
    }
  }, [input, onSend]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return {
    input,
    setInput,
    textareaRef,
    handleSend,
    onKeyDown,
    resizeTextareaElement,
  };
}
