import { type NextRequest, NextResponse } from 'next/server';

const appNames = {
  'project-dashboard': 'Project Dashboard',
  'data-table': 'Data Table Explorer',
  'workflow-board': 'Workflow Board',
} as const;

type AppId = keyof typeof appNames;

const isAppId = (value: string): value is AppId => value in appNames;

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const renderAppBody = (appId: AppId, prompt: string) => {
  if (appId === 'data-table') {
    return `
      <section class="toolbar">
        <button type="button">Filter</button>
        <button type="button">Export</button>
      </section>
      <table>
        <thead><tr><th>Area</th><th>Status</th><th>Owner</th></tr></thead>
        <tbody>
          <tr><td>Chat UI</td><td>Ready</td><td>web</td></tr>
          <tr><td>Declarative UI</td><td>Added</td><td>web</td></tr>
          <tr><td>MCP App Surface</td><td>Sandboxed</td><td>web</td></tr>
        </tbody>
      </table>
    `;
  }

  if (appId === 'workflow-board') {
    return `
      <div class="lanes">
        <section><h2>Now</h2><p>Validate embedded surface behavior.</p></section>
        <section><h2>Next</h2><p>Connect a real MCP App manifest.</p></section>
        <section><h2>Later</h2><p>Add postMessage actions.</p></section>
      </div>
    `;
  }

  return `
    <div class="metrics">
      <article><span>Static</span><strong>Ready</strong></article>
      <article><span>Declarative</span><strong>Ready</strong></article>
      <article><span>Open-ended</span><strong>Preview</strong></article>
    </div>
    <p class="prompt">${escapeHtml(prompt || 'No prompt was provided.')}</p>
  `;
};

const renderHtml = (appId: AppId, prompt: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${appNames[appId]}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f8fafc;
        --panel: #ffffff;
        --text: #172026;
        --muted: #5c6670;
        --line: #d8dee6;
        --accent: #0f766e;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background:
          linear-gradient(135deg, rgba(15, 118, 110, 0.08), transparent 36%),
          var(--bg);
        color: var(--text);
        font-family: ui-sans-serif, system-ui, sans-serif;
      }
      main { padding: 18px; }
      header { margin-bottom: 16px; }
      h1 { margin: 0; font-size: 18px; letter-spacing: 0; }
      h2 { margin: 0 0 8px; font-size: 13px; }
      p { margin: 0; color: var(--muted); font-size: 13px; line-height: 1.5; }
      .metrics, .lanes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
      article, section, .prompt {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel);
        padding: 12px;
      }
      article span { display: block; color: var(--muted); font-size: 11px; text-transform: uppercase; }
      article strong { display: block; margin-top: 4px; font-size: 18px; }
      .prompt { margin-top: 12px; }
      .toolbar { display: flex; gap: 8px; margin-bottom: 12px; }
      button {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel);
        color: var(--text);
        padding: 7px 10px;
        font: inherit;
        font-size: 12px;
      }
      table { width: 100%; border-collapse: collapse; background: var(--panel); font-size: 13px; }
      th, td { border: 1px solid var(--line); padding: 8px; text-align: left; }
      th { color: var(--muted); font-size: 11px; text-transform: uppercase; }
      @media (max-width: 560px) {
        .metrics, .lanes { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1>${appNames[appId]}</h1>
        <p>Sandboxed open-ended surface served from Zenith.</p>
      </header>
      ${renderAppBody(appId, prompt)}
    </main>
  </body>
</html>`;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> },
) {
  const { appId } = await params;

  if (!isAppId(appId)) {
    return NextResponse.json({ error: 'Unknown MCP app.' }, { status: 404 });
  }

  const html = renderHtml(appId, request.nextUrl.searchParams.get('prompt') ?? '');

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy':
        "default-src 'none'; style-src 'unsafe-inline'; script-src 'none'; img-src 'none'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'",
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
