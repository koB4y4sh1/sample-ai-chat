'use client';

import {
  type MCPAppsActivityContent,
  MCPAppsActivityContentSchema,
  MCPAppsActivityType,
  type ReactActivityMessageRenderer,
  useCopilotKit,
} from '@copilotkit/react-core/v2';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const PROTOCOL_VERSION = '2025-06-18';
const MIN_HEIGHT = 100;
const MAX_HEIGHT = 1200;
const HEIGHT_CHANGE_THRESHOLD = 8;

type McpAppsActivityRendererProps = {
  content: MCPAppsActivityContent;
  agent?: unknown;
};

type McpAppsAgent = {
  addMessage?: (message: { id: string; role: 'user' | 'assistant'; content: string }) => void;
  runAgent?: (args?: unknown) => Promise<{ result?: unknown }> | { result?: unknown };
};

type ResourceContent = {
  text?: string;
  blob?: string;
  _meta?: {
    ui?: {
      csp?: { resourceDomains?: string[] };
      prefersBorder?: boolean;
    };
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isRpcMessage = (
  value: unknown,
): value is { jsonrpc: '2.0'; method?: string; id?: unknown; params?: unknown } =>
  isRecord(value) && value.jsonrpc === '2.0';

const isRequest = (value: { method?: string; id?: unknown }) =>
  typeof value.id !== 'undefined' && typeof value.method === 'string';

const isNotification = (value: { method?: string; id?: unknown }) =>
  typeof value.id === 'undefined' && typeof value.method === 'string';

const clampHeight = (value: unknown) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, Math.ceil(value)));
};

