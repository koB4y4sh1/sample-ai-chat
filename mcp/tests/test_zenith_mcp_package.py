import os
from pathlib import Path
from typing import Any

import pytest
from fastmcp.utilities.inspect import inspect_fastmcp
from server import SERVER_NAMESPACES, create_server
from servers.document_review import ReviewRepository, create_document_review_server
from servers.listing_assist import ListingAssistRepository, create_listing_assist_server
from servers.map_view import create_map_view_server
from servers.map_view.server import GOOGLE_MAPS_API_KEY_ENV
from servers.quote_compare import QuoteCompareRepository, QuoteOfferInput, create_quote_compare_server
from servers.submission_pack import SubmissionPackRepository, create_submission_pack_server
from shared.env import load_env_file


def _tool_annotations_by_name(info: Any) -> dict[str, dict[str, object] | None]:
    return {tool.name: tool.annotations for tool in info.tools}


def _tool_icon_count_by_name(info: Any) -> dict[str, int]:
    return {tool.name: len(tool.icons or []) for tool in info.tools}


def test_mcp_server_module_importable() -> None:
    import server

    assert server.__doc__ is not None


def test_env_file_loader_sets_missing_values(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    env_file = tmp_path / ".env"
    env_file.write_text('GOOGLE_MAPS_API_KEY="test-browser-key"\n', encoding="utf-8")
    monkeypatch.delenv("GOOGLE_MAPS_API_KEY", raising=False)

    load_env_file(env_file)

    assert GOOGLE_MAPS_API_KEY_ENV == "GOOGLE_MAPS_API_KEY"
    assert os.environ["GOOGLE_MAPS_API_KEY"] == "test-browser-key"


async def test_root_server_mounts_expected_namespaced_tools() -> None:
    info = await inspect_fastmcp(create_server())

    assert {tool.name for tool in info.tools} == {
        "document_review_create_document_review",
        "document_review_get_document_review",
        "document_review_record_review_decision",
        "listing_assist_create_listing_draft",
        "listing_assist_get_listing_draft",
        "listing_assist_get_marketplace_posting_checklist",
        "map_view_show_google_map",
        "quote_compare_create_quote_comparison",
        "quote_compare_get_quote_comparison",
        "quote_compare_record_quote_decision",
        "submission_pack_create_submission_pack",
        "submission_pack_get_submission_pack",
        "submission_pack_update_submission_item_status",
    }
    assert _tool_icon_count_by_name(info) == {
        "document_review_create_document_review": 1,
        "document_review_get_document_review": 1,
        "document_review_record_review_decision": 1,
        "listing_assist_create_listing_draft": 1,
        "listing_assist_get_listing_draft": 1,
        "listing_assist_get_marketplace_posting_checklist": 1,
        "map_view_show_google_map": 1,
        "quote_compare_create_quote_comparison": 1,
        "quote_compare_get_quote_comparison": 1,
        "quote_compare_record_quote_decision": 1,
        "submission_pack_create_submission_pack": 1,
        "submission_pack_get_submission_pack": 1,
        "submission_pack_update_submission_item_status": 1,
    }


async def test_document_review_server_exposes_expected_tools() -> None:
    info = await inspect_fastmcp(create_document_review_server())

    assert {tool.name for tool in info.tools} == {
        "create_document_review",
        "get_document_review",
        "record_review_decision",
    }
    assert len(create_document_review_server().icons or []) == 1
    assert _tool_icon_count_by_name(info) == {
        "create_document_review": 1,
        "get_document_review": 1,
        "record_review_decision": 1,
    }
    assert _tool_annotations_by_name(info) == {
        "create_document_review": {
            "title": "Create Document Review",
            "readOnlyHint": False,
            "destructiveHint": False,
            "idempotentHint": False,
            "openWorldHint": False,
        },
        "get_document_review": {
            "title": "Get Document Review",
            "readOnlyHint": True,
            "destructiveHint": None,
            "idempotentHint": True,
            "openWorldHint": False,
        },
        "record_review_decision": {
            "title": "Record Review Decision",
            "readOnlyHint": False,
            "destructiveHint": True,
            "idempotentHint": True,
            "openWorldHint": False,
        },
    }


def test_document_review_repository_persists_decision() -> None:
    repository = ReviewRepository()
    review = repository.create_review(
        document_id="spec.html",
        original_text="alpha\nbeta\n",
        revised_text="alpha\ngamma\n",
        focus_points=["tone", "approval"],
    )

    decided = repository.record_decision(
        review.review_id,
        "request_changes",
        "Need tighter approval wording",
        ["Clarify the final reviewer"],
    )

    assert decided.change_count == 1
    assert decided.decision.decision == "request_changes"
    assert decided.decision.required_actions == ["Clarify the final reviewer"]


async def test_listing_assist_server_exposes_expected_tools() -> None:
    info = await inspect_fastmcp(create_listing_assist_server())

    assert {tool.name for tool in info.tools} == {
        "create_listing_draft",
        "get_listing_draft",
        "get_marketplace_posting_checklist",
    }
    assert len(create_listing_assist_server().icons or []) == 1
    assert _tool_icon_count_by_name(info) == {
        "create_listing_draft": 1,
        "get_listing_draft": 1,
        "get_marketplace_posting_checklist": 1,
    }
    assert _tool_annotations_by_name(info) == {
        "create_listing_draft": {
            "title": "Create Listing Draft",
            "readOnlyHint": False,
            "destructiveHint": False,
            "idempotentHint": False,
            "openWorldHint": False,
        },
        "get_listing_draft": {
            "title": "Get Listing Draft",
            "readOnlyHint": True,
            "destructiveHint": None,
            "idempotentHint": True,
            "openWorldHint": False,
        },
        "get_marketplace_posting_checklist": {
            "title": "Get Marketplace Posting Checklist",
            "readOnlyHint": True,
            "destructiveHint": None,
            "idempotentHint": True,
            "openWorldHint": False,
        },
    }


def test_listing_assist_repository_creates_draft_and_checklist() -> None:
    repository = ListingAssistRepository()
    draft = repository.create_draft(
        item_name="ワイヤレスヘッドホン",
        category="家電",
        brand="ZenSound",
        condition="good",
        included_accessories=["充電ケーブル", "収納ケース"],
        visible_flaws=["イヤーパッドに軽い使用感"],
        desired_price_jpy=9800,
        target_marketplaces=["mercari"],
    )
    checklist = repository.get_posting_checklist(draft.draft_id, "mercari")

    assert draft.marketplace_drafts[0].marketplace == "mercari"
    assert draft.price_suggestion.recommended_max_jpy >= draft.price_suggestion.recommended_min_jpy
    assert checklist.marketplace == "mercari"


async def test_map_view_server_exposes_google_maps_mcp_app() -> None:
    info = await inspect_fastmcp(create_map_view_server())

    assert {tool.name for tool in info.tools} == {"show_google_map"}
    assert _tool_icon_count_by_name(info) == {"show_google_map": 1}
    assert _tool_annotations_by_name(info) == {
        "show_google_map": {
            "title": "Show Google Map",
            "readOnlyHint": True,
            "destructiveHint": False,
            "idempotentHint": True,
            "openWorldHint": True,
        },
    }
    assert info.tools[0].meta is not None
    assert info.tools[0].meta["ui"]["resourceUri"] == "ui://zenith/google-map/view.html"
    assert "https://maps.googleapis.com" in info.tools[0].meta["ui"]["csp"]["resourceDomains"]
    assert [(resource.uri, resource.mime_type) for resource in info.resources] == [
        ("ui://zenith/google-map/view.html", "text/html;profile=mcp-app"),
    ]
    assert info.resources[0].meta is not None
    assert "https://maps.googleapis.com" in info.resources[0].meta["ui"]["csp"]["resourceDomains"]


async def test_quote_compare_server_exposes_expected_tools() -> None:
    info = await inspect_fastmcp(create_quote_compare_server())

    assert {tool.name for tool in info.tools} == {
        "create_quote_comparison",
        "get_quote_comparison",
        "record_quote_decision",
    }
    assert len(create_quote_compare_server().icons or []) == 1
    assert _tool_icon_count_by_name(info) == {
        "create_quote_comparison": 1,
        "get_quote_comparison": 1,
        "record_quote_decision": 1,
    }
    assert _tool_annotations_by_name(info) == {
        "create_quote_comparison": {
            "title": "Create Quote Comparison",
            "readOnlyHint": False,
            "destructiveHint": False,
            "idempotentHint": False,
            "openWorldHint": False,
        },
        "get_quote_comparison": {
            "title": "Get Quote Comparison",
            "readOnlyHint": True,
            "destructiveHint": None,
            "idempotentHint": True,
            "openWorldHint": False,
        },
        "record_quote_decision": {
            "title": "Record Quote Decision",
            "readOnlyHint": False,
            "destructiveHint": True,
            "idempotentHint": True,
            "openWorldHint": False,
        },
    }


def test_quote_compare_repository_records_selected_vendor() -> None:
    repository = QuoteCompareRepository()
    comparison = repository.create_comparison(
        procurement_title="動画制作見積",
        comparison_focus=["価格", "納期"],
        offers=[
            QuoteOfferInput(
                vendor_name="Studio A",
                total_price_jpy=520000,
                delivery_days=14,
                support_level="standard",
                payment_terms="検収後30日",
                included_items=["構成", "編集"],
                excluded_items=["ナレーション収録"],
            ),
            QuoteOfferInput(
                vendor_name="Studio B",
                total_price_jpy=610000,
                delivery_days=10,
                support_level="premium",
                payment_terms="発注時50%",
                included_items=["構成", "編集", "サムネイル"],
                excluded_items=[],
            ),
        ],
    )
    decided = repository.record_decision(comparison.comparison_id, "Studio B", "短納期を重視")

    assert decided.recommended_vendor == "Studio B"
    assert decided.offers[0].decision in {"selected", "not_selected"}


async def test_submission_pack_server_exposes_expected_tools() -> None:
    info = await inspect_fastmcp(create_submission_pack_server())

    assert {tool.name for tool in info.tools} == {
        "create_submission_pack",
        "get_submission_pack",
        "update_submission_item_status",
    }
    assert len(create_submission_pack_server().icons or []) == 1
    assert _tool_icon_count_by_name(info) == {
        "create_submission_pack": 1,
        "get_submission_pack": 1,
        "update_submission_item_status": 1,
    }
    assert _tool_annotations_by_name(info) == {
        "create_submission_pack": {
            "title": "Create Submission Pack",
            "readOnlyHint": False,
            "destructiveHint": False,
            "idempotentHint": False,
            "openWorldHint": False,
        },
        "get_submission_pack": {
            "title": "Get Submission Pack",
            "readOnlyHint": True,
            "destructiveHint": None,
            "idempotentHint": True,
            "openWorldHint": False,
        },
        "update_submission_item_status": {
            "title": "Update Submission Item Status",
            "readOnlyHint": False,
            "destructiveHint": True,
            "idempotentHint": False,
            "openWorldHint": False,
        },
    }


def test_submission_pack_repository_updates_item_status() -> None:
    repository = SubmissionPackRepository()
    pack = repository.create_pack(
        pack_name="助成金申請 2026 春",
        submission_type="助成金申請",
        required_items=["申請書", "本人確認書類", "収支計画"],
        optional_items=["補足説明資料"],
        due_date="2026-05-30",
    )
    updated = repository.update_item_status(
        pack.pack_id,
        pack.items[0].item_id,
        "ready",
        "草案と証憑を添付済み",
    )

    assert updated.ready_count == 1
    assert updated.items[0].notes == ["草案と証憑を添付済み"]


def test_create_server_mounts_expected_namespaces() -> None:
    assert SERVER_NAMESPACES == (
        "document_review",
        "listing_assist",
        "map_view",
        "quote_compare",
        "submission_pack",
    )
    server = create_server()
    assert server.name == "Zenith MCP"
    assert len(server.icons or []) == 1
