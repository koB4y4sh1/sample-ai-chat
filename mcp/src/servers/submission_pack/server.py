"""申請・提出パック用の FastMCP サーバー定義。"""

from __future__ import annotations

from typing import Annotated

from fastmcp import FastMCP
from mcp.types import ToolAnnotations
from pydantic import Field
from servers.submission_pack.models import SubmissionItemStatus, SubmissionPack
from servers.submission_pack.repository import SubmissionPackRepository
from shared.icons import (
    CREATE_SUBMISSION_PACK_TOOL_ICONS,
    GET_SUBMISSION_PACK_TOOL_ICONS,
    SUBMISSION_PACK_SERVER_ICONS,
    UPDATE_SUBMISSION_ITEM_STATUS_TOOL_ICONS,
)


def create_submission_pack_server(repository: SubmissionPackRepository | None = None) -> FastMCP:
    """申請・提出パックサーバーを生成する。"""

    submission_repository = repository or SubmissionPackRepository()
    server = FastMCP(
        "Submission Pack Workspace",
        instructions=(
            "Use this server to turn application requirements into a tracked submission "
            "pack, update each required item, and expose readiness information for an MCP App."
        ),
        icons=SUBMISSION_PACK_SERVER_ICONS,
        version="0.1.0",
    )

    @server.tool(
        description=("申請や提出の準備をチェックリスト化して進めたいときに使用する。必須項目、任意項目、期限を束ねた提出パックを返す。"),
        annotations=ToolAnnotations(
            title="Create Submission Pack",
            readOnlyHint=False,
            destructiveHint=False,
            idempotentHint=False,
            openWorldHint=False,
        ),
        icons=CREATE_SUBMISSION_PACK_TOOL_ICONS,
    )
    def create_submission_pack(
        pack_name: Annotated[str, Field(description="管理したい提出案件の名称。")],
        submission_type: Annotated[str, Field(description="補助金申請、入居申込、保険申請などの種別。")],
        required_items: Annotated[
            list[str],
            Field(description="提出に必須な資料や記入項目の一覧。"),
        ],
        optional_items: Annotated[
            list[str] | None,
            Field(description="任意提出だが補足材料として有効な項目一覧。"),
        ] = None,
        due_date: Annotated[
            str | None,
            Field(description="提出期限。未定なら未指定でもよい。"),
        ] = None,
    ) -> SubmissionPack:
        return submission_repository.create_pack(
            pack_name,
            submission_type,
            required_items,
            optional_items,
            due_date,
        )

    @server.tool(
        description=("提出項目の準備状況や補足メモに変化があったときに使用する。更新後の提出パック全体を返す。"),
        annotations=ToolAnnotations(
            title="Update Submission Item Status",
            readOnlyHint=False,
            destructiveHint=True,
            idempotentHint=False,
            openWorldHint=False,
        ),
        icons=UPDATE_SUBMISSION_ITEM_STATUS_TOOL_ICONS,
    )
    def update_submission_item_status(
        pack_id: Annotated[str, Field(description="更新対象の提出パックの pack_id。")],
        item_id: Annotated[str, Field(description="状態を変更したい項目の item_id。")],
        status: Annotated[
            SubmissionItemStatus,
            Field(description="missing、drafting、ready、submitted の最新状態。"),
        ],
        note: Annotated[
            str | None,
            Field(description="準備メモや提出時の補足コメント。"),
        ] = None,
    ) -> SubmissionPack:
        return submission_repository.update_item_status(pack_id, item_id, status, note)

    @server.tool(
        description=("提出準備の現在地を見直したいときに使用する。不足項目、準備済み項目、次アクションを含む提出パックを返す。"),
        annotations=ToolAnnotations(
            title="Get Submission Pack",
            readOnlyHint=True,
            idempotentHint=True,
            openWorldHint=False,
        ),
        icons=GET_SUBMISSION_PACK_TOOL_ICONS,
    )
    def get_submission_pack(
        pack_id: Annotated[str, Field(description="再取得したい提出パックの pack_id。")],
    ) -> SubmissionPack:
        return submission_repository.get_pack(pack_id)

    return server


def main() -> None:
    """申請・提出パックサーバーを起動する。"""

    create_submission_pack_server().run()
