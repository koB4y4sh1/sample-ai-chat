"""MCP App UI for submission packs."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any, cast

from prefab_ui.actions import ShowToast
from prefab_ui.actions.mcp import CallTool
from prefab_ui.app import PrefabApp
from prefab_ui.components import (
    H3,
    Button,
    Card,
    CardContent,
    CardHeader,
    Column,
    DataTable,
    DataTableColumn,
    Grid,
    Heading,
    Progress,
    Row,
    Text,
)
from prefab_ui.components.data_table import ExpandableRow


def submission_pack_app(
    pack: Any,
    update_item_status: Callable[..., Any],
) -> PrefabApp:
    total = max(1, len([item for item in pack.items if item.required]))
    ready_percent = round((pack.ready_count / total) * 100)
    rows = cast(
        list[dict[str, Any] | ExpandableRow],
        [
            {
                "item": item.label,
                "required": "Required" if item.required else "Optional",
                "status": item.status,
                "notes": "; ".join(item.notes),
            }
            for item in pack.items
        ],
    )

    with (
        PrefabApp() as app,
        Column(
            gap=4,
            css_class="w-full max-w-full min-w-0 overflow-hidden p-4",
        ),
    ):
        Heading(pack.pack_name)
        Text(pack.summary)

        with Grid(min_column_width="140px", gap=4):
            with Card(css_class="min-w-0"):
                with CardHeader():
                    H3("Ready")
                with CardContent():
                    Text(str(pack.ready_count), bold=True)
            with Card(css_class="min-w-0"):
                with CardHeader():
                    H3("Missing")
                with CardContent():
                    Text(str(pack.missing_count), bold=True)
            with Card(css_class="min-w-0"):
                with CardHeader():
                    H3("Due")
                with CardContent():
                    Text(pack.due_date or "No due date")

        Progress(value=ready_percent, variant="success")

        with Card(css_class="w-full max-w-full min-w-0 overflow-hidden"):
            with CardContent(css_class="max-w-full min-w-0 overflow-x-auto"):
                DataTable(
                    columns=[
                        DataTableColumn(key="item", header="Item", sortable=True),
                        DataTableColumn(key="required", header="Required", sortable=True),
                        DataTableColumn(key="status", header="Status", sortable=True),
                        DataTableColumn(key="notes", header="Notes"),
                    ],
                    rows=rows,
                    search=True,
                    paginated=True,
                    pageSize=5,
                )

        with Column(gap=2):
            for item in pack.items:
                with Row(gap=2, align="center"):
                    Text(item.label)
                    Button(
                        "Mark ready",
                        size="sm",
                        variant="secondary",
                        onClick=CallTool(
                            update_item_status,
                            arguments={
                                "pack_id": pack.pack_id,
                                "item_id": item.item_id,
                                "status": "ready",
                                "note": "Marked ready from the Submission Pack MCP App.",
                            },
                            onSuccess=ShowToast("Submission item updated.", variant="success"),
                        ),
                    )

        Text("Next Actions", css_class="text-sm font-medium")
        for action in pack.next_actions:
            Text(f"- {action}")

    return app
