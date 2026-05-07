"""Zenith の MCP サーフェスを束ねる mounted root FastMCP サーバー。"""

from __future__ import annotations

import asyncio
from typing import Final

from fastmcp import FastMCP
from servers.apps_example import create_apps_example_mcp
from servers.document_review import create_document_review_server
from servers.listing_assist import create_listing_assist_server
from servers.map_view import create_map_view_server
from servers.quote_compare import create_quote_compare_server
from servers.submission_pack import create_submission_pack_server
from shared.icons import ROOT_SERVER_ICONS

SERVER_NAMESPACES: Final[tuple[str, ...]] = (
    "apps_example",
    "document_review",
    "listing_assist",
    "map_view",
    "quote_compare",
    "submission_pack",
)
STREAMABLE_HTTP_HOST: Final = "127.0.0.1"
STREAMABLE_HTTP_PORT: Final = 8101
STREAMABLE_HTTP_PATH: Final = "/mcp"


def create_server() -> FastMCP:
    """各ドメインサーバーを mount した複合 MCP サーバーを生成する。"""

    server = FastMCP(
        "Zenith MCP",
        instructions=(
            "Mounted FastMCP server for Zenith AI Chat. Use the apps_example, document_review, "
            "listing_assist, map_view, quote_compare, and submission_pack namespaces to access "
            "domain tools."
        ),
        icons=ROOT_SERVER_ICONS,
        version="0.1.0",
    )
    server.mount(create_apps_example_mcp(), namespace="apps_example")
    server.mount(create_document_review_server(), namespace="document_review")
    server.mount(create_listing_assist_server(), namespace="listing_assist")
    server.mount(create_map_view_server(), namespace="map_view")
    server.mount(create_quote_compare_server(), namespace="quote_compare")
    server.mount(create_submission_pack_server(), namespace="submission_pack")
    return server


def main() -> None:
    """mounted した複合サーバーを stdio で起動する。"""

    create_server().run()


async def run_streamable_http() -> None:
    """mounted した複合サーバーを streamable HTTP で起動する。"""

    await create_server().run_http_async(
        transport="streamable-http",
        host=STREAMABLE_HTTP_HOST,
        port=STREAMABLE_HTTP_PORT,
        path=STREAMABLE_HTTP_PATH,
    )


def main_http() -> None:
    """streamable HTTP 用の起動エントリポイントを実行する。"""

    asyncio.run(run_streamable_http())
