"""Google Maps MCP App server."""

from __future__ import annotations

import json
import os
from typing import Annotated, Final

from fastmcp import FastMCP
from fastmcp.apps import AppConfig, ResourceCSP
from mcp.types import ToolAnnotations
from pydantic import Field
from servers.map_view.models import GoogleMapView, MapCoordinate, MapMarker
from shared.env import load_repo_env
from shared.icons import MAP_VIEW_SERVER_ICONS, SHOW_GOOGLE_MAP_TOOL_ICONS

GOOGLE_MAP_RESOURCE_URI: Final = "ui://zenith/google-map/view.html"
GOOGLE_MAPS_API_KEY_ENV: Final = "GOOGLE_MAPS_API_KEY"
GOOGLE_MAP_CONNECT_DOMAINS: Final = ["https://maps.googleapis.com", "https://maps.gstatic.com"]
GOOGLE_MAP_RESOURCE_DOMAINS: Final = [
    "https://maps.googleapis.com",
    "https://maps.gstatic.com",
    "https://*.googleapis.com",
    "https://*.gstatic.com",
]
GOOGLE_MAP_CSP_META: Final = {
    "ui": {
        "csp": {
            "connectDomains": GOOGLE_MAP_CONNECT_DOMAINS,
            "resourceDomains": GOOGLE_MAP_RESOURCE_DOMAINS,
        },
        "prefersBorder": True,
    }
}


def _json_script_value(value: str) -> str:
    return json.dumps(value)


