"""System monitor app provider."""

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
from prefab_ui.components.charts import BarChart, ChartSeries
from prefab_ui.components.data_table import ExpandableRow

app = FastMCPApp("System Monitor App")


@app.ui(
    name="show_system_monitor_app",
    description="Open a system monitor MCP App with chart and status table.",
    annotations=ToolAnnotations(
        title="Show System Monitor App",
        readOnlyHint=True,
        destructiveHint=False,
        idempotentHint=True,
        openWorldHint=False,
    ),
)
def system_monitor_app() -> PrefabApp:
    system_samples = [
        {"node": "api-1", "cpu": 52, "memory": 71, "status": "healthy"},
        {"node": "worker-1", "cpu": 68, "memory": 65, "status": "healthy"},
        {"node": "db-1", "cpu": 76, "memory": 83, "status": "warning"},
        {"node": "cache-1", "cpu": 41, "memory": 56, "status": "healthy"},
    ]
    chart_rows = [{"node": item["node"], "cpu": item["cpu"]} for item in system_samples]

    with PrefabApp() as app:
        with Column(gap=4, cssClass="w-full max-w-full min-w-0 overflow-hidden p-4"):
            Heading("System Monitor")
            Text("Cluster health snapshot.")
            with Row(gap=2):
                Badge("Uptime: 11d 19h 38m", variant="outline")
                Badge("Avg CPU: 41.7%", variant="outline")
                Badge("Avg Memory: 66.4%", variant="outline")

            with Row(gap=4):
                with Card(cssClass="w-full max-w-full min-w-0 overflow-hidden"):
                    with CardHeader():
                        Text("CPU by Node", cssClass="font-medium")
                    with CardContent(cssClass="max-w-full min-w-0 overflow-hidden"):
                        BarChart(
                            data=chart_rows,
                            series=[ChartSeries(dataKey="cpu", label="CPU %")],
                            xAxis="node",
                            height=220,
                        )

                with Card(cssClass="w-full max-w-full min-w-0 overflow-hidden"):
                    with CardHeader():
                        Text("Infrastructure Status", cssClass="font-medium")
                    with CardContent(cssClass="max-w-full min-w-0 overflow-x-auto"):
                        DataTable(
                            columns=[
                                DataTableColumn(key="node", header="Node", sortable=True),
                                DataTableColumn(key="cpu", header="CPU %", sortable=True),
                                DataTableColumn(key="memory", header="Memory %", sortable=True),
                                DataTableColumn(key="status", header="Status", sortable=True),
                            ],
                            rows=cast(list[dict[str, Any] | ExpandableRow], system_samples),
                            search=True,
                            paginated=True,
                            pageSize=4,
                        )
    return app
