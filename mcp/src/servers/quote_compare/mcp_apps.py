"""MCP App UI for quote comparison."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any, cast

from prefab_ui.actions import ShowToast
from prefab_ui.actions.mcp import CallTool
from prefab_ui.app import PrefabApp
from prefab_ui.components import (
    Badge,
    Button,
    Card,
    CardContent,
    Column,
    DataTable,
    DataTableColumn,
    Heading,
    Row,
    Text,
)
from prefab_ui.components.charts import BarChart, ChartSeries
from prefab_ui.components.data_table import ExpandableRow


def quote_comparison_app(
    comparison: Any,
    record_decision: Callable[..., Any],
) -> PrefabApp:
    rows = cast(
        list[dict[str, Any] | ExpandableRow],
        [
            {
                "vendor": offer.vendor_name,
                "price": f"JPY {offer.total_price_jpy:,}",
                "delivery": f"{offer.delivery_days} days",
                "support": offer.support_level,
                "score": offer.score,
                "decision": offer.decision,
            }
            for offer in comparison.offers
        ],
    )
    chart_rows = [{"vendor": offer.vendor_name, "price": offer.total_price_jpy} for offer in comparison.offers]

    with (
        PrefabApp() as app,
        Column(
            gap=4,
            css_class="w-full max-w-full min-w-0 overflow-hidden p-4",
        ),
    ):
        Heading(comparison.procurement_title)
        Text(comparison.summary)
        with Row(gap=2):
            for focus in comparison.comparison_focus:
                Badge(focus, variant="outline")

        with Card(css_class="w-full max-w-full min-w-0 overflow-hidden"):
            with CardContent(css_class="max-w-full min-w-0 overflow-hidden"):
                BarChart(
                    data=chart_rows,
                    series=[ChartSeries(dataKey="price", label="Price")],
                    xAxis="vendor",
                    height=240,
                )

        with Card(css_class="w-full max-w-full min-w-0 overflow-hidden"):
            with CardContent(css_class="max-w-full min-w-0 overflow-x-auto"):
                DataTable(
                    columns=[
                        DataTableColumn(key="vendor", header="Vendor", sortable=True),
                        DataTableColumn(key="price", header="Price", sortable=True),
                        DataTableColumn(key="delivery", header="Delivery", sortable=True),
                        DataTableColumn(key="support", header="Support", sortable=True),
                        DataTableColumn(key="score", header="Score", sortable=True),
                        DataTableColumn(key="decision", header="Decision", sortable=True),
                    ],
                    rows=rows,
                    search=True,
                    paginated=True,
                    pageSize=5,
                )

        with Row(gap=2):
            for offer in comparison.offers:
                Button(
                    f"Select {offer.vendor_name}",
                    variant="secondary",
                    onClick=CallTool(
                        record_decision,
                        arguments={
                            "comparison_id": comparison.comparison_id,
                            "selected_vendor_name": offer.vendor_name,
                            "rationale": "Selected from the Quote Comparison MCP App.",
                        },
                        onSuccess=ShowToast("Quote decision recorded.", variant="success"),
                    ),
                )

        with Column(gap=2):
            Text("Negotiation Points", css_class="text-sm font-medium")
            for point in comparison.negotiation_points:
                Text(f"- {point}")
            Text("Current Recommendation", css_class="text-sm font-medium")
            Text(comparison.recommended_vendor or "Not selected")
            Text(comparison.decision_rationale or "Decision rationale is pending.")

    return app
