"""見積比較状態を扱うインメモリリポジトリ。"""

from __future__ import annotations

from dataclasses import dataclass, field

from servers.quote_compare.models import QuoteComparison, QuoteOffer, QuoteOfferInput
from shared.models import build_identifier


def _support_bonus(level: str) -> float:
    return {"basic": 0.0, "standard": 8.0, "premium": 14.0}[level]


@dataclass(slots=True)
class QuoteCompareRepository:
    """複数ベンダーの見積比較結果を保持する。"""

    comparisons: dict[str, QuoteComparison] = field(default_factory=dict)

    def create_comparison(
        self,
        procurement_title: str,
        comparison_focus: list[str] | None,
        offers: list[QuoteOfferInput],
    ) -> QuoteComparison:
        highest_price = max(offer.total_price_jpy for offer in offers)
        ranked_offers: list[QuoteOffer] = []

        for index, offer in enumerate(offers, start=1):
            price_score = 100 - (offer.total_price_jpy / highest_price) * 35
            delivery_score = max(0.0, 20 - offer.delivery_days)
            score = round(price_score + delivery_score + _support_bonus(offer.support_level), 1)
            ranked_offers.append(
                QuoteOffer(
                    offer_id=f"offer-{index}",
                    vendor_name=offer.vendor_name,
                    total_price_jpy=offer.total_price_jpy,
                    delivery_days=offer.delivery_days,
                    support_level=offer.support_level,
                    payment_terms=offer.payment_terms,
                    included_items=offer.included_items,
                    excluded_items=offer.excluded_items,
                    strengths=[
                        f"納期 {offer.delivery_days} 日",
                        f"サポート水準 {offer.support_level}",
                    ],
                    risk_flags=([f"除外項目: {', '.join(offer.excluded_items)}"] if offer.excluded_items else ["除外項目は少ない"]),
                    score=score,
                )
            )

        recommended = max(ranked_offers, key=lambda offer: offer.score)
        comparison = QuoteComparison(
            comparison_id=build_identifier("quote_compare"),
            procurement_title=procurement_title,
            comparison_focus=comparison_focus or [],
            summary=(f"{len(ranked_offers)} 社の見積を比較し、現時点では {recommended.vendor_name} が有力候補。"),
            recommended_vendor=recommended.vendor_name,
            negotiation_points=[
                "価格交渉前に除外項目と追加費用の条件を確認する",
                "支払条件と納品後サポートの範囲を比較する",
            ],
            offers=sorted(ranked_offers, key=lambda offer: offer.score, reverse=True),
        )
        self.comparisons[comparison.comparison_id] = comparison
        return comparison

    def record_decision(
        self,
        comparison_id: str,
        selected_vendor_name: str,
        rationale: str | None,
    ) -> QuoteComparison:
        comparison = self.comparisons[comparison_id]
        updated_offers = [
            offer.model_copy(update={"decision": "selected" if offer.vendor_name == selected_vendor_name else "not_selected"})
            for offer in comparison.offers
        ]
        updated = comparison.model_copy(
            update={
                "offers": updated_offers,
                "recommended_vendor": selected_vendor_name,
                "decision_rationale": rationale,
                "summary": f"{selected_vendor_name} を採用候補として決定。",
            }
        )
        self.comparisons[comparison_id] = updated
        return updated

    def get_comparison(self, comparison_id: str) -> QuoteComparison:
        return self.comparisons[comparison_id]
