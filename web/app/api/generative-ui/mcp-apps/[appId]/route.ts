import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { type NextRequest, NextResponse } from 'next/server';

const appNames = {
  'project-dashboard': 'Project Dashboard',
  'data-table': 'Data Table Explorer',
  'workflow-board': 'Workflow Board',
  'google-map': 'Google Map View',
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const parseEnvLine = (line: string) => {
  let stripped = line.trim();
  if (!stripped || stripped.startsWith('#')) {
    return null;
  }

  if (stripped.startsWith('export ')) {
    stripped = stripped.slice('export '.length).trim();
  }

  const separatorIndex = stripped.indexOf('=');
  if (separatorIndex < 1) {
    return null;
  }

  const key = stripped.slice(0, separatorIndex).trim();
  let value = stripped.slice(separatorIndex + 1).trim();
  if (value.length >= 2 && value[0] === value.at(-1) && (value[0] === '"' || value[0] === "'")) {
    value = value.slice(1, -1);
  }

  return { key, value };
};

const readEnvFileValue = (path: string, key: string) => {
  if (!existsSync(path)) {
    return undefined;
  }

  for (const line of readFileSync(path, 'utf-8').split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (parsed?.key === key) {
      return parsed.value;
    }
  }

  return undefined;
};

const readEnvValue = (key: string) => {
  if (process.env[key]) {
    return process.env[key];
  }

  const cwd = process.cwd();
  const candidates = [join(cwd, '.env'), resolve(cwd, '..', '.env')];
  for (const path of candidates) {
    const value = readEnvFileValue(path, key);
    if (value) {
      return value;
    }
  }

  return '';
};

const asNumber = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

type GoogleMapPayload = {
  title: string;
  center: { lat: number; lng: number };
  zoom: number;
  markers: Array<{ label: string; lat: number; lng: number; note?: string }>;
};

const defaultMapPayload: GoogleMapPayload = {
  title: 'Google Map View',
  center: { lat: 35.681236, lng: 139.767125 },
  zoom: 13,
  markers: [],
};

const normalizeMapPayload = (value: unknown): GoogleMapPayload => {
  if (!isRecord(value)) {
    return defaultMapPayload;
  }

  const center = isRecord(value.center) ? value.center : defaultMapPayload.center;
  const markers = Array.isArray(value.markers)
    ? value.markers.flatMap((marker) => {
        if (!isRecord(marker)) {
          return [];
        }

        const lat = asNumber(marker.lat, Number.NaN);
        const lng = asNumber(marker.lng, Number.NaN);
        const label = typeof marker.label === 'string' && marker.label ? marker.label : 'Marker';
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return [];
        }

        return [
          {
            label,
            lat,
            lng,
            note: typeof marker.note === 'string' ? marker.note : undefined,
          },
        ];
      })
    : [];

  return {
    title: typeof value.title === 'string' && value.title ? value.title : defaultMapPayload.title,
    center: {
      lat: asNumber(center.lat, defaultMapPayload.center.lat),
      lng: asNumber(center.lng, defaultMapPayload.center.lng),
    },
    zoom: Math.max(1, Math.min(20, Math.trunc(asNumber(value.zoom, defaultMapPayload.zoom)))),
    markers,
  };
};

const parseMapPayload = (value: string | null): GoogleMapPayload => {
  if (!value) {
    return defaultMapPayload;
  }

  try {
    return normalizeMapPayload(JSON.parse(value));
  } catch {
    return defaultMapPayload;
  }
};

const renderGoogleMapHtml = (payload: GoogleMapPayload) => {
  const apiKey =
    readEnvValue('GOOGLE_MAPS_API_KEY') || readEnvValue('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(payload.title)}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f8fafc;
        --text: #172026;
        --muted: #5f6b76;
        --line: #d9e1e8;
        --danger: #b91c1c;
      }
      * { box-sizing: border-box; }
      html, body { width: 100%; height: 100%; margin: 0; background: var(--bg); color: var(--text); font-family: ui-sans-serif, system-ui, sans-serif; }
      main { display: block; min-height: 480px; background: #fff; }
      #map { width: 100%; min-height: 480px; background: #eef2f6; }
      .error { display: grid; place-items: center; min-height: 480px; padding: 24px; color: var(--danger); text-align: center; }
      .error strong { display: block; margin-bottom: 6px; color: var(--danger); }
      @media (max-width: 560px) {
        main, #map, .error { min-height: 420px; }
      }
    </style>
  </head>
  <body>
    <main>
      <div id="map" role="application" aria-label="Google map"></div>
    </main>
    <script>
      const MAP_DATA = ${JSON.stringify(payload)};
      const GOOGLE_MAPS_API_KEY = ${JSON.stringify(apiKey)};
      const mapElement = document.getElementById('map');

      function escapeHtml(value) {
        return String(value)
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#39;');
      }

      function setError(title, body) {
        mapElement.innerHTML = '<div class="error"><div><strong>' + escapeHtml(title) + '</strong><div>' + escapeHtml(body) + '</div></div></div>';
      }

      window.initGoogleMapView = function () {
        const map = new google.maps.Map(mapElement, {
          center: MAP_DATA.center,
          zoom: MAP_DATA.zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true
        });

        MAP_DATA.markers.forEach((marker) => {
          const googleMarker = new google.maps.Marker({
            position: { lat: marker.lat, lng: marker.lng },
            map,
            title: marker.label
          });
          const infoWindow = new google.maps.InfoWindow({
            content: '<strong>' + escapeHtml(marker.label) + '</strong>' + (marker.note ? '<div>' + escapeHtml(marker.note) + '</div>' : '')
          });
          googleMarker.addListener('click', () => infoWindow.open({ anchor: googleMarker, map }));
        });
      };

      if (!GOOGLE_MAPS_API_KEY) {
        setError('Google Maps API key is not configured.', 'Set GOOGLE_MAPS_API_KEY in web/.env or the repository root .env, then restart the web server.');
      } else {
        const script = document.createElement('script');
        script.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(GOOGLE_MAPS_API_KEY) + '&callback=initGoogleMapView';
        script.async = true;
        script.defer = true;
        script.onerror = () => setError('Google Maps failed to load.', 'Check the browser API key, billing, referrer restrictions, and CSP.');
        document.head.appendChild(script);
      }
    </script>
  </body>
</html>`;
};

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

  const isGoogleMap = appId === 'google-map';
  const html = isGoogleMap
    ? renderGoogleMapHtml(parseMapPayload(request.nextUrl.searchParams.get('data')))
    : renderHtml(appId, request.nextUrl.searchParams.get('prompt') ?? '');

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': isGoogleMap
        ? "default-src 'none'; style-src 'unsafe-inline' https:; script-src 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com; img-src * data:; connect-src https://maps.googleapis.com https://maps.gstatic.com https://*.googleapis.com; font-src https: data:; frame-ancestors 'self'; base-uri 'none'; form-action 'none'"
        : "default-src 'none'; style-src 'unsafe-inline'; script-src 'none'; img-src 'none'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'",
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
