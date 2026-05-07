"""Sales dashboard app provider."""

from typing import Any, cast

from fastmcp import FastMCPApp
from mcp.types import ToolAnnotations
from prefab_ui.app import PrefabApp
from prefab_ui.components import (
    Badge,
    Card,
    CardContent,
    CardHeader,
    Column,
    DataTable,
    DataTableColumn,
    Heading,
    Row,
    Text,
)
from prefab_ui.components.charts import BarChart, ChartSeries, PieChart
from prefab_ui.components.data_table import ExpandableRow

app = FastMCPApp("Sales Dashboard App")


@app.ui(
    name="show_sales_dashboard_app",
    description="Open a sales dashboard MCP App with a chart and tabular data.",
    annotations=ToolAnnotations(
        title="Show Sales Dashboard App",
        readOnlyHint=True,
        destructiveHint=False,
        idempotentHint=True,
        openWorldHint=False,
    ),
)
def sales_dashboard_app() -> PrefabApp:
    monthly_sales = [
        {"month": "Jan", "sales": 120, "profit": 36},
        {"month": "Feb", "sales": 160, "profit": 52},
        {"month": "Mar", "sales": 190, "profit": 65},
        {"month": "Apr", "sales": 175, "profit": 58},
        {"month": "May", "sales": 220, "profit": 74},
    ]
    segment_mix = [
        {"segment": "Enterprise", "value": 46},
        {"segment": "Mid-Market", "value": 28},
        {"segment": "SMB", "value": 18},
        {"segment": "Startup", "value": 8},
    ]

    with PrefabApp() as app:
        with Column(gap=4, cssClass="w-full max-w-full min-w-0 overflow-hidden p-4"):
            Heading("Sales Dashboard")
            Text("FY2026 overview with revenue trend and segment mix.")
            with Row(gap=2):
                Badge("Revenue: $7.2M", variant="outline")
                Badge("Quarterly Growth: +18.3%", variant="outline")
                Badge("Active Customers: 1,847", variant="outline")

            with Row(gap=4):
                with Card(cssClass="w-full max-w-full min-w-0 overflow-hidden"):
                    with CardHeader():
                        Text("Monthly Revenue", cssClass="font-medium")
                    with CardContent(cssClass="max-w-full min-w-0 overflow-hidden"):
                        BarChart(
                            data=monthly_sales,
                            series=[
                                ChartSeries(dataKey="sales", label="Sales"),
                                ChartSeries(dataKey="profit", label="Profit"),
                            ],
                            xAxis="month",
                            height=260,
                        )
                with Card(cssClass="w-full max-w-full min-w-0 overflow-hidden"):
                    with CardHeader():
                        Text("Revenue by Segment", cssClass="font-medium")
                    with CardContent(cssClass="max-w-full min-w-0 overflow-hidden"):
                        PieChart(
                            data=segment_mix,
                            nameKey="segment",
                            dataKey="value",
                            height=260,
                        )

            with Card(cssClass="w-full max-w-full min-w-0 overflow-hidden"):
                with CardHeader():
                    Text("Recent Deals", cssClass="font-medium")
                with CardContent(cssClass="max-w-full min-w-0 overflow-x-auto"):
                    DataTable(
                        columns=[
                            DataTableColumn(key="month", header="Month", sortable=True),
                            DataTableColumn(key="sales", header="Sales", sortable=True),
                            DataTableColumn(key="profit", header="Profit", sortable=True),
                        ],
                        rows=cast(list[dict[str, Any] | ExpandableRow], monthly_sales),
                        search=False,
                        paginated=False,
                    )
    return app
