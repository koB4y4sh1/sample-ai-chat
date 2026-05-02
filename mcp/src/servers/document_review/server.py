"""ドキュメントレビュー用の FastMCP サーバー定義。"""

from __future__ import annotations

from typing import Annotated

from fastmcp import FastMCP, FastMCPApp
from mcp.types import ToolAnnotations
from prefab_ui.app import PrefabApp
from pydantic import Field
from servers.document_review.mcp_apps import document_review_app
from servers.document_review.models import DocumentDiffReview, ReviewDecision
from servers.document_review.repository import ReviewRepository
from shared.icons import (
    CREATE_DOCUMENT_REVIEW_TOOL_ICONS,
    DOCUMENT_REVIEW_SERVER_ICONS,
    GET_DOCUMENT_REVIEW_TOOL_ICONS,
    RECORD_REVIEW_DECISION_TOOL_ICONS,
)


def create_document_review_server(repository: ReviewRepository | None = None) -> FastMCP:
    """ドキュメントレビューサーバーを生成する。"""

    review_repository = repository or ReviewRepository()
    app = FastMCPApp("Document Review App")
    server = FastMCP(
        "Document Diff Review",
        instructions=(
            "Use this server to compare document versions, summarize changes, and keep the final human review decision attached to the diff."
        ),
        icons=DOCUMENT_REVIEW_SERVER_ICONS,
        providers=[app],
        version="0.1.0",
    )

    @app.tool()
    def record_review_decision_from_app(
        review_id: Annotated[str, Field(description="App decision target review ID.")],
        decision: Annotated[ReviewDecision, Field(description="Review decision selected from the App.")],
        rationale: Annotated[str | None, Field(description="Review decision rationale from the App.")] = None,
        required_actions: Annotated[
            list[str] | None,
            Field(description="Required actions entered or selected from the App."),
        ] = None,
    ) -> DocumentDiffReview:
        return review_repository.record_decision(review_id, decision, rationale, required_actions)

    @server.tool(
        description=(
            "文書の変更前後を比較して、どこが変わったかをレビューしやすい形で整理したいときに使用する。"
            "差分ハンク一覧、変更要約、注目ポイントを含むレビュー結果を返す。"
        ),
        annotations=ToolAnnotations(
            title="Create Document Review",
            readOnlyHint=False,
            destructiveHint=False,
            idempotentHint=False,
            openWorldHint=False,
        ),
        icons=CREATE_DOCUMENT_REVIEW_TOOL_ICONS,
    )
    def create_document_review(
        document_id: Annotated[
            str,
            Field(description="比較対象の文書やレビュー対象を識別するための ID。"),
        ],
        original_text: Annotated[
            str,
            Field(description="変更前の文書内容。差分の基準として使うテキスト。"),
        ],
        revised_text: Annotated[
            str,
            Field(description="変更後の文書内容。差分抽出の比較先となるテキスト。"),
        ],
        focus_points: Annotated[
            list[str] | None,
            Field(description="差分レビュー時に特に注意して見るべき観点や確認項目の一覧。"),
        ] = None,
    ) -> DocumentDiffReview:
        return review_repository.create_review(document_id, original_text, revised_text, focus_points)

    @server.tool(
        description=(
            "作成済みの差分レビューに対して、承認、差し戻し、コメントなどの最終判断を保存したいときに使用する。"
            "判断内容と必要対応を反映した更新後のレビュー結果を返す。"
        ),
        annotations=ToolAnnotations(
            title="Record Review Decision",
            readOnlyHint=False,
            destructiveHint=True,
            idempotentHint=True,
            openWorldHint=False,
        ),
        icons=RECORD_REVIEW_DECISION_TOOL_ICONS,
    )
    def record_review_decision(
        review_id: Annotated[
            str,
            Field(description="判断結果を記録する対象のレビュー ID。"),
        ],
        decision: Annotated[
            ReviewDecision,
            Field(description="承認、差し戻し、コメントなど、現在の最終判断。"),
        ],
        rationale: Annotated[
            str | None,
            Field(description="その判断に至った理由やレビューコメントの要約。"),
        ] = None,
        required_actions: Annotated[
            list[str] | None,
            Field(description="差し戻しや条件付き承認の前に必要な修正アクション一覧。"),
        ] = None,
    ) -> DocumentDiffReview:
        return review_repository.record_decision(review_id, decision, rationale, required_actions)

    @server.tool(
        description=(
            "以前に作成した差分レビューの内容や、そこに紐づく判断結果を見直したいときに使用する。保存済みのドキュメントレビュー結果をそのまま返す。"
        ),
        annotations=ToolAnnotations(
            title="Get Document Review",
            readOnlyHint=True,
            idempotentHint=True,
            openWorldHint=False,
        ),
        icons=GET_DOCUMENT_REVIEW_TOOL_ICONS,
    )
    def get_document_review(
        review_id: Annotated[
            str,
            Field(description="再取得したい既存ドキュメントレビューの ID。"),
        ],
    ) -> DocumentDiffReview:
        return review_repository.get_review(review_id)

    @app.ui(
        name="show_document_review_app",
        description="Open a FastMCP Prefab App for reviewing before/after document diffs and recording a review decision.",
        annotations=ToolAnnotations(
            title="Show Document Review App",
            readOnlyHint=False,
            destructiveHint=False,
            idempotentHint=False,
            openWorldHint=False,
        ),
        icons=GET_DOCUMENT_REVIEW_TOOL_ICONS,
    )
    def show_document_review_app(
        document_id: Annotated[
            str,
            Field(description="Document identifier or filename to render in the MCP App."),
        ] = "sample-contract.md",
        original_text: Annotated[
            str,
            Field(description="Original document text before revision."),
        ] = "The contractor may submit deliverables after the deadline.",
        revised_text: Annotated[
            str,
            Field(description="Revised document text after proposed changes."),
        ] = "The contractor must submit deliverables by the agreed deadline.",
        focus_points: Annotated[
            list[str] | None,
            Field(description="Review focus points such as risk, tone, compliance, or approval."),
        ] = None,
    ) -> PrefabApp:
        review = review_repository.create_review(
            document_id,
            original_text,
            revised_text,
            focus_points or ["risk", "approval"],
        )
        return document_review_app(
            review,
            record_review_decision_from_app,
        )

    return server


def main() -> None:
    """ドキュメントレビューサーバーを起動する。"""

    create_document_review_server().run()
