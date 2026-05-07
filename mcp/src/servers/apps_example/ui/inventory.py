from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, TypedDict, cast

from fastmcp import FastMCPApp
from prefab_ui.actions import SetState, ShowToast
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
    ForEach,
    Form,
    Grid,
    Heading,
    Input,
    Muted,
    Row,
    Select,
    SelectOption,
    Separator,
    Tab,
    Tabs,
    Text,
)
from prefab_ui.components.data_table import ExpandableRow
from prefab_ui.rx import RESULT, STATE
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Data store
# ---------------------------------------------------------------------------

_next_id = 11


class InventoryItem(TypedDict):
    id: int
    name: str
    category: str
    quantity: int
    price: float
    last_updated: str


_inventory: list[InventoryItem] = [
    {
        "id": 1,
        "name": "Wireless Mouse",
        "category": "Electronics",
        "quantity": 45,
        "price": 29.99,
        "last_updated": "2026-03-20",
    },
    {
        "id": 2,
        "name": "Mechanical Keyboard",
        "category": "Electronics",
        "quantity": 32,
        "price": 89.99,
        "last_updated": "2026-03-19",
    },
    {
        "id": 3,
        "name": "USB-C Hub",
        "category": "Electronics",
        "quantity": 18,
        "price": 49.99,
        "last_updated": "2026-03-18",
    },
    {
        "id": 4,
        "name": "A4 Copy Paper (500 sheets)",
        "category": "Office Supplies",
        "quantity": 200,
        "price": 8.50,
        "last_updated": "2026-03-21",
    },
    {
        "id": 5,
        "name": "Ballpoint Pens (box)",
        "category": "Office Supplies",
        "quantity": 150,
        "price": 12.00,
        "last_updated": "2026-03-20",
    },
    {
        "id": 6,
        "name": "Sticky Notes (pack)",
        "category": "Office Supplies",
        "quantity": 85,
        "price": 5.99,
        "last_updated": "2026-03-17",
    },
    {
        "id": 7,
        "name": "Standing Desk",
        "category": "Furniture",
        "quantity": 8,
        "price": 499.00,
        "last_updated": "2026-03-15",
    },
    {
        "id": 8,
        "name": "Ergonomic Chair",
        "category": "Furniture",
        "quantity": 12,
        "price": 349.00,
        "last_updated": "2026-03-16",
    },
    {
        "id": 9,
        "name": "Monitor Arm",
        "category": "Furniture",
        "quantity": 25,
        "price": 79.99,
        "last_updated": "2026-03-22",
    },
    {
        "id": 10,
        "name": "Webcam HD",
        "category": "Electronics",
        "quantity": 60,
        "price": 69.99,
        "last_updated": "2026-03-21",
    },
]

CATEGORIES = ["All", "Electronics", "Office Supplies", "Furniture"]


# ---------------------------------------------------------------------------
# Pydantic model for add-item form
# ---------------------------------------------------------------------------


class NewItem(BaseModel):
    name: str = Field(title="Item Name", min_length=1)
    category: Literal["Electronics", "Office Supplies", "Furniture"] = Field(
        title="Category",
        default="Electronics",
    )
    quantity: int = Field(title="Quantity", ge=0, default=1)
    price: float = Field(title="Unit Price ($)", ge=0.0, default=0.0)


# ---------------------------------------------------------------------------
# App and tools
# ---------------------------------------------------------------------------

app = FastMCPApp("Inventory")


@app.tool()
def add_item(data: NewItem) -> list[InventoryItem]:
    """Add a new item to inventory and return the full list."""
    global _next_id
    item: InventoryItem = {
        "id": _next_id,
        "name": data.name,
        "category": data.category,
        "quantity": data.quantity,
        "price": data.price,
        "last_updated": datetime.now().strftime("%Y-%m-%d"),
    }
    _next_id += 1
    _inventory.append(item)
    return list(_inventory)


@app.tool()
def update_quantity(item_id: int, delta: int) -> list[InventoryItem]:
    """Adjust an item's quantity by delta (+/-) and return the full list."""
    for item in _inventory:
        if item["id"] == item_id:
            new_qty = max(0, item["quantity"] + delta)
            item["quantity"] = new_qty
            item["last_updated"] = datetime.now().strftime("%Y-%m-%d")
            break
    return list(_inventory)


@app.tool()
def delete_item(item_id: int) -> list[InventoryItem]:
    """Remove an item by ID and return the remaining inventory."""
    for i, item in enumerate(_inventory):
        if item["id"] == item_id:
            _inventory.pop(i)
            break
    return list(_inventory)


@app.tool()
def search_items(query: str) -> list[InventoryItem]:
    """Search items by name (case-insensitive). Returns matching items."""
    q = query.lower()
    return [item for item in _inventory if q in item["name"].lower()]


@app.tool()
def filter_by_category(category: str) -> list[InventoryItem]:
    """Filter inventory by category. Pass 'All' to show everything."""
    if category == "All":
        return list(_inventory)
    return [item for item in _inventory if item["category"] == category]


# ---------------------------------------------------------------------------
# UI helpers
# ---------------------------------------------------------------------------


def _build_inventory_table() -> None:
    """Render the main DataTable with all current items."""
    DataTable(
        columns=[
            DataTableColumn(key="name", header="Name", sortable=True),
            DataTableColumn(key="category", header="Category", sortable=True),
            DataTableColumn(key="quantity", header="Qty", sortable=True),
            DataTableColumn(key="price", header="Price ($)", sortable=True),
            DataTableColumn(key="last_updated", header="Updated", sortable=True),
        ],
        rows=cast(list[dict[str, Any] | ExpandableRow], list(_inventory)),
        search=True,
        paginated=True,
        pageSize=10,
    )


