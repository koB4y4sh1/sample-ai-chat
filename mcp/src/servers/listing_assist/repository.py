"""出品アシスト状態を扱うインメモリリポジトリ。"""

from __future__ import annotations

from dataclasses import dataclass, field

from servers.listing_assist.models import (
    ItemCondition,
    ListingChecklistItem,
    ListingDraftPackage,
    MarketplaceDraft,
    MarketplaceName,
    MarketplacePostingChecklist,
    PriceSuggestion,
)
from shared.models import build_identifier

DEFAULT_MARKETPLACES: tuple[MarketplaceName, ...] = (
    "mercari",
    "rakuma",
    "yahoo_fleamarket",
)


def _condition_multiplier(condition: ItemCondition) -> float:
    return {
        "new": 1.08,
        "excellent": 1.0,
        "good": 0.9,
        "fair": 0.76,
    }[condition]


@dataclass(slots=True)
class ListingAssistRepository:
    """フリマ出品のドラフトとチェックリストを保持する。"""

    drafts: dict[str, ListingDraftPackage] = field(default_factory=dict)

    def create_draft(
        self,
        item_name: str,
        category: str,
        brand: str | None,
        condition: ItemCondition,
        included_accessories: list[str] | None,
        visible_flaws: list[str] | None,
        desired_price_jpy: int | None,
        target_marketplaces: list[MarketplaceName] | None,
    ) -> ListingDraftPackage:
        accessories = included_accessories or []
        flaws = visible_flaws or []
        marketplaces = target_marketplaces or list(DEFAULT_MARKETPLACES)

        anchor_price = desired_price_jpy or 5800 + len(accessories) * 500
        baseline = max(800, int(anchor_price * _condition_multiplier(condition)) - len(flaws) * 300)
        price_suggestion = PriceSuggestion(
            baseline_price_jpy=baseline,
            recommended_min_jpy=max(500, baseline - 700),
            recommended_max_jpy=baseline + 1200,
            rationale=("希望価格、状態、付属品数、目立つ傷の有無から初期の価格レンジを作成した。"),
        )

        marketplace_drafts = [
            MarketplaceDraft(
                marketplace=marketplace,
                suggested_title=(f"{brand + ' ' if brand else ''}{item_name} / {condition} / {category}")[:60],
                description_summary=(
                    f"{item_name} の出品下書き。状態は {condition}。付属品: {', '.join(accessories) if accessories else '本体のみ'}。"
                ),
                bullet_points=[
                    f"カテゴリ: {category}",
                    f"状態: {condition}",
                    (f"付属品: {', '.join(accessories)}" if accessories else "付属品は最小構成のため本文に明記する"),
                ],
                caution_notes=([f"傷・使用感: {', '.join(flaws)}"] if flaws else ["傷が少ない場合も写真で状態を明示する"]),
                recommended_price_jpy=price_suggestion.baseline_price_jpy,
                shipping_method="匿名配送・追跡ありを優先",
            )
            for marketplace in marketplaces
        ]

        draft = ListingDraftPackage(
            draft_id=build_identifier("listing_draft"),
            item_name=item_name,
            category=category,
            condition=condition,
            price_suggestion=price_suggestion,
            marketplace_drafts=marketplace_drafts,
            photo_checklist=[
                "正面写真を撮る",
                "背面と側面を撮る",
                "付属品をまとめて撮る",
                "傷や使用感がある箇所を拡大して撮る",
            ],
            next_actions=[
                "写真と本文の整合を確認する",
                "希望販売先ごとにタイトル長と禁止表現を確認する",
            ],
        )
        self.drafts[draft.draft_id] = draft
        return draft

    def get_draft(self, draft_id: str) -> ListingDraftPackage:
        return self.drafts[draft_id]

    def get_posting_checklist(
        self,
        draft_id: str,
        marketplace: MarketplaceName,
    ) -> MarketplacePostingChecklist:
        _draft = self.drafts[draft_id]
        return MarketplacePostingChecklist(
            draft_id=draft_id,
            marketplace=marketplace,
            checklist_items=[
                ListingChecklistItem(label="商品状態と写真の内容が一致している"),
                ListingChecklistItem(label="付属品の有無を本文に明記している"),
                ListingChecklistItem(label="発送方法と送料負担を確認している"),
                ListingChecklistItem(label="傷や欠点を隠さず本文に書いている"),
            ],
            warning_notes=[
                "新品でない場合は使用期間や購入時期を本文で補足するとトラブルを減らしやすい。",
                f"{marketplace} 向けに価格帯と禁止出品カテゴリを最終確認する。",
            ],
        )
