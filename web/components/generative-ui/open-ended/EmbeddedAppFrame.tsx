'use client';

import { ExternalLink } from 'lucide-react';
import type { ShowMcpAppArgs } from '../../../lib/generative-ui/schemas/open-ended';

export function EmbeddedAppFrame({ appId, title, prompt, height }: ShowMcpAppArgs) {
  const params = new URLSearchParams();
  if (prompt) {
    params.set('prompt', prompt);
  }

  const src = `/api/generative-ui/mcp-apps/${encodeURIComponent(appId)}${
    params.size > 0 ? `?${params.toString()}` : ''
  }`;

  return (
    <div className="my-3 w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-bg">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">{title}</p>
          <p className="text-xs text-text-secondary">MCP App surface</p>
        </div>
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-text-secondary transition-colors hover:text-text-primary"
          aria-label="Open embedded app"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
      <iframe
        title={title}
        src={src}
        className="block w-full border-0 bg-white"
        sandbox="allow-scripts"
        style={{ height }}
      />
    </div>
  );
}