const buildSandboxHtml = (extraCspDomains?: string[]) => {
  const baseScriptSrc =
    "'self' 'wasm-unsafe-eval' 'unsafe-inline' 'unsafe-eval' blob: data: http://localhost:* https://localhost:*";
  const baseFrameSrc = '* blob: data: http://localhost:* https://localhost:*';
  const extra = extraCspDomains?.length ? ` ${extraCspDomains.join(' ')}` : '';

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src * data: blob: 'unsafe-inline'; media-src * blob: data:; font-src * blob: data:; script-src ${baseScriptSrc + extra}; style-src * blob: data: 'unsafe-inline'; connect-src *; frame-src ${baseFrameSrc + extra}; base-uri 'self';" />
<style>html,body{margin:0;padding:0;height:100%;width:100%;overflow:hidden}*{box-sizing:border-box}iframe{background-color:transparent;border:none;padding:0;overflow:hidden;width:100%;height:100%}</style>
</head>
<body>
<script>
if(window.self===window.top){throw new Error("This file must be used in an iframe.")}
const inner=document.createElement("iframe");
inner.style="width:100%;height:100%;border:none;";
inner.setAttribute("sandbox","allow-scripts allow-same-origin allow-forms");
document.body.appendChild(inner);
window.addEventListener("message",async(event)=>{
if(event.source===window.parent){
if(event.data&&event.data.method==="ui/notifications/sandbox-resource-ready"){
const{html,sandbox}=event.data.params;
if(typeof sandbox==="string")inner.setAttribute("sandbox",sandbox);
if(typeof html==="string")inner.srcdoc=html;
}else if(inner&&inner.contentWindow){
inner.contentWindow.postMessage(event.data,"*");
}
}else if(event.source===inner.contentWindow){
window.parent.postMessage(event.data,"*");
}
});
window.parent.postMessage({jsonrpc:"2.0",method:"ui/notifications/sandbox-proxy-ready",params:{}},"*");
</script>
</body>
</html>`;
};

function useJsonStableValue<T>(value: T): T {
  const serialized = useMemo(() => JSON.stringify(value), [value]);
  const ref = useRef<{ serialized: string; value: T } | null>(null);

  if (!ref.current || ref.current.serialized !== serialized) {
    ref.current = { serialized, value };
  }

  return ref.current.value;
}

function StableMcpAppsActivityRenderer({ content, agent }: McpAppsActivityRendererProps) {
  const { copilotkit } = useCopilotKit();
  const stableContent = useJsonStableValue(content);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const contentRef = useRef(stableContent);
  const agentRef = useRef(agent);
  const copilotkitRef = useRef(copilotkit);
  const sentToolInputRef = useRef(false);
  const sentToolResultRef = useRef(false);
  const lastHeightRef = useRef(MIN_HEIGHT);
  const pendingHeightRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [height, setHeight] = useState(MIN_HEIGHT);
  const [iframeReady, setIframeReady] = useState(false);
  const [resource, setResource] = useState<ResourceContent | null>(null);
  const [error, setError] = useState<Error | null>(null);

  contentRef.current = stableContent;
  agentRef.current = agent;
  copilotkitRef.current = copilotkit;

  const runMcpProxy = useCallback(async (method: string, params: unknown) => {
    const currentAgent = agentRef.current;
    const runnableAgent = currentAgent as McpAppsAgent | undefined;
    if (!runnableAgent?.runAgent) {
      throw new Error('No agent available for MCP Apps proxy request.');
    }

    const result = await runnableAgent.runAgent({
      forwardedProps: {
        __proxiedMCPRequest: {
          serverHash: contentRef.current.serverHash,
          serverId: contentRef.current.serverId,
          method,
          params,
        },
      },
    });

    return result?.result;
  }, []);

  const sendToIframe = useCallback((message: unknown) => {
    iframeRef.current?.contentWindow?.postMessage(message, '*');
  }, []);

  const sendResponse = useCallback(
    (id: unknown, result: unknown) => {
      sendToIframe({ jsonrpc: '2.0', id, result });
    },
    [sendToIframe],
  );

  const sendErrorResponse = useCallback(
    (id: unknown, code: number, message: string) => {
      sendToIframe({ jsonrpc: '2.0', id, error: { code, message } });
    },
    [sendToIframe],
  );

  const sendNotification = useCallback(
    (method: string, params?: unknown) => {
      sendToIframe({ jsonrpc: '2.0', method, params: params ?? {} });
    },
    [sendToIframe],
  );

  const requestHeight = useCallback((nextHeight: unknown) => {
    const clamped = clampHeight(nextHeight);
    if (
      clamped === undefined ||
      Math.abs(clamped - lastHeightRef.current) < HEIGHT_CHANGE_THRESHOLD
    ) {
      return;
    }

    pendingHeightRef.current = clamped;
    if (animationFrameRef.current !== null) {
      return;
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = null;
      const pending = pendingHeightRef.current;
      pendingHeightRef.current = null;
      if (pending === null || Math.abs(pending - lastHeightRef.current) < HEIGHT_CHANGE_THRESHOLD) {
        return;
      }

      lastHeightRef.current = pending;
      setHeight(pending);
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    setResource(null);
    setError(null);

    void runMcpProxy('resources/read', { uri: stableContent.resourceUri })
      .then((result) => {
        if (!mounted || !isRecord(result)) {
          return;
        }

        const contents = Array.isArray(result.contents) ? result.contents : [];
        const first = contents[0];
        if (!isRecord(first)) {
          throw new Error('No resource content in MCP Apps response.');
        }

        setResource(first as ResourceContent);
      })
      .catch((cause: unknown) => {
        if (mounted) {
          setError(cause instanceof Error ? cause : new Error(String(cause)));
        }
      });

    return () => {
      mounted = false;
    };
  }, [runMcpProxy, stableContent.resourceUri]);

  useEffect(() => {
    if (!resource) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    let mounted = true;
    let initialListener: ((event: MessageEvent) => void) | null = null;
    let messageHandler: ((event: MessageEvent) => void) | null = null;
    const iframe = document.createElement('iframe');
    iframeRef.current = iframe;
    iframe.style.width = '100%';
    iframe.style.height = `${MIN_HEIGHT}px`;
    iframe.style.border = 'none';
    iframe.style.backgroundColor = 'transparent';
    iframe.style.display = 'block';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');

    const sandboxReady = new Promise<void>((resolve) => {
      initialListener = (event) => {
        if (
          event.source === iframe.contentWindow &&
          event.data?.method === 'ui/notifications/sandbox-proxy-ready'
        ) {
          if (initialListener) {
            window.removeEventListener('message', initialListener);
            initialListener = null;
          }
          resolve();
        }
      };
      window.addEventListener('message', initialListener);
    });

    iframe.srcdoc = buildSandboxHtml(resource._meta?.ui?.csp?.resourceDomains);
    container.appendChild(iframe);

    void sandboxReady.then(() => {
      if (!mounted) {
        return;
      }

      messageHandler = async (event) => {
        if (event.source !== iframe.contentWindow || !isRpcMessage(event.data)) {
          return;
        }

        const message = event.data;
        if (isRequest(message)) {
          if (message.method === 'ui/initialize') {
            sendResponse(message.id, {
              protocolVersion: PROTOCOL_VERSION,
              hostInfo: { name: 'Zenith MCP Apps Host', version: '1.0.0' },
              hostCapabilities: { openLinks: {}, logging: {} },
              hostContext: { theme: 'light', platform: 'web' },
            });
            return;
          }

          if (message.method === 'ui/message') {
            const params = isRecord(message.params) ? message.params : {};
            const role = typeof params.role === 'string' ? params.role : 'user';
            const contentParts = Array.isArray(params.content) ? params.content : [];
            const textContent = contentParts
              .flatMap((part) =>
                isRecord(part) && part.type === 'text' && typeof part.text === 'string'
                  ? [part.text]
                  : [],
              )
              .join('\n');
            if (textContent) {
              (agentRef.current as McpAppsAgent | undefined)?.addMessage?.({
                id: globalThis.crypto.randomUUID(),
                role: role === 'assistant' ? 'assistant' : 'user',
                content: textContent,
              });
            }
            sendResponse(message.id, { isError: false });
            if ((params.followUp ?? role === 'user') && textContent) {
              void copilotkitRef.current.runAgent({ agent: agentRef.current as never });
            }
            return;
          }

          if (message.method === 'ui/open-link') {
            const url = isRecord(message.params) ? message.params.url : undefined;
            if (typeof url === 'string') {
              window.open(url, '_blank', 'noopener,noreferrer');
              sendResponse(message.id, { isError: false });
            } else {
              sendErrorResponse(message.id, -32602, 'Missing url parameter');
            }
            return;
          }

          if (message.method === 'tools/call') {
            try {
              sendResponse(message.id, await runMcpProxy('tools/call', message.params));
            } catch (cause: unknown) {
              sendErrorResponse(message.id, -32603, String(cause));
            }
            return;
          }

          sendErrorResponse(message.id, -32601, `Method not found: ${message.method}`);
          return;
        }

        if (isNotification(message)) {
          if (message.method === 'ui/notifications/initialized') {
            setIframeReady(true);
            return;
          }

          if (message.method === 'ui/notifications/size-changed') {
            const params = isRecord(message.params) ? message.params : {};
            requestHeight(params.height);
          }
        }
      };

      window.addEventListener('message', messageHandler);
      const html = resource.text ?? (resource.blob ? atob(resource.blob) : '');
      if (!html) {
        setError(new Error('Resource has no text or blob content.'));
        return;
      }
      sendNotification('ui/notifications/sandbox-resource-ready', { html });
    });

    return () => {
      mounted = false;
      setIframeReady(false);
      sentToolInputRef.current = false;
      sentToolResultRef.current = false;
      if (initialListener) {
        window.removeEventListener('message', initialListener);
      }
      if (messageHandler) {
        window.removeEventListener('message', messageHandler);
      }
      iframe.remove();
      iframeRef.current = null;
    };
  }, [requestHeight, resource, runMcpProxy, sendErrorResponse, sendNotification, sendResponse]);

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.style.height = `${height}px`;
    }
  }, [height]);

  useEffect(() => {
    if (!iframeReady || sentToolInputRef.current || !stableContent.toolInput) {
      return;
    }

    sentToolInputRef.current = true;
    sendNotification('ui/notifications/tool-input', { arguments: stableContent.toolInput });
  }, [iframeReady, sendNotification, stableContent.toolInput]);

  useEffect(() => {
    if (!iframeReady || sentToolResultRef.current || !stableContent.result) {
      return;
    }

    sentToolResultRef.current = true;
    sendNotification('ui/notifications/tool-result', stableContent.result);
  }, [iframeReady, sendNotification, stableContent.result]);

  useEffect(
    () => () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    },
    [],
  );

  const borderStyle =
    resource?._meta?.ui?.prefersBorder === true
      ? {
          borderRadius: '8px',
          backgroundColor: '#f9f9f9',
          border: '1px solid #e0e0e0',
        }
      : {};

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height,
        minHeight: MIN_HEIGHT,
        maxHeight: MAX_HEIGHT,
        overflow: 'hidden',
        position: 'relative',
        ...borderStyle,
      }}
    >
      {!resource && !error ? (
        <div style={{ padding: '1rem', color: '#666' }}>Loading...</div>
      ) : null}
      {error ? <div style={{ color: 'red', padding: '1rem' }}>Error: {error.message}</div> : null}
    </div>
  );
}

export const stableMcpAppsActivityRenderers: ReactActivityMessageRenderer<MCPAppsActivityContent>[] =
  [
    {
      activityType: MCPAppsActivityType,
      content: MCPAppsActivityContentSchema,
      render: StableMcpAppsActivityRenderer,
    },
  ];
