import json
import os
from pathlib import Path
from typing import Any

import pytest
from fastmcp import Client
from fastmcp.utilities.inspect import inspect_fastmcp
from server import SERVER_NAMESPACES, create_server
from servers.apps_example import create_apps_example_mcp
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


def _tool_input_schema(info: Any, tool_name: str) -> dict[str, Any]:
    return next(tool.input_schema for tool in info.tools if tool.name == tool_name)


def _assert_app_tool_uses_natural_inputs(
    info: Any,
    tool_name: str,
    expected_properties: set[str],
    forbidden_properties: set[str],
) -> None:
    schema = _tool_input_schema(info, tool_name)
    properties = set(schema["properties"])

    assert expected_properties <= properties
    assert properties.isdisjoint(forbidden_properties)
    assert schema.get("required", []) == []


def _assert_prefab_app_tool(info: Any, tool_name: str) -> None:
    tool = next(tool for tool in info.tools if tool.name == tool_name)

    assert tool.meta is not None
    assert tool.meta["ui"]["resourceUri"].startswith("ui://prefab/tool/")
    assert any(resource.uri == tool.meta["ui"]["resourceUri"] and resource.mime_type == "text/html;profile=mcp-app" for resource in info.resources)


def test_mcp_server_module_importable() -> None:
    import server

    assert server.__doc__ is not None


def test_mcp_app_ui_modules_live_under_each_server() -> None:
    src_root = Path(__file__).parents[1] / "src"

    assert not (src_root / "shared" / "prefab_apps.py").exists()
    for server_name in [
        "document_review",
        "listing_assist",
        "quote_compare",
        "submission_pack",
    ]:
        assert (src_root / "servers" / server_name / "mcp_apps.py").exists()


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
        "apps_example_choose",
        "apps_example_collect_bugreport",
        "apps_example_file_manager",
        "apps_example_generate_prefab_ui",
        "apps_example_inventory_manager",
        "apps_example_list_files",
        "apps_example_read_file",
        "apps_example_request_approval",
        "apps_example_search_prefab_components",
        "apps_example_show_sales_dashboard_app",
        "apps_example_show_system_monitor_app",
        "apps_example_show_quiz_app",
        "apps_example_show_map_app",
        "document_review_create_document_review",
        "document_review_show_document_review_app",
        "document_review_get_document_review",
        "document_review_record_review_decision",
        "listing_assist_create_listing_draft",
        "listing_assist_show_listing_app",
        "listing_assist_get_listing_draft",
        "listing_assist_get_marketplace_posting_checklist",
        "map_view_show_google_map",
        "quote_compare_create_quote_comparison",
        "quote_compare_show_quote_comparison_app",
        "quote_compare_get_quote_comparison",
        "quote_compare_record_quote_decision",
        "submission_pack_create_submission_pack",
        "submission_pack_show_submission_pack_app",
        "submission_pack_get_submission_pack",
        "submission_pack_update_submission_item_status",
    }
    assert _tool_icon_count_by_name(info) == {
        "apps_example_choose": 0,
        "apps_example_collect_bugreport": 0,
        "apps_example_file_manager": 0,
        "apps_example_generate_prefab_ui": 0,
        "apps_example_inventory_manager": 0,
        "apps_example_list_files": 0,
        "apps_example_read_file": 0,
        "apps_example_request_approval": 0,
        "apps_example_search_prefab_components": 0,
        "apps_example_show_sales_dashboard_app": 0,
        "apps_example_show_system_monitor_app": 0,
        "apps_example_show_quiz_app": 0,
        "apps_example_show_map_app": 0,
        "document_review_create_document_review": 1,
        "document_review_show_document_review_app": 1,
        "document_review_get_document_review": 1,
        "document_review_record_review_decision": 1,
        "listing_assist_create_listing_draft": 1,
        "listing_assist_show_listing_app": 1,
        "listing_assist_get_listing_draft": 1,
        "listing_assist_get_marketplace_posting_checklist": 1,
        "map_view_show_google_map": 1,
        "quote_compare_create_quote_comparison": 1,
        "quote_compare_show_quote_comparison_app": 1,
        "quote_compare_get_quote_comparison": 1,
        "quote_compare_record_quote_decision": 1,
        "submission_pack_create_submission_pack": 1,
        "submission_pack_show_submission_pack_app": 1,
        "submission_pack_get_submission_pack": 1,
        "submission_pack_update_submission_item_status": 1,
    }
    map_tool = next(tool for tool in info.tools if tool.name == "map_view_show_google_map")
    assert map_tool.meta is not None
    _assert_prefab_app_tool(info, "apps_example_choose")
    _assert_prefab_app_tool(info, "apps_example_collect_bugreport")
    _assert_prefab_app_tool(info, "apps_example_file_manager")
    _assert_prefab_app_tool(info, "apps_example_inventory_manager")
    _assert_prefab_app_tool(info, "apps_example_request_approval")
    _assert_prefab_app_tool(info, "apps_example_show_sales_dashboard_app")
    _assert_prefab_app_tool(info, "apps_example_show_system_monitor_app")
    _assert_prefab_app_tool(info, "apps_example_show_quiz_app")
    _assert_prefab_app_tool(info, "apps_example_show_map_app")
    _assert_prefab_app_tool(info, "map_view_show_google_map")