def render_google_map_app_html(api_key: str | None = None) -> str:
    load_repo_env()
    resolved_api_key = api_key if api_key is not None else os.getenv(GOOGLE_MAPS_API_KEY_ENV, "")
    api_key_json = _json_script_value(resolved_api_key)

    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Google Map View</title>
    <style>
      :root {{
        color-scheme: light;
        --bg: #f8fafc;
        --panel: #ffffff;
        --text: #172026;
        --muted: #5f6b76;
        --line: #d9e1e8;
        --accent: #0f766e;
        --danger: #b91c1c;
      }}
      * {{ box-sizing: border-box; }}
      html, body {{
        width: 100%;
        min-height: 100%;
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }}
      main {{
        display: grid;
        grid-template-rows: auto 420px auto;
        min-height: 520px;
        background: var(--panel);
      }}
      header {{
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        border-bottom: 1px solid var(--line);
        padding: 12px 14px;
      }}
      h1 {{
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 16px;
        font-weight: 700;
        letter-spacing: 0;
      }}
      .status {{
        flex: none;
        border-radius: 999px;
        background: #ccfbf1;
        color: #115e59;
        padding: 4px 8px;
        font-size: 12px;
      }}
      #map {{
        width: 100%;
        min-height: 420px;
        background: #eef2f6;
      }}
      .meta {{
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        border-top: 1px solid var(--line);
        padding: 10px 14px;
        color: var(--muted);
        font-size: 12px;
      }}
      .meta span {{
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 4px 8px;
      }}
      .error {{
        display: grid;
        place-items: center;
        min-height: 420px;
        padding: 24px;
        color: var(--danger);
        text-align: center;
      }}
      .error strong {{
        display: block;
        margin-bottom: 6px;
        color: var(--danger);
      }}
      @media (max-width: 560px) {{
        main {{ grid-template-rows: auto 360px auto; min-height: 460px; }}
        #map, .error {{ min-height: 360px; }}
      }}
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1 id="title">Google Map View</h1>
        <div class="status" id="status">Waiting for tool input</div>
      </header>
      <div id="map" role="application" aria-label="Google map"></div>
      <div class="meta" id="meta">
        <span>Center: pending</span>
        <span>Markers: 0</span>
      </div>
    </main>
    <script>
      const GOOGLE_MAPS_API_KEY = {api_key_json};
      let nextRequestId = 1;
      let hostReady = false;
      let googleMapsReady = false;
      let pendingView = null;
      let map = null;
      let markers = [];

      const titleElement = document.getElementById('title');
      const statusElement = document.getElementById('status');
      const mapElement = document.getElementById('map');
      const metaElement = document.getElementById('meta');

      function notify(method, params) {{
        window.parent.postMessage({{ jsonrpc: '2.0', method, params: params || {{}} }}, '*');
      }}

      function request(method, params) {{
        const id = nextRequestId++;
        window.parent.postMessage({{ jsonrpc: '2.0', id, method, params: params || {{}} }}, '*');
      }}

      function resize() {{
        notify('ui/notifications/size-changed', {{
          width: document.documentElement.scrollWidth,
          height: Math.max(520, document.documentElement.scrollHeight)
        }});
      }}

      function setError(title, body) {{
        statusElement.textContent = 'Configuration required';
        mapElement.innerHTML = `<div class="error"><div><strong>${{escapeHtml(title)}}</strong><div>${{escapeHtml(body)}}</div></div></div>`;
        resize();
      }}

      function escapeHtml(value) {{
        return String(value)
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#39;');
      }}

      function normalizeView(raw) {{
        const fallbackCenter = {{ lat: 35.681236, lng: 139.767125 }};
        const value = raw && typeof raw === 'object' ? raw : {{}};
        const center = value.center && typeof value.center === 'object' ? value.center : fallbackCenter;
        const markersValue = Array.isArray(value.markers) ? value.markers : [];

        return {{
          title: typeof value.title === 'string' && value.title ? value.title : 'Google Map View',
          center: {{
            lat: Number.isFinite(center.lat) ? center.lat : fallbackCenter.lat,
            lng: Number.isFinite(center.lng) ? center.lng : fallbackCenter.lng
          }},
          zoom: Number.isInteger(value.zoom) ? Math.max(1, Math.min(20, value.zoom)) : 13,
          markers: markersValue.flatMap((marker) => {{
            if (!marker || typeof marker !== 'object') return [];
            const lat = Number(marker.lat);
            const lng = Number(marker.lng);
            const label = typeof marker.label === 'string' && marker.label ? marker.label : 'Marker';
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
            return [{{ label, lat, lng, note: typeof marker.note === 'string' ? marker.note : '' }}];
          }})
        }};
      }}

      function renderMeta(view) {{
        metaElement.innerHTML = '';
        for (const text of [
          `Center: ${{view.center.lat.toFixed(5)}}, ${{view.center.lng.toFixed(5)}}`,
          `Zoom: ${{view.zoom}}`,
          `Markers: ${{view.markers.length}}`
        ]) {{
          const span = document.createElement('span');
          span.textContent = text;
          metaElement.appendChild(span);
        }}
      }}

      function renderMap(view) {{
        pendingView = view;
        titleElement.textContent = view.title;
        renderMeta(view);

        if (!GOOGLE_MAPS_API_KEY) {{
          setError('Google Maps API key is not configured.', 'Set GOOGLE_MAPS_API_KEY in the repository root .env, then restart the MCP server.');
          return;
        }}

        if (!googleMapsReady || !window.google?.maps) {{
          statusElement.textContent = 'Loading Google Maps';
          return;
        }}

        statusElement.textContent = 'Ready';
        mapElement.innerHTML = '';
        map = new google.maps.Map(mapElement, {{
          center: view.center,
          zoom: view.zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true
        }});

        markers.forEach((marker) => marker.setMap(null));
        markers = view.markers.map((marker) => {{
          const googleMarker = new google.maps.Marker({{
            position: {{ lat: marker.lat, lng: marker.lng }},
            map,
            title: marker.label
          }});
          const infoWindow = new google.maps.InfoWindow({{
            content: `<strong>${{escapeHtml(marker.label)}}</strong>${{marker.note ? `<div>${{escapeHtml(marker.note)}}</div>` : ''}}`
          }});
          googleMarker.addListener('click', () => infoWindow.open({{ anchor: googleMarker, map }}));
          return googleMarker;
        }});
        resize();
      }}

      window.__initGoogleMapView = function () {{
        googleMapsReady = true;
        if (pendingView) renderMap(pendingView);
      }};

      window.addEventListener('message', (event) => {{
        const message = event.data;
        if (!message || typeof message !== 'object' || message.jsonrpc !== '2.0') return;

        if (message.id && message.result && !hostReady) {{
          hostReady = true;
          notify('ui/notifications/initialized', {{}});
          resize();
          return;
        }}

        if (message.method === 'ui/notifications/tool-input') {{
          renderMap(normalizeView(message.params?.arguments));
        }}

        if (message.method === 'ui/notifications/tool-result') {{
          const structured = message.params?.structuredContent;
          if (structured && typeof structured === 'object') {{
            renderMap(normalizeView(structured));
          }}
        }}
      }});

      request('ui/initialize', {{ protocolVersion: '2025-06-18' }});

      if (GOOGLE_MAPS_API_KEY) {{
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${{encodeURIComponent(GOOGLE_MAPS_API_KEY)}}&callback=__initGoogleMapView`;
        script.async = true;
        script.defer = true;
        script.onerror = () => setError('Google Maps failed to load.', 'Check the browser API key, billing, referrer restrictions, and CSP.');
        document.head.appendChild(script);
      }}
    </script>
  </body>
</html>"""


def create_map_view_server() -> FastMCP:
    server = FastMCP(
        "Google Map View",
        instructions=(
            "Use this server to render interactive Google Maps as an MCP App. "
            "Use show_google_map when the user asks to display a map, locations, or markers."
        ),
        icons=MAP_VIEW_SERVER_ICONS,
        version="0.1.0",
    )

    app_config = AppConfig(
        resourceUri=GOOGLE_MAP_RESOURCE_URI,
        csp=ResourceCSP(
            connectDomains=GOOGLE_MAP_CONNECT_DOMAINS,
            resourceDomains=GOOGLE_MAP_RESOURCE_DOMAINS,
        ),
        prefersBorder=True,
    )

    @server.tool(
        description=(
            "Render an interactive Google Maps MCP App with a center point, zoom level, and markers. "
            "Use this for requests that ask to show a map or visualize locations."
        ),
        annotations=ToolAnnotations(
            title="Show Google Map",
            readOnlyHint=True,
            destructiveHint=False,
            idempotentHint=True,
            openWorldHint=True,
        ),
        icons=SHOW_GOOGLE_MAP_TOOL_ICONS,
        app=app_config,
    )
    def show_google_map(
        title: Annotated[str, Field(description="Map title shown above the Google Map.")],
        center: Annotated[MapCoordinate, Field(description="Initial center coordinate.")],
        zoom: Annotated[int, Field(ge=1, le=20, description="Initial Google Maps zoom level.")] = 13,
        markers: Annotated[list[MapMarker] | None, Field(description="Markers to show on the map.")] = None,
    ) -> GoogleMapView:
        load_repo_env()
        return GoogleMapView(
            title=title,
            center=center,
            zoom=zoom,
            markers=markers or [],
            api_key_configured=bool(os.getenv(GOOGLE_MAPS_API_KEY_ENV)),
        )

    @server.resource(GOOGLE_MAP_RESOURCE_URI, meta=GOOGLE_MAP_CSP_META)
    def google_map_view() -> str:
        return render_google_map_app_html()

    return server


def main() -> None:
    create_map_view_server().run()
