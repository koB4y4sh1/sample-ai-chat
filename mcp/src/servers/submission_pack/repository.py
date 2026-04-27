"""申請・提出パック状態を扱うインメモリリポジトリ。"""

from __future__ import annotations

from dataclasses import dataclass, field

from servers.submission_pack.models import SubmissionItem, SubmissionItemStatus, SubmissionPack
from shared.models import build_identifier, normalize_label


@dataclass(slots=True)
class SubmissionPackRepository:
    """提出物の準備状態を保持する。"""

    packs: dict[str, SubmissionPack] = field(default_factory=dict)

    def create_pack(
        self,
        pack_name: str,
        submission_type: str,
        required_items: list[str],
        optional_items: list[str] | None,
        due_date: str | None,
    ) -> SubmissionPack:
        items = [
            SubmissionItem(
                item_id=f"required-{index + 1}-{normalize_label(label)}",
                label=label,
                required=True,
            )
            for index, label in enumerate(required_items)
        ] + [
            SubmissionItem(
                item_id=f"optional-{index + 1}-{normalize_label(label)}",
                label=label,
                required=False,
            )
            for index, label in enumerate(optional_items or [])
        ]

        pack = SubmissionPack(
            pack_id=build_identifier("submission_pack"),
            pack_name=pack_name,
            submission_type=submission_type,
            due_date=due_date,
            summary=f"{pack_name} の提出準備を {len(items)} 項目で管理する。",
            ready_count=0,
            missing_count=sum(item.required for item in items),
            items=items,
            next_actions=([f"必須項目の先頭である {items[0].label} の準備を始める"] if items else ["提出条件を整理する"]),
        )
        self.packs[pack.pack_id] = pack
        return pack

    def update_item_status(
        self,
        pack_id: str,
        item_id: str,
        status: SubmissionItemStatus,
        note: str | None,
    ) -> SubmissionPack:
        pack = self.packs[pack_id]
        updated_items: list[SubmissionItem] = []

        for item in pack.items:
            if item.item_id != item_id:
                updated_items.append(item)
                continue

            notes = [*item.notes]
            if note:
                notes.append(note)
            updated_items.append(item.model_copy(update={"status": status, "notes": notes}))

        ready_count = sum(item.status in {"ready", "submitted"} for item in updated_items)
        missing_count = sum(item.required and item.status == "missing" for item in updated_items)
        next_actions = [f"{item.label} を提出状態まで進める" for item in updated_items if item.status in {"missing", "drafting"}][:3]

        updated = pack.model_copy(
            update={
                "items": updated_items,
                "ready_count": ready_count,
                "missing_count": missing_count,
                "summary": f"{ready_count}/{len(updated_items)} 項目が提出可能状態。",
                "next_actions": next_actions or ["全項目が提出準備完了。最終確認へ進む"],
            }
        )
        self.packs[pack_id] = updated
        return updated

    def get_pack(self, pack_id: str) -> SubmissionPack:
        return self.packs[pack_id]
