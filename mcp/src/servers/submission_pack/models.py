"""申請・提出パックサーバー用のドメインモデル。"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

type SubmissionItemStatus = Literal["missing", "drafting", "ready", "submitted"]


class SubmissionItem(BaseModel):
    """提出パック内の 1 項目。"""

    item_id: str
    label: str
    required: bool
    status: SubmissionItemStatus = "missing"
    notes: list[str] = Field(default_factory=list)


class SubmissionPack(BaseModel):
    """提出準備を束ねたパック。"""

    pack_id: str
    pack_name: str
    submission_type: str
    due_date: str | None = None
    summary: str
    ready_count: int
    missing_count: int
    items: list[SubmissionItem]
    next_actions: list[str] = Field(default_factory=list)
