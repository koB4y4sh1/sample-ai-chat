"""出品アシスト用の FastMCP サーバー定義。"""

from __future__ import annotations

from typing import Annotated

from fastmcp import FastMCP
from mcp.types import ToolAnnotations
from prefab_ui.app import PrefabApp
from pydantic import Field
from servers.listing_assist.mcp_apps import listing_assist_app
from servers.listing_assist.models import (
    ItemCondition,
    ListingDraftPackage,
    MarketplaceName,
    MarketplacePostingChecklist,
)
from servers.listing_assist.repository import ListingAssistRepository
from shared.icons import (
    CREATE_LISTING_DRAFT_TOOL_ICONS,
    GET_LISTING_DRAFT_TOOL_ICONS,
    GET_MARKETPLACE_POSTING_CHECKLIST_TOOL_ICONS,
    LISTING_ASSIST_SERVER_ICONS,
)


def create_listing_assist_server(repository: ListingAssistRepository | None = None) -> FastMCP:
    """出品アシストサーバーを生成する。"""

    listing_repository = repository or ListingAssistRepository()
    server = FastMCP(
        "Marketplace Listing Assist",
        instructions=(
            "Use this server to turn a seller's item details into marketplace-ready drafts, "
            "pricing guidance, and posting checklists that can later power a rich MCP App."
        ),
        icons=LISTING_ASSIST_SERVER_ICONS,
        version="0.1.0",
    )

    @server.tool(
        description=(
            "これからフリマやリユースアプリへ出品したいときに使用する。"
            "価格レンジ、掲載先ごとの本文下書き、写真チェックリストを含む出品ドラフトを返す。"
        ),
        annotations=ToolAnnotations(
            title="Create Listing Draft",
            readOnlyHint=False,
            destructiveHint=False,
            idempotentHint=False,
            openWorldHint=False,
        ),
        icons=CREATE_LISTING_DRAFT_TOOL_ICONS,
    )
    def create_listing_draft(
        item_name: Annotated[str, Field(description="出品する商品の名称。")],
        category: Annotated[str, Field(description="商品カテゴリ。検索タグや本文下書きに使う。")],
        brand: Annotated[
            str | None,
            Field(description="ブランド名やメーカー名。ブランド品でなければ未指定でもよい。"),
        ] = None,
        condition: Annotated[
            ItemCondition,
            Field(description="商品の状態。新品同様か使用感ありかなどを表す。"),
        ] = "good",
        included_accessories: Annotated[
            list[str] | None,
            Field(description="箱、ケーブル、保証書など同梱できる付属品一覧。"),
        ] = None,
        visible_flaws: Annotated[
            list[str] | None,
            Field(description="傷、汚れ、欠品など購入前に明示すべき懸念点。"),
        ] = None,
        desired_price_jpy: Annotated[
            int | None,
            Field(description="売りたい希望価格。未指定なら状態と付属品から推定する。"),
        ] = None,
        target_marketplaces: Annotated[
            list[MarketplaceName] | None,
            Field(description="出品候補のマーケット一覧。未指定なら主要掲載先をまとめて作る。"),
        ] = None,
    ) -> ListingDraftPackage:
        return listing_repository.create_draft(
            item_name,
            category,
            brand,
            condition,
            included_accessories,
            visible_flaws,
            desired_price_jpy,
            target_marketplaces,
        )

    @server.tool(
        description=("既に作った出品ドラフトを見直したいときに使用する。価格案、本文、次アクションを含む保存済みドラフトをそのまま返す。"),
        annotations=ToolAnnotations(
            title="Get Listing Draft",
            readOnlyHint=True,
            idempotentHint=True,
            openWorldHint=False,
        ),
        icons=GET_LISTING_DRAFT_TOOL_ICONS,
    )
    def get_listing_draft(
        draft_id: Annotated[str, Field(description="再取得したい出品ドラフトの draft_id。")],
    ) -> ListingDraftPackage:
        return listing_repository.get_draft(draft_id)

    @server.tool(
        description=("特定マーケットへ実際に掲載する直前に確認事項を整理したいときに使用する。掲載先ごとのチェックリストと注意点を返す。"),
        annotations=ToolAnnotations(
            title="Get Marketplace Posting Checklist",
            readOnlyHint=True,
            idempotentHint=True,
            openWorldHint=False,
        ),
        icons=GET_MARKETPLACE_POSTING_CHECKLIST_TOOL_ICONS,
    )
    def get_marketplace_posting_checklist(
        draft_id: Annotated[str, Field(description="確認対象の出品ドラフトの draft_id。")],
        marketplace: Annotated[
            MarketplaceName,
            Field(description="実際に掲載する予定のマーケット名。"),
        ],
    ) -> MarketplacePostingChecklist:
        return listing_repository.get_posting_checklist(draft_id, marketplace)

    @server.tool(
        description="Open a FastMCP Prefab App for listing preview, price range, and marketplace checklists.",
        annotations=ToolAnnotations(
            title="Show Listing App",
            readOnlyHint=False,
            destructiveHint=False,
            idempotentHint=False,
            openWorldHint=False,
        ),
        icons=GET_LISTING_DRAFT_TOOL_ICONS,
        app=True,
    )
    def show_listing_app(
        item_name: Annotated[str, Field(description="Item name to render in the MCP App.")] = "Wireless headphones",
        category: Annotated[str, Field(description="Item category for listing drafts.")] = "Home electronics",
        brand: Annotated[
            str | None,
            Field(description="Brand or maker name."),
        ] = None,
        condition: Annotated[
            ItemCondition,
            Field(description="Item condition."),
        ] = "good",
        included_accessories: Annotated[
            list[str] | None,
            Field(description="Included accessories."),
        ] = None,
        visible_flaws: Annotated[
            list[str] | None,
            Field(description="Visible flaws buyers should know."),
        ] = None,
        desired_price_jpy: Annotated[
            int | None,
            Field(description="Desired selling price in JPY."),
        ] = None,
        target_marketplaces: Annotated[
            list[MarketplaceName] | None,
            Field(description="Target marketplaces to generate listing drafts for."),
        ] = None,
    ) -> PrefabApp:
        draft = listing_repository.create_draft(
            item_name,
            category,
            brand,
            condition,
            included_accessories,
            visible_flaws,
            desired_price_jpy,
            target_marketplaces,
        )
        return listing_assist_app(draft)

    return server


def main() -> None:
    """出品アシストサーバーを起動する。"""

    create_listing_assist_server().run()
