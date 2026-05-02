"""MCP App UI for document review."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any, cast

from prefab_ui.actions import ShowToast
from prefab_ui.actions.mcp import CallTool
from prefab_ui.app import PrefabApp
from prefab_ui.components import (
    H3,
    Badge,
    Button,
    Card,
    CardContent,
    CardHeader,
    Column,
    DataTable,
    DataTableColumn,
    Grid,
    Heading,
    Row,
    Text,
)
from prefab_ui.components.data_table import ExpandableRow


def document_review_app(
    review: Any,
    record_decision: Callable[..., Any],
) -> PrefabApp:
    rows = cast(
        list[dict[str, Any] | ExpandableRow],
        [
            {
                "type": hunk.change_type,
                "before": hunk.original_excerpt,
                "after": hunk.revised_excerpt,
            }
            for hunk in review.hunks
        ],
    )

    with (
        PrefabApp() as app,
        Column(
            gap=4,
            cssClass="w-full max-w-full min-w-0 overflow-hidden p-4",
        ),
    ):
        Heading(f"Document Review: {review.document_id}")
        Text(review.summary)

        with Grid(min_column_width="140px", gap=4):
            with Card(cssClass="min-w-0"):
                with CardHeader():
                    H3("Changes")
                with CardContent():
                    Text(str(review.change_count), bold=True)
            with Card(cssClass="min-w-0"):
                with CardHeader():
                    H3("Lines")
                with CardContent():
                    Text(str(review.changed_line_count), bold=True)
            with Card(cssClass="min-w-0"):
                with CardHeader():
                    H3("Decision")
                with CardContent():
                    Badge(review.decision.decision, variant="info")

        with Card(cssClass="w-full max-w-full min-w-0 overflow-hidden"):
            with CardContent(cssClass="max-w-full min-w-0 overflow-x-auto"):
                DataTable(
                    columns=[
                        DataTableColumn(key="type", header="Type", sortable=True),
                        DataTableColumn(key="before", header="Before"),
                        DataTableColumn(key="after", header="After"),
                    ],
                    rows=rows,
                    search=True,
                )

        with Row(gap=2):
            Button(
                "Approve",
                variant="success",
                onClick=CallTool(
                    record_decision,
                    arguments={
                        "review_id": review.review_id,
                        "decision": "approved",
                        "rationale": "Approved from the Document Review MCP App.",
                        "required_actions": [],
                    },
                    onSuccess=ShowToast("Review approved.", variant="success"),
                ),
            )
            Button(
                "Request changes",
                variant="warning",
                onClick=CallTool(
                    record_decision,
                    arguments={
                        "review_id": review.review_id,
                        "decision": "request_changes",
                        "rationale": "Changes requested from the Document Review MCP App.",
                        "required_actions": review.focus_points,
                    },
                    onSuccess=ShowToast("Review decision recorded.", variant="success"),
                ),
            )

        with Column(gap=2):
            Text("Focus Points", cssClass="text-sm font-medium")
            for point in review.focus_points:
                Text(f"- {point}")
            Text("Required Actions", cssClass="text-sm font-medium")
            for action in review.decision.required_actions:
                Text(f"- {action}")

    return app
