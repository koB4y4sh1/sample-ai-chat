'use client';

import { ExternalLink } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import {
  normalizeMapPayload,
  renderGoogleMapSandboxHtml,
} from '@/features/chat/lib/mcp-sandbox-html';
import type { ShowGoogleMapArgs } from '@/features/chat/schemas/google-map';

export function GoogleMapFrame({ title, center, zoom, markers }: ShowGoogleMapArgs) {
  const html = useMemo(
    () =>
      renderGoogleMapSandboxHtml(
        normalizeMapPayload({
          title,
          center,
          zoom,
          markers,
        }),
      ),
    [title, center, zoom, markers],
  );

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
          <p className="text-xs text-text-secondary">Google Maps MCP App</p>
        </div>
        <a
          href={blobUrl || '#'}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-text-secondary transition-colors hover:text-text-primary"
          aria-label="Open Google Maps MCP App"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
      <iframe
        title={title}
        srcDoc={html}
        className="block w-full border-0 bg-white"
        sandbox="allow-scripts allow-same-origin"
        style={{ height: 480 }}
      />
    </div>
  );
}
