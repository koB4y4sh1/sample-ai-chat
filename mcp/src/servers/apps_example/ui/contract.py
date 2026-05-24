from typing import TypedDict

from fastmcp import FastMCPApp
from prefab_ui.actions import SetState, ShowToast
from prefab_ui.actions.mcp import CallTool
from prefab_ui.app import PrefabApp
from prefab_ui.components import (
    Badge,
    Button,
    Column,
    ForEach,
    Form,
    Heading,
    Input,
    Muted,
    Row,
    Select,
    SelectOption,
    Separator,
    Text,
    Textarea,
)
from prefab_ui.rx import RESULT

app = FastMCPApp("Contacts")


class ContactRecord(TypedDict):
    name: str
    email: str
    category: str


contacts_db: list[ContactRecord] = [
    {"name": "Zaphod Beeblebrox", "email": "zaphod@galaxy.gov", "category": "Partner"},
]


@app.tool()
def save_contact(
    name: str,
    email: str,
    category: str = "Other",
    notes: str = "",
) -> list[ContactRecord]:
    """Save a new contact and return the updated list."""
    contacts_db.append({"name": name, "email": email, "category": category})
    return list(contacts_db)


@app.ui()
def contact_form() -> PrefabApp:
    """Contact list with an add form."""
    with Column(gap=6, css_class="p-6") as view:
        Heading("Contacts")

        with ForEach("contacts"):
            with Row(gap=2, align="center"):
                Text("{{ contact.name }}", css_class="font-medium")
                Muted("{{ contact.email }}")
                Badge("{{ contact.category }}")

        Separator()

        with Form(
            on_submit=CallTool(
                "save_contact",
                on_success=[
                    SetState("contacts", RESULT),
                    ShowToast("Contact saved!", variant="success"),
                ],
                on_error=ShowToast("Failed to save", variant="error"),
            )
        ):
            Input(name="name", placeholder="Full Name", required=True)
            Input(name="email", placeholder="Email", input_type="email", required=True)
            with Select(name="category", placeholder="Category"):
                SelectOption("Customer", value="Customer")
                SelectOption("Vendor", value="Vendor")
                SelectOption("Partner", value="Partner")
                SelectOption("Other", value="Other")
            Textarea(name="notes", placeholder="Optional notes...")
            Button("Save Contact")

    return PrefabApp(view=view, state={"contacts": list(contacts_db)})
