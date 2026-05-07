"""FastMCP Apps examples server for Zenith MCP."""

from __future__ import annotations

from typing import Literal

from fastmcp import FastMCP
from fastmcp.apps.approval import Approval
from fastmcp.apps.choice import Choice
from fastmcp.apps.file_upload import FileUpload
from fastmcp.apps.form import FormInput
from fastmcp.apps.generative import GenerativeUI
from pydantic import BaseModel, Field
from servers.apps_example.ui import (
    dashbord_app,
    inventory_app,
    map_app,
    monitor_app,
    quize_app,
)


class BugReport(BaseModel):
    title: str = Field(description="Brief summary")
    severity: Literal["low", "medium", "high", "critical"]
    description: str = Field(
        description="Detailed description",
        json_schema_extra={"ui": {"type": "textarea"}},
    )


def create_apps_example_mcp() -> FastMCP:
    """Create a FastMCP server that hosts MCP Apps examples."""

    mcp = FastMCP(
        "Apps Example",
        instructions=(
            "Use this server to demonstrate MCP Apps examples inspired by FastMCP apps demos. "
            "Choose a tool based on requested UI: showcase, dashboard, monitor, quiz, map, "
            "file upload, approval, choice, form input, and generative UI."
        ),
        version="0.1.0",
        providers=[
            dashbord_app,
            inventory_app,
            monitor_app,
            quize_app,
            map_app,
        ],
    )

    # Provided FastMCPApps
    mcp.add_provider(Approval())
    mcp.add_provider(Choice())
    mcp.add_provider(FormInput(model=BugReport))
    mcp.add_provider(FileUpload())
    mcp.add_provider(GenerativeUI())

    return mcp


def main() -> None:
    create_apps_example_mcp().run()
