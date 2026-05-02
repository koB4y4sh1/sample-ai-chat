import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { type NextRequest, NextResponse } from 'next/server';

const appNames = {
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> },
) {
  const { appId } = await params;

  if (!isAppId(appId)) {
    return NextResponse.json({ error: 'Unknown MCP app.' }, { status: 404 });
  }

  const html = renderGoogleMapHtml(parseMapPayload(request.nextUrl.searchParams.get('data')));

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy':
        "default-src 'none'; style-src 'unsafe-inline' https:; script-src 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com; img-src * data:; connect-src https://maps.googleapis.com https://maps.gstatic.com https://*.googleapis.com; font-src https: data:; frame-ancestors 'self'; base-uri 'none'; form-action 'none'",
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
