'use client';

import { ExternalLink } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { renderOpenEndedMcpSandboxHtml } from '@/features/chat/lib/mcp-sandbox-html';
import type { ShowMcpAppArgs } from '@/features/chat/schemas/open-ended';

export function EmbeddedAppFrame({ appId, title, prompt, height }: ShowMcpAppArgs) {
  const html = useMemo(() => renderOpenEndedMcpSandboxHtml(appId, prompt ?? ''), [appId, prompt]);

  const blobUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    return URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  }, [html]);

  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  return (
    <div className="my-3 w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-bg">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">{title}</p>
          <p className="text-xs text-text-secondary">MCP App surface</p>
        </div>
        <a
          href={blobUrl || '#'}
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
        srcDoc={html}
        className="block w-full border-0 bg-white"
        sandbox="allow-scripts"
        style={{ height }}
      />
    </div>
  );
}
