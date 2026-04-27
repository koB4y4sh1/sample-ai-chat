"""ドキュメント差分レビュー状態のリポジトリ。"""

from __future__ import annotations

from dataclasses import dataclass, field
from difflib import SequenceMatcher
from typing import Literal

from servers.document_review.models import (
    DiffHunk,
    DocumentDiffReview,
    ReviewDecision,
    ReviewDecisionRecord,
)
from shared.models import build_identifier


def _compact_excerpt(lines: list[str]) -> str:
    excerpt = "\n".join(line.rstrip() for line in lines[:4]).strip()
    return excerpt or "(empty)"


def _build_hunks(original_text: str, revised_text: str) -> list[DiffHunk]:
    matcher = SequenceMatcher(a=original_text.splitlines(), b=revised_text.splitlines())
    hunks: list[DiffHunk] = []

    for index, opcode in enumerate(matcher.get_opcodes(), start=1):
        change_type, a_start, a_end, b_start, b_end = opcode
        if change_type == "equal":
            continue

        mapped_type: Literal["insert", "delete", "replace"] = "replace"
        if change_type == "insert":
            mapped_type = "insert"
        elif change_type == "delete":
            mapped_type = "delete"

        hunks.append(
            DiffHunk(
                hunk_id=f"hunk-{index}",
                change_type=mapped_type,
                original_excerpt=_compact_excerpt(original_text.splitlines()[a_start:a_end]),
                revised_excerpt=_compact_excerpt(revised_text.splitlines()[b_start:b_end]),
            )
        )

    return hunks


@dataclass(slots=True)
class ReviewRepository:
    """差分と人間の判断を保持するインメモリ状態。"""

    reviews: dict[str, DocumentDiffReview] = field(default_factory=dict)

    def create_review(
        self,
        document_id: str,
        original_text: str,
        revised_text: str,
        focus_points: list[str] | None = None,
    ) -> DocumentDiffReview:
        hunks = _build_hunks(original_text, revised_text)
        changed_line_count = sum(len(hunk.original_excerpt.splitlines()) + len(hunk.revised_excerpt.splitlines()) for hunk in hunks)
        review = DocumentDiffReview(
            review_id=build_identifier("review"),
            document_id=document_id,
            change_count=len(hunks),
            changed_line_count=changed_line_count,
            summary=(f"Detected {len(hunks)} changed sections in {document_id}." if hunks else f"No textual changes detected in {document_id}."),
            focus_points=focus_points or [],
            hunks=hunks,
            decision=ReviewDecisionRecord(),
        )
        self.reviews[review.review_id] = review
        return review

    def record_decision(
        self,
        review_id: str,
        decision: ReviewDecision,
        rationale: str | None,
        required_actions: list[str] | None,
    ) -> DocumentDiffReview:
        review = self.reviews[review_id]
        updated = review.model_copy(
            update={
                "decision": ReviewDecisionRecord(
                    decision=decision,
                    rationale=rationale,
                    required_actions=required_actions or [],
                )
            }
        )
        self.reviews[review_id] = updated
        return updated

    def get_review(self, review_id: str) -> DocumentDiffReview:
        return self.reviews[review_id]
