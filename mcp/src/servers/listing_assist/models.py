"""出品アシストサーバー用のドメインモデル。"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

type MarketplaceName = Literal["mercari", "rakuma", "yahoo_fleamarket"]
type ItemCondition = Literal["new", "excellent", "good", "fair"]


class PriceSuggestion(BaseModel):
    """出品価格の推奨レンジ。"""

    baseline_price_jpy: int
    recommended_min_jpy: int
    recommended_max_jpy: int
    rationale: str


class MarketplaceDraft(BaseModel):
    """各マーケット向けに最適化した出品下書き。"""

    marketplace: MarketplaceName
    suggested_title: str
    description_summary: str
    bullet_points: list[str]
    caution_notes: list[str]
    recommended_price_jpy: int
    shipping_method: str


class ListingChecklistItem(BaseModel):
    """出品前に確認するチェック項目。"""

    label: str
    done: bool = False


class MarketplacePostingChecklist(BaseModel):
    """掲載先ごとの出品前チェックリスト。"""

    draft_id: str
    marketplace: MarketplaceName
    checklist_items: list[ListingChecklistItem]
    warning_notes: list[str]


class ListingDraftPackage(BaseModel):
    """出品準備を進めるための統合ドラフト。"""

    draft_id: str
    item_name: str
    category: str
    condition: ItemCondition
    price_suggestion: PriceSuggestion
    marketplace_drafts: list[MarketplaceDraft]
    photo_checklist: list[str] = Field(default_factory=list)
    next_actions: list[str] = Field(default_factory=list)
