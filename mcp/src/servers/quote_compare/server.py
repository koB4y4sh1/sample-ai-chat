"""見積比較用の FastMCP サーバー定義。"""

from __future__ import annotations

from typing import Annotated

from fastmcp import FastMCP, FastMCPApp
from mcp.types import ToolAnnotations
from prefab_ui.app import PrefabApp
from pydantic import Field
from servers.quote_compare.mcp_apps import quote_comparison_app
from servers.quote_compare.models import QuoteComparison, QuoteOfferInput
from servers.quote_compare.repository import QuoteCompareRepository
from shared.icons import (
    CREATE_QUOTE_COMPARISON_TOOL_ICONS,
    GET_QUOTE_COMPARISON_TOOL_ICONS,
    QUOTE_COMPARE_SERVER_ICONS,
    RECORD_QUOTE_DECISION_TOOL_ICONS,
)


def _default_quote_offers() -> list[QuoteOfferInput]:
    return [
        QuoteOfferInput(
            vendor_name="Studio A",
            total_price_jpy=520000,
            delivery_days=14,
            support_level="standard",
            payment_terms="Net 30",
            included_items=["Planning", "Editing"],
            excluded_items=["Narration recording"],
        ),
        QuoteOfferInput(
            vendor_name="Studio B",
            total_price_jpy=610000,
            delivery_days=10,
            support_level="premium",
            payment_terms="50% on order",
            included_items=["Planning", "Editing", "Thumbnail"],
            excluded_items=[],
        ),
    ]


def create_quote_compare_server(repository: QuoteCompareRepository | None = None) -> FastMCP:
    """見積比較サーバーを生成する。"""

    quote_repository = repository or QuoteCompareRepository()
    app = FastMCPApp("Quote Comparison App")
    server = FastMCP(
        "Quote Comparison Workspace",
        instructions=(
            "Use this server to compare multiple vendor quotes, surface trade-offs, and "
            "record a final selection with rationale for a review-oriented MCP App."
        ),
        icons=QUOTE_COMPARE_SERVER_ICONS,
        providers=[app],
        version="0.1.0",
    )

    @app.tool()
    def record_quote_decision_from_app(
        comparison_id: Annotated[str, Field(description="App decision target comparison_id.")],
        selected_vendor_name: Annotated[str, Field(description="Selected vendor name.")],
        rationale: Annotated[str | None, Field(description="Decision rationale from the App.")] = None,
    ) -> QuoteComparison:
        return quote_repository.record_decision(comparison_id, selected_vendor_name, rationale)

    @server.tool(
        description=(
            "複数ベンダーの見積を横並びで比較し、価格・納期・サポート差を整理したいときに使用する。"
            "比較サマリー、推奨候補、交渉ポイントを含む見積比較結果を返す。"
        ),
        annotations=ToolAnnotations(
            title="Create Quote Comparison",
            readOnlyHint=False,
            destructiveHint=False,
            idempotentHint=False,
            openWorldHint=False,
        ),
        icons=CREATE_QUOTE_COMPARISON_TOOL_ICONS,
    )
    def create_quote_comparison(
        procurement_title: Annotated[str, Field(description="比較対象となる調達や案件のタイトル。")],
        comparison_focus: Annotated[
            list[str] | None,
            Field(description="特に重視する観点。価格、納期、保守などを列挙する。"),
        ] = None,
        offers: Annotated[
            list[QuoteOfferInput] | None,
            Field(description="比較したい各ベンダーの見積情報一覧。"),
        ] = None,
    ) -> QuoteComparison:
        return quote_repository.create_comparison(procurement_title, comparison_focus, offers or [])

    @server.tool(
        description=("比較後に採用ベンダーを決めて、その理由を残したいときに使用する。採用結果を反映した更新後の見積比較結果を返す。"),
        annotations=ToolAnnotations(
            title="Record Quote Decision",
            readOnlyHint=False,
            destructiveHint=True,
            idempotentHint=True,
            openWorldHint=False,
        ),
        icons=RECORD_QUOTE_DECISION_TOOL_ICONS,
    )
    def record_quote_decision(
        comparison_id: Annotated[str, Field(description="決定を記録する対象の comparison_id。")],
        selected_vendor_name: Annotated[
            str,
            Field(description="採用すると決めたベンダー名。"),
        ],
        rationale: Annotated[
            str | None,
            Field(description="選定理由や承認時のコメント。"),
        ] = None,
    ) -> QuoteComparison:
        return quote_repository.record_decision(comparison_id, selected_vendor_name, rationale)

    @server.tool(
        description=("既に作成した見積比較を見直したいときに使用する。保存済みの比較結果と選定状況をそのまま返す。"),
        annotations=ToolAnnotations(
            title="Get Quote Comparison",
            readOnlyHint=True,
            idempotentHint=True,
            openWorldHint=False,
        ),
        icons=GET_QUOTE_COMPARISON_TOOL_ICONS,
    )
    def get_quote_comparison(
        comparison_id: Annotated[str, Field(description="再取得したい見積比較の comparison_id。")],
    ) -> QuoteComparison:
        return quote_repository.get_comparison(comparison_id)

    @app.ui(
        name="show_quote_comparison_app",
        description="Open a FastMCP Prefab App for comparing quote offers and recording the selected vendor.",
        annotations=ToolAnnotations(
            title="Show Quote Comparison App",
            readOnlyHint=False,
            destructiveHint=False,
            idempotentHint=False,
            openWorldHint=False,
        ),
        icons=GET_QUOTE_COMPARISON_TOOL_ICONS,
    )
    def show_quote_comparison_app(
        procurement_title: Annotated[
            str,
            Field(description="Quote comparison title to render in the MCP App."),
        ] = "Sample quote comparison",
        comparison_focus: Annotated[
            list[str] | None,
            Field(description="Evaluation focus such as price, delivery, support, quality, or risk."),
        ] = None,
        offers: Annotated[
            list[QuoteOfferInput] | None,
            Field(description="Vendor quote inputs to compare. If omitted, a demo comparison is shown."),
        ] = None,
    ) -> PrefabApp:
        comparison = quote_repository.create_comparison(
            procurement_title,
            comparison_focus or ["price", "delivery", "support"],
            offers or _default_quote_offers(),
        )
        return quote_comparison_app(
            comparison,
            record_quote_decision_from_app,
        )

    return server


def main() -> None:
    """見積比較サーバーを起動する。"""

    create_quote_compare_server().run()
