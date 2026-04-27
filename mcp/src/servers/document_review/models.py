"""ドキュメントレビューサーバー用のドメインモデル。"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

type ReviewDecision = Literal["pending", "approved", "request_changes", "commented"]


class DiffHunk(BaseModel):
    """レビューしやすい粒度にまとめた差分チャンク。"""

    hunk_id: str
    change_type: Literal["insert", "delete", "replace"]
    original_excerpt: str
    revised_excerpt: str


class ReviewDecisionRecord(BaseModel):
    """差分に対する人間のレビュー判断を保持するレコード。"""

    decision: ReviewDecision = "pending"
    rationale: str | None = None
    required_actions: list[str] = Field(default_factory=list)


class DocumentDiffReview(BaseModel):
    """構造化された差分レビュー結果。"""

    review_id: str
    document_id: str
    change_count: int
    changed_line_count: int
    summary: str
    focus_points: list[str]
    hunks: list[DiffHunk]
    decision: ReviewDecisionRecord