async def test_apps_example_server_exposes_expected_tools() -> None:
    info = await inspect_fastmcp(create_apps_example_mcp())

    assert {tool.name for tool in info.tools} == {
        "choose",
        "collect_bugreport",
        "file_manager",
        "generate_prefab_ui",
        "inventory_manager",
        "list_files",
        "read_file",
        "request_approval",
        "search_prefab_components",
        "show_sales_dashboard_app",
        "show_system_monitor_app",
        "show_quiz_app",
        "show_map_app",
    }
    assert _tool_icon_count_by_name(info) == {
        "choose": 0,
        "collect_bugreport": 0,
        "file_manager": 0,
        "generate_prefab_ui": 0,
        "inventory_manager": 0,
        "list_files": 0,
        "read_file": 0,
        "request_approval": 0,
        "search_prefab_components": 0,
        "show_sales_dashboard_app": 0,
        "show_system_monitor_app": 0,
        "show_quiz_app": 0,
        "show_map_app": 0,
    }
    assert _tool_annotations_by_name(info) == {
        "choose": None,
        "collect_bugreport": None,
        "file_manager": None,
        "generate_prefab_ui": None,
        "inventory_manager": None,
        "list_files": None,
        "read_file": None,
        "request_approval": None,
        "search_prefab_components": None,
        "show_sales_dashboard_app": {
            "title": "Show Sales Dashboard App",
            "readOnlyHint": True,
            "destructiveHint": False,
            "idempotentHint": True,
            "openWorldHint": False,
        },
        "show_system_monitor_app": {
            "title": "Show System Monitor App",
            "readOnlyHint": True,
            "destructiveHint": False,
            "idempotentHint": True,
            "openWorldHint": False,
        },
        "show_quiz_app": {
            "title": "Show Quiz App",
            "readOnlyHint": False,
            "destructiveHint": False,
            "idempotentHint": False,
            "openWorldHint": False,
        },
        "show_map_app": {
            "title": "Show Map App",
            "readOnlyHint": True,
            "destructiveHint": False,
            "idempotentHint": True,
            "openWorldHint": True,
        },
    }
    _assert_prefab_app_tool(info, "choose")
    _assert_prefab_app_tool(info, "collect_bugreport")
    _assert_prefab_app_tool(info, "file_manager")
    _assert_prefab_app_tool(info, "inventory_manager")
    _assert_prefab_app_tool(info, "request_approval")
    _assert_prefab_app_tool(info, "show_sales_dashboard_app")
    _assert_prefab_app_tool(info, "show_system_monitor_app")
    _assert_prefab_app_tool(info, "show_quiz_app")
    _assert_prefab_app_tool(info, "show_map_app")


