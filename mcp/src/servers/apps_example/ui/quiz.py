"""Quiz app provider."""

from typing import Annotated

from fastmcp import FastMCPApp
from mcp.types import ToolAnnotations
from prefab_ui.actions import ShowToast
from prefab_ui.actions.mcp import CallTool
from prefab_ui.app import PrefabApp
from prefab_ui.components import Button, Card, CardContent, Column, Heading, Row, Separator, Text
from pydantic import Field

app = FastMCPApp("Quiz App")


@app.tool(
    name="record_quiz_answer",
    description="Record a quiz answer selected from the quiz app.",
)
def record_quiz_answer(question_id: str, answer: str) -> dict[str, str]:
    """Record the selected quiz answer."""

    return {"question_id": question_id, "answer": answer}


@app.ui(
    name="show_quiz_app",
    description="Open a quiz-style MCP App with action buttons.",
    annotations=ToolAnnotations(
        title="Show Quiz App",
        readOnlyHint=False,
        destructiveHint=False,
        idempotentHint=False,
        openWorldHint=False,
    ),
)
def show_quiz_app(
    question_id: Annotated[str, Field(description="Question id shown in the quiz app.")] = "q1",
    question: Annotated[str, Field(description="Quiz question text.")] = "FastMCP Apps are primarily for?",
) -> PrefabApp:
    with PrefabApp() as app:
        with Column(gap=4, css_class="w-full max-w-full min-w-0 overflow-hidden p-4"):
            Heading("Quiz App Example")
            Text(question)
            with Row(gap=2):
                for choice, label in (
                    ("A", "Structured MCP App UI"),
                    ("B", "Raw socket benchmarking"),
                    ("C", "DNS cache management"),
                ):
                    Button(
                        f"{choice}: {label}",
                        variant="secondary",
                        onClick=CallTool(
                            "record_quiz_answer",
                            arguments={"question_id": question_id, "answer": choice},
                            onSuccess=ShowToast("Answer submitted.", variant="success"),
                        ),
                    )
            Separator()
            with Card(css_class="w-full max-w-full min-w-0 overflow-hidden"):
                with CardContent(css_class="max-w-full min-w-0 overflow-x-auto"):
                    Text("This pattern demonstrates in-app actions via CallTool + ShowToast.")
    return app
