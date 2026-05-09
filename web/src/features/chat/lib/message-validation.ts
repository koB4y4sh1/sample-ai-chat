export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const parseJsonRecord = (value: string) => {
  try {
    const parsed = JSON.parse(value);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const isErrorStatus = (value: unknown) =>
  typeof value === 'string' && ['error', 'failed', 'failure'].includes(value.toLowerCase());

export const isToolResultError = (message: unknown) => {
  if (!isRecord(message)) {
    return false;
  }

  if (isErrorStatus(message.status) || message.error === true || message.isError === true) {
    return true;
  }

  if (typeof message.errorText === 'string' && message.errorText.trim()) {
    return true;
  }

  if (typeof message.content !== 'string') {
    return false;
  }

  const parsedContent = parseJsonRecord(message.content);
  return Boolean(
    parsedContent &&
      (isErrorStatus(parsedContent.status) ||
        parsedContent.error === true ||
        parsedContent.isError === true ||
        (typeof parsedContent.errorText === 'string' && parsedContent.errorText.trim())),
  );
};