async def test_document_review_server_exposes_expected_tools() -> None:
    info = await inspect_fastmcp(create_document_review_server())

    assert {tool.name for tool in info.tools} == {
        "create_document_review",
        "show_document_review_app",
        "get_document_review",
        "record_review_decision",
    }
    assert len(create_document_review_server().icons or []) == 1
    assert _tool_icon_count_by_name(info) == {
        "create_document_review": 1,
        "show_document_review_app": 1,
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
        "show_document_review_app": {
            "title": "Show Document Review App",
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
    _assert_prefab_app_tool(info, "show_document_review_app")
    _assert_app_tool_uses_natural_inputs(
        info,
        "show_document_review_app",
        {"document_id", "original_text", "revised_text", "focus_points"},
        {"review_id"},
    )


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
        "show_listing_app",
        "get_listing_draft",
        "get_marketplace_posting_checklist",
    }
    assert len(create_listing_assist_server().icons or []) == 1
    assert _tool_icon_count_by_name(info) == {
        "create_listing_draft": 1,
        "show_listing_app": 1,
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
        "show_listing_app": {
            "title": "Show Listing App",
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
    _assert_prefab_app_tool(info, "show_listing_app")
    _assert_app_tool_uses_natural_inputs(
        info,
        "show_listing_app",
        {"item_name", "category", "condition", "target_marketplaces"},
        {"draft_id"},
    )


def test_listing_assist_repository_creates_draft_and_checklist() -> None:
    repository = ListingAssistRepository()
    draft = repository.create_draft(
        item_name="Wireless headphones",
        category="Home electronics",
        brand="ZenSound",
        condition="good",
        included_accessories=["Charging cable", "Storage case"],
        visible_flaws=["Light wear on ear pads"],
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
    _assert_prefab_app_tool(info, "show_google_map")


async def test_quote_compare_server_exposes_expected_tools() -> None:
    info = await inspect_fastmcp(create_quote_compare_server())

    assert {tool.name for tool in info.tools} == {
        "create_quote_comparison",
        "show_quote_comparison_app",
        "get_quote_comparison",
        "record_quote_decision",
    }
    assert len(create_quote_compare_server().icons or []) == 1
    assert _tool_icon_count_by_name(info) == {
        "create_quote_comparison": 1,
        "show_quote_comparison_app": 1,
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
        "show_quote_comparison_app": {
            "title": "Show Quote Comparison App",
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
    _assert_prefab_app_tool(info, "show_quote_comparison_app")
    _assert_app_tool_uses_natural_inputs(
        info,
        "show_quote_comparison_app",
        {"procurement_title", "comparison_focus", "offers"},
        {"comparison_id"},
    )


def test_quote_compare_repository_records_selected_vendor() -> None:
    repository = QuoteCompareRepository()
    comparison = repository.create_comparison(
        procurement_title="Video production quote",
        comparison_focus=["price", "delivery"],
        offers=[
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
        ],
    )
    decided = repository.record_decision(comparison.comparison_id, "Studio B", "Prioritized shorter delivery")

    assert decided.recommended_vendor == "Studio B"
    assert decided.offers[0].decision in {"selected", "not_selected"}


async def test_submission_pack_server_exposes_expected_tools() -> None:
    info = await inspect_fastmcp(create_submission_pack_server())

    assert {tool.name for tool in info.tools} == {
        "create_submission_pack",
        "show_submission_pack_app",
        "get_submission_pack",
        "update_submission_item_status",
    }
    assert len(create_submission_pack_server().icons or []) == 1
    assert _tool_icon_count_by_name(info) == {
        "create_submission_pack": 1,
        "show_submission_pack_app": 1,
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
        "show_submission_pack_app": {
            "title": "Show Submission Pack App",
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
    _assert_prefab_app_tool(info, "show_submission_pack_app")
    _assert_app_tool_uses_natural_inputs(
        info,
        "show_submission_pack_app",
        {"pack_name", "submission_type", "required_items", "optional_items", "due_date"},
        {"pack_id"},
    )


async def test_mcp_app_tools_open_with_default_inputs() -> None:
    async with Client(create_server()) as client:
        for tool_name in [
            "apps_example_inventory_manager",
            "apps_example_show_sales_dashboard_app",
            "apps_example_show_system_monitor_app",
            "apps_example_show_quiz_app",
            "apps_example_show_map_app",
            "quote_compare_show_quote_comparison_app",
            "submission_pack_show_submission_pack_app",
            "document_review_show_document_review_app",
            "listing_assist_show_listing_app",
        ]:
            result = await client.call_tool(tool_name, {})

            assert result.structured_content is not None
            assert result.structured_content["$prefab"]["version"]
            assert result.structured_content["view"]
            serialized = json.dumps(result.structured_content)
            assert "1fr 2fr" not in serialized
            assert "max-w-full" in serialized
            assert "overflow-x-auto" in serialized


def test_submission_pack_repository_updates_item_status() -> None:
    repository = SubmissionPackRepository()
    pack = repository.create_pack(
        pack_name="Grant application 2026",
        submission_type="grant",
        required_items=["Application form", "Identity document", "Budget plan"],
        optional_items=["Supplemental notes"],
        due_date="2026-05-30",
    )
    updated = repository.update_item_status(
        pack.pack_id,
        pack.items[0].item_id,
        "ready",
        "Draft and evidence attached",
    )

    assert updated.ready_count == 1
    assert updated.items[0].notes == ["Draft and evidence attached"]


def test_create_server_mounts_expected_namespaces() -> None:
    assert SERVER_NAMESPACES == (
        "apps_example",
        "document_review",
        "listing_assist",
        "map_view",
        "quote_compare",
        "submission_pack",
    )
    server = create_server()
    assert server.name == "Zenith MCP"
    assert len(server.icons or []) == 1
