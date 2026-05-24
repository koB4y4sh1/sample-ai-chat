"""MCP App UI for listing assist."""

from __future__ import annotations

from typing import Any, cast

from prefab_ui.app import PrefabApp
from prefab_ui.components import (
    H3,
    Card,
    CardContent,
    CardHeader,
    Column,
    DataTable,
    DataTableColumn,
    Heading,
    Separator,
    Text,
)
from prefab_ui.components.charts import BarChart, ChartSeries
from prefab_ui.components.data_table import ExpandableRow


def listing_assist_app(draft: Any) -> PrefabApp:
    price = draft.price_suggestion
    rows = cast(
        list[dict[str, Any] | ExpandableRow],
        [
            {
                "marketplace": item.marketplace,
                "title": item.suggested_title,
                "price": f"JPY {item.recommended_price_jpy:,}",
                "shipping": item.shipping_method,
                "cautions": "; ".join(item.caution_notes),
            }
            for item in draft.marketplace_drafts
        ],
    )
    chart_rows = [
        {"label": "Min", "price": price.recommended_min_jpy},
        {"label": "Baseline", "price": price.baseline_price_jpy},
        {"label": "Max", "price": price.recommended_max_jpy},
    ]

    with (
        PrefabApp() as app,
        Column(
            gap=4,
            css_class="w-full max-w-full min-w-0 overflow-hidden p-4",
        ),
    ):
        Heading(f"Listing Assist: {draft.item_name}")
        Text(f"{draft.category} / {draft.condition}")

        with Card(css_class="w-full max-w-full min-w-0 overflow-hidden"):
            with CardContent(css_class="max-w-full min-w-0 overflow-hidden"):
                BarChart(
                    data=chart_rows,
                    series=[ChartSeries(dataKey="price", label="Price")],
                    xAxis="label",
                    height=220,
                )

        with Card(css_class="w-full max-w-full min-w-0"):
            with CardHeader():
                H3("Pricing Rationale")
            with CardContent():
                Text(price.rationale)

        with Card(css_class="w-full max-w-full min-w-0 overflow-hidden"):
            with CardContent(css_class="max-w-full min-w-0 overflow-x-auto"):
                DataTable(
                    columns=[
                        DataTableColumn(key="marketplace", header="Marketplace", sortable=True),
                        DataTableColumn(key="title", header="Title"),
                        DataTableColumn(key="price", header="Price", sortable=True),
                        DataTableColumn(key="shipping", header="Shipping"),
                        DataTableColumn(key="cautions", header="Cautions"),
                    ],
                    rows=rows,
                    search=True,
                    paginated=True,
                    pageSize=5,
                )

        Separator()
        with Column(gap=2):
            Text("Photo Checklist", css_class="text-sm font-medium")
            for item in draft.photo_checklist:
                Text(f"- {item}")
            Text("Next Actions", css_class="text-sm font-medium")
            for action in draft.next_actions:
                Text(f"- {action}")

    return app
