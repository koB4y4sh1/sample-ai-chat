"""見積比較サーバー用のドメインモデル。"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

type SupportLevel = Literal["basic", "standard", "premium"]
type QuoteDecision = Literal["pending", "selected", "not_selected"]


class QuoteOfferInput(BaseModel):
    """比較前の見積入力。"""

    vendor_name: str
    total_price_jpy: int
    delivery_days: int
    support_level: SupportLevel
    payment_terms: str
    included_items: list[str] = Field(default_factory=list)
    excluded_items: list[str] = Field(default_factory=list)


class QuoteOffer(BaseModel):
    """比較用に整形された 1 社分の見積。"""

    offer_id: str
    vendor_name: str
    total_price_jpy: int
    delivery_days: int
    support_level: SupportLevel
    payment_terms: str
    included_items: list[str]
    excluded_items: list[str]
    strengths: list[str]
    risk_flags: list[str]
    score: float
    decision: QuoteDecision = "pending"


class QuoteComparison(BaseModel):
    """複数見積の比較結果。"""

    comparison_id: str
    procurement_title: str
    comparison_focus: list[str]
    summary: str
    recommended_vendor: str | None = None
    decision_rationale: str | None = None
    negotiation_points: list[str]
    offers: list[QuoteOffer]