def _build_search_section() -> None:
    """Render the search form with ForEach results."""
    Heading("Search Items", level=3)
    Muted("Search by name across all inventory items.")

    with Form(
        onSubmit=CallTool(
            search_items,
            arguments={"query": STATE.query},
            on_success=SetState("search_results", RESULT),
        )
    ):
        Input(name="query", placeholder="Search by name...")
        Button("Search")

    with ForEach("search_results"):
        with Card(cssClass="mb-2"):
            with CardContent():
                with Row(gap=3, align="center"):
                    Text("{{ result.name }}", cssClass="font-medium")
                    Badge("{{ result.category }}")
                    Text("{{ result.quantity }}")
                    Muted("in stock")


def _build_add_form() -> None:
    """Render the add-item form using Form.from_model()."""
    Heading("Add New Item", level=3)
    Muted("Fill out the form below to add a new item to inventory.")

    Form.from_model(
        NewItem,
        submit_label="Add Item",
        on_submit=CallTool(
            add_item,
            on_success=[
                SetState("recent_additions", RESULT),
                ShowToast("Item added!", variant="success"),
            ],
            on_error=ShowToast("{{ $error }}", variant="error"),
        ),
    )


def _build_actions_section() -> None:
    """Render category filter, quantity adjustment, and delete controls."""

    # Category filter
    Heading("Filter by Category", level=3)
    Muted("Select a category to see matching items.")

    with Form(
        onSubmit=CallTool(
            filter_by_category,
            arguments={"category": STATE.selected_category},
            on_success=SetState("filtered_items", RESULT),
        )
    ):
        with Select(name="selected_category", placeholder="Choose a category..."):
            for cat in CATEGORIES:
                SelectOption(cat, value=cat)
        Button("Apply Filter")

    with ForEach("filtered_items"):
        with Row(gap=3, align="center", cssClass="py-1"):
            Badge("{{ item.id }}", variant="outline")
            Text("{{ item.name }}", cssClass="font-medium")
            Badge("{{ item.category }}")
            Muted("{{ item.quantity }}")

    Separator()

    # Quantity adjustment
    Heading("Adjust Quantity", level=3)
    Muted("Enter an item ID and use the buttons to adjust stock levels.")

    Input(name="adjust_id", inputType="number", placeholder="Item ID (e.g. 1)")

    with Row(gap=2):
        Button(
            "- 1",
            variant="outline",
            on_click=CallTool(
                update_quantity,
                arguments={"item_id": STATE.adjust_id, "delta": -1},
                on_success=[
                    SetState("filtered_items", RESULT),
                    ShowToast("Quantity decreased", variant="default"),
                ],
                on_error=ShowToast("{{ $error }}", variant="error"),
            ),
        )
        Button(
            "+ 1",
            variant="outline",
            on_click=CallTool(
                update_quantity,
                arguments={"item_id": STATE.adjust_id, "delta": 1},
                on_success=[
                    SetState("filtered_items", RESULT),
                    ShowToast("Quantity increased", variant="default"),
                ],
                on_error=ShowToast("{{ $error }}", variant="error"),
            ),
        )
        Button(
            "+ 10",
            on_click=CallTool(
                update_quantity,
                arguments={"item_id": STATE.adjust_id, "delta": 10},
                on_success=[
                    SetState("filtered_items", RESULT),
                    ShowToast("Restocked +10", variant="success"),
                ],
                on_error=ShowToast("{{ $error }}", variant="error"),
            ),
        )

    Separator()

    # Delete
    Heading("Delete Item", level=3)
    Muted("Permanently remove an item by its ID.")

    with Form(
        onSubmit=CallTool(
            delete_item,
            arguments={"item_id": STATE.delete_id},
            on_success=[
                SetState("filtered_items", RESULT),
                ShowToast("Item deleted", variant="warning"),
            ],
            on_error=ShowToast("{{ $error }}", variant="error"),
        )
    ):
        Input(name="delete_id", inputType="number", placeholder="Item ID to delete")
        Button("Delete", variant="destructive")


# ---------------------------------------------------------------------------
# Entry point UI
# ---------------------------------------------------------------------------


@app.ui()
def inventory_manager() -> PrefabApp:
    """Open the inventory manager. The model calls this to launch the app."""
    with Column(gap=6, cssClass="p-6") as view:
        with Row(gap=3, align="center"):
            Heading("Inventory Tracker")
            Badge(
                "{{ filtered_items.length }}",
                variant="secondary",
            )
            Muted("items tracked")

        Separator()

        # Summary cards per category
        with Grid(columns=3, gap=4):
            for cat in ["Electronics", "Office Supplies", "Furniture"]:
                count = sum(1 for it in _inventory if it["category"] == cat)
                total_qty = sum(it["quantity"] for it in _inventory if it["category"] == cat)
                with Card():
                    with CardContent():
                        Text(cat, cssClass="font-medium")
                        Muted(f"{count} items, {total_qty} units")

        with Tabs():
            with Tab("All Items"):
                _build_inventory_table()

            with Tab("Search"):
                _build_search_section()

            with Tab("Add Item"):
                _build_add_form()

            with Tab("Actions"):
                _build_actions_section()

    return PrefabApp(
        view=view,
        state={
            "search_results": [],
            "filtered_items": list(_inventory),
            "recent_additions": [],
            "selected_category": "All",
            "adjust_id": "",
            "delete_id": "",
            "query": "",
        },
    )
