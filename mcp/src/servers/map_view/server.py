"""Google Maps MCP App server."""

from __future__ import annotations

import json
import os
from textwrap import dedent
from typing import Annotated, Final

from fastmcp import FastMCP
from mcp.types import ToolAnnotations
from prefab_ui.app import PrefabApp
from prefab_ui.components import Card, CardContent, Column, Embed, Heading, Text
from pydantic import Field
from servers.map_view.models import GoogleMapView, MapCoordinate, MapMarker
from shared.env import load_repo_env
from shared.icons import MAP_VIEW_SERVER_ICONS, SHOW_GOOGLE_MAP_TOOL_ICONS

GOOGLE_MAPS_API_KEY_ENV: Final = "GOOGLE_MAPS_API_KEY"
DEFAULT_CENTER: Final = MapCoordinate(lat=35.681236, lng=139.767125)


def _embed_map_html(view: GoogleMapView, api_key: str) -> str:
    marker_payload = [{"label": marker.label, "lat": marker.lat, "lng": marker.lng, "note": marker.note or ""} for marker in view.markers]
    marker_payload_json = json.dumps(marker_payload)

    return dedent(f"""\
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <style>
              html, body {{
                margin: 0;
                width: 100%;
                height: 100%;
                background: #f8fafc;
                font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              }}
              #map {{
                width: 100%;
                height: 100%;
                min-height: 460px;
              }}
              #map-error {{
                display: none;
                margin: 12px;
                padding: 12px;
                border-radius: 8px;
                border: 1px solid #fecaca;
                background: #fff1f2;
                color: #9f1239;
                font-size: 14px;
                line-height: 1.4;
                white-space: pre-wrap;
              }}
            </style>
          </head>
          <body>
            <div id="map" role="application" aria-label="Google map"></div>
            <div id="map-error" role="alert"></div>
            <script>
              const markers = {marker_payload_json};
              const mapElement = document.getElementById("map");
              const errorElement = document.getElementById("map-error");
              let mapInitialized = false;

              function showMapError(message) {{
                mapElement.style.display = "none";
                errorElement.style.display = "block";
                errorElement.textContent = message;
              }}

              function initMap() {{
                mapInitialized = true;
                const map = new google.maps.Map(mapElement, {{
                  center: {{ lat: {view.center.lat}, lng: {view.center.lng} }},
                  zoom: {view.zoom},
                  mapTypeControl: false,
                  streetViewControl: false,
                  fullscreenControl: true
                }});
                for (const marker of markers) {{
                  const googleMarker = new google.maps.Marker({{
                    position: {{ lat: marker.lat, lng: marker.lng }},
                    map,
                    title: marker.label
                  }});
                  if (marker.note) {{
                    const infoWindow = new google.maps.InfoWindow({{
                      content: `<strong>${{marker.label}}</strong><div>${{marker.note}}</div>`
                    }});
                    googleMarker.addListener("click", () => infoWindow.open({{ anchor: googleMarker, map }}));
                  }}
                }}
              }}

              // Called by Google Maps when API key / referrer is rejected.
              window.gm_authFailure = function () {{
                showMapError(
                  "Google Maps API の認証に失敗しました。\\n" +
                  "APIキーの制限(HTTP リファラー)に Claude Desktop 側の表示オリジンが含まれているか確認してください。"
                );
              }};

              const script = document.createElement("script");
              script.src = "https://maps.googleapis.com/maps/api/js?key={api_key}&callback=initMap";
              script.async = true;
              script.defer = true;
              script.onerror = () => {{
                showMapError(
                  "Google Maps スクリプトの読み込みに失敗しました。\\n" +
                  "ネットワーク・CSP・APIキー設定を確認してください。"
                );
              }};
              document.head.appendChild(script);

              setTimeout(() => {{
                if (!mapInitialized) {{
                  showMapError(
                    "地図の初期化が完了しませんでした。\\n" +
                    "APIキー制限(HTTP リファラー)、または Google Maps 側エラーの可能性があります。"
                  );
                }}
              }}, 8000);
            </script>
          </body>
        </html>
    """)


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

    @server.tool(
        description=(
            "中心点、ズームレベル、マーカーを備えたインタラクティブなGoogleマップMCPアプリをレンダリングします。"
            "地図の表示や位置情報の視覚化を求めるリクエストにご利用ください。"
        ),
        annotations=ToolAnnotations(
            title="Show Google Map",
            readOnlyHint=True,
            destructiveHint=False,
            idempotentHint=True,
            openWorldHint=True,
        ),
        icons=SHOW_GOOGLE_MAP_TOOL_ICONS,
        app=True,
    )
    def show_google_map(
        title: Annotated[str, Field(description="Map title shown above the Google Map.")] = "Google Map View",
        center: Annotated[MapCoordinate, Field(description="Initial center coordinate.")] = DEFAULT_CENTER,
        zoom: Annotated[int, Field(ge=1, le=20, description="Initial Google Maps zoom level.")] = 13,
        markers: Annotated[list[MapMarker] | None, Field(description="Markers to show on the map.")] = None,
    ) -> PrefabApp:
        load_repo_env()
        resolved = GoogleMapView(
            title=title,
            center=center,
            zoom=zoom,
            markers=markers or [],
            api_key_configured=bool(os.getenv(GOOGLE_MAPS_API_KEY_ENV)),
        )
        api_key = os.getenv(GOOGLE_MAPS_API_KEY_ENV, "")

        with PrefabApp() as app:
            with Column(gap=3, css_class="p-4"):
                Heading(resolved.title)
                Text(f"Center: {resolved.center.lat:.5f}, {resolved.center.lng:.5f} / Zoom: {resolved.zoom} / Markers: {len(resolved.markers)}")
                with Card(css_class="w-full max-w-full min-w-0 overflow-hidden"):
                    with CardContent(css_class="p-0"):
                        if api_key:
                            Embed(
                                html=_embed_map_html(resolved, api_key),
                                width="100%",
                                height="500px",
                                sandbox="allow-scripts allow-same-origin",
                            )
                        else:
                            Text("Google Maps API key is not configured. Set GOOGLE_MAPS_API_KEY in .env and restart MCP server.")

        return app

    return server


def main() -> None:
    create_map_view_server().run()
