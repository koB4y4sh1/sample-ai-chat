"""Map app provider."""

from textwrap import dedent
from typing import Annotated

from fastmcp import FastMCPApp
from mcp.types import ToolAnnotations
from prefab_ui.app import PrefabApp
from prefab_ui.components import Card, CardContent, Column, Embed, Heading, Text
from pydantic import Field

app = FastMCPApp("Map App")


@app.ui(
    name="show_map_app",
    description="Open a map MCP App example.",
    annotations=ToolAnnotations(
        title="Show Map App",
        readOnlyHint=True,
        destructiveHint=False,
        idempotentHint=True,
        openWorldHint=True,
    ),
)
def show_map_app(
    lat: Annotated[float, Field(description="Latitude.")] = 35.681236,
    lng: Annotated[float, Field(description="Longitude.")] = 139.767125,
    zoom: Annotated[int, Field(description="Map zoom level.", ge=1, le=18)] = 13,
) -> PrefabApp:
    bbox = f"{lng - 0.03}%2C{lat - 0.02}%2C{lng + 0.03}%2C{lat + 0.02}"
    map_html = dedent(
        f"""\
        <!doctype html>
        <html>
        <body style="margin:0;">
          <iframe
            title="map"
            width="100%"
            height="460"
            frameborder="0"
            src="https://www.openstreetmap.org/export/embed.html?bbox={bbox}&marker={lat}%2C{lng}&zoom={zoom}">
          </iframe>
        </body>
        </html>
        """
    )
    with PrefabApp() as app:
        with Column(gap=4, css_class="w-full max-w-full min-w-0 overflow-hidden p-4"):
            Heading("Map Example")
            Text(f"Center: {lat:.5f}, {lng:.5f} / Zoom: {zoom}")
            with Card(css_class="w-full max-w-full min-w-0 overflow-hidden"):
                with CardContent(css_class="p-0 overflow-x-auto"):
                    Embed(
                        html=map_html,
                        width="100%",
                        height="460px",
                        sandbox="allow-scripts allow-same-origin",
                    )
    return app
