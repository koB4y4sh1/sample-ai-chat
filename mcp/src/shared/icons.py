"""FastMCP server/tool icons shared across Zenith MCP surfaces."""

from __future__ import annotations

from typing import Final
from urllib.parse import quote

from mcp.types import Icon


def _svg_icon(svg: str) -> Icon:
    return Icon(
        src=f"data:image/svg+xml,{quote(svg)}",
        mimeType="image/svg+xml",
        sizes=["any"],
    )


ROOT_SERVER_ICONS: Final[list[Icon]] = [
    _svg_icon(
        """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="18" fill="#17324D"/>
  <circle cx="18" cy="32" r="7" fill="#9AE6B4"/>
  <circle cx="46" cy="18" r="7" fill="#7DD3FC"/>
  <circle cx="46" cy="46" r="7" fill="#FCD34D"/>
  <path d="M24 29L40 21M24 35L40 43M46 25V39" stroke="#F8FAFC" stroke-width="4" stroke-linecap="round"/>
</svg>
""".strip()
    )
]

DOCUMENT_REVIEW_SERVER_ICONS: Final[list[Icon]] = [
    _svg_icon(
        """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="18" fill="#1F4B99"/>
  <path d="M20 14H36L46 24V50H20V14Z" fill="#F8FAFC"/>
  <path d="M36 14V24H46" fill="#BFDBFE"/>
  <path d="M27 34L31 38L39 29" stroke="#1D4ED8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
""".strip()
    )
]

LISTING_ASSIST_SERVER_ICONS: Final[list[Icon]] = [
    _svg_icon(
        """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="18" fill="#7C2D12"/>
  <path d="M14 25L31 14H50V33L33 50H14V25Z" fill="#FED7AA"/>
  <circle cx="26" cy="26" r="4" fill="#7C2D12"/>
  <path d="M34 24L42 32" stroke="#9A3412" stroke-width="4" stroke-linecap="round"/>
</svg>
""".strip()
    )
]

QUOTE_COMPARE_SERVER_ICONS: Final[list[Icon]] = [
    _svg_icon(
        """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="18" fill="#1F2937"/>
  <rect x="16" y="34" width="8" height="14" rx="2" fill="#93C5FD"/>
  <rect x="28" y="24" width="8" height="24" rx="2" fill="#FDE68A"/>
  <rect x="40" y="18" width="8" height="30" rx="2" fill="#86EFAC"/>
  <path d="M14 50H50" stroke="#E5E7EB" stroke-width="4" stroke-linecap="round"/>
</svg>
""".strip()
    )
]

SUBMISSION_PACK_SERVER_ICONS: Final[list[Icon]] = [
    _svg_icon(
        """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="18" fill="#14532D"/>
  <rect x="17" y="12" width="30" height="40" rx="4" fill="#ECFCCB"/>
  <rect x="24" y="8" width="16" height="8" rx="3" fill="#86EFAC"/>
  <path d="M25 27H39M25 35H39M25 43H33" stroke="#166534" stroke-width="4" stroke-linecap="round"/>
  <path d="M42 39L45 42L51 34" stroke="#FACC15" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
""".strip()
    )
]

MAP_VIEW_SERVER_ICONS: Final[list[Icon]] = [
    _svg_icon(
        """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="18" fill="#0F766E"/>
  <path d="M14 18L28 12L50 18V48L36 52L14 46V18Z" fill="#CCFBF1"/>
  <path d="M28 12V42M36 22V52" stroke="#0F766E" stroke-width="4" stroke-linecap="round"/>
  <path d="M39 30C39 36 32 43 32 43C32 43 25 36 25 30C25 26 28 23 32 23C36 23 39 26 39 30Z" fill="#EF4444"/>
  <circle cx="32" cy="30" r="3" fill="#FFFFFF"/>
</svg>
""".strip()
    )
]

CREATE_DOCUMENT_REVIEW_TOOL_ICONS: Final[list[Icon]] = [
    _svg_icon(
        """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="18" fill="#DBEAFE"/>
  <path d="M17 18H31V46H17V18Z" fill="#60A5FA"/>
  <path d="M33 18H47V46H33V18Z" fill="#1D4ED8"/>
  <path d="M28 32H36" stroke="#F8FAFC" stroke-width="4" stroke-linecap="round"/>
</svg>
""".strip()
    )
]

RECORD_REVIEW_DECISION_TOOL_ICONS: Final[list[Icon]] = [
    _svg_icon(
        """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="18" fill="#E0E7FF"/>
  <circle cx="32" cy="32" r="17" fill="#4338CA"/>
  <path d="M24 32L30 38L41 26" stroke="#F8FAFC" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
""".strip()
    )
]

GET_DOCUMENT_REVIEW_TOOL_ICONS: Final[list[Icon]] = [
    _svg_icon(
        """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="18" fill="#E0F2FE"/>
  <path d="M12 32C16 24 23 20 32 20C41 20 48 24 52 32C48 40 41 44 32 44C23 44 16 40 12 32Z" fill="#0284C7"/>
  <circle cx="32" cy="32" r="7" fill="#F8FAFC"/>
</svg>
""".strip()
    )
]

CREATE_LISTING_DRAFT_TOOL_ICONS: Final[list[Icon]] = [
    _svg_icon(
        """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="18" fill="#FFEDD5"/>
  <path d="M15 26L30 15H49V34L34 49H15V26Z" fill="#EA580C"/>
  <path d="M39 21L43 25" stroke="#FDBA74" stroke-width="4" stroke-linecap="round"/>
</svg>
""".strip()
    )
]

GET_LISTING_DRAFT_TOOL_ICONS: Final[list[Icon]] = [
    _svg_icon(
        """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="18" fill="#FFF7ED"/>
  <path d="M17 18H35L45 28V46H17V18Z" fill="#FB923C"/>
  <path d="M24 30H38M24 37H38" stroke="#FFF7ED" stroke-width="4" stroke-linecap="round"/>
</svg>
""".strip()
    )
]

GET_MARKETPLACE_POSTING_CHECKLIST_TOOL_ICONS: Final[list[Icon]] = [
    _svg_icon(
        """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="18" fill="#FFFBEB"/>
  <rect x="16" y="14" width="32" height="36" rx="4" fill="#F59E0B"/>
  <path d="M24 26L27 29L32 22M24 36L27 39L32 32M36 26H41M36 36H41" stroke="#FFFBEB" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
""".strip()
    )
]

SHOW_GOOGLE_MAP_TOOL_ICONS: Final[list[Icon]] = [
    _svg_icon(
        """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="18" fill="#ECFDF5"/>
  <path d="M18 16H46V48H18V16Z" fill="#14B8A6"/>
  <path d="M24 22H40M24 42H40M22 30H42" stroke="#ECFDF5" stroke-width="4" stroke-linecap="round"/>
  <path d="M37 30C37 35 32 40 32 40C32 40 27 35 27 30C27 27 29 25 32 25C35 25 37 27 37 30Z" fill="#F43F5E"/>
</svg>
""".strip()
    )
]

CREATE_QUOTE_COMPARISON_TOOL_ICONS: Final[list[Icon]] = [
    _svg_icon(
        """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="18" fill="#E5E7EB"/>
  <rect x="16" y="22" width="10" height="24" rx="2" fill="#4B5563"/>
  <rect x="28" y="16" width="10" height="30" rx="2" fill="#1F2937"/>
  <rect x="40" y="28" width="10" height="18" rx="2" fill="#9CA3AF"/>
</svg>
""".strip()
    )
]

RECORD_QUOTE_DECISION_TOOL_ICONS: Final[list[Icon]] = [
    _svg_icon(
        """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="18" fill="#FEF3C7"/>
  <path d="M24 16H40V24C40 29 36 33 32 33C28 33 24 29 24 24V16Z" fill="#B45309"/>
  <path d="M27 33V40H37V33M24 44H40" stroke="#92400E" stroke-width="4" stroke-linecap="round"/>
</svg>
""".strip()
    )
]

GET_QUOTE_COMPARISON_TOOL_ICONS: Final[list[Icon]] = [
    _svg_icon(
        """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="18" fill="#F3F4F6"/>
  <rect x="16" y="18" width="32" height="28" rx="4" fill="#6B7280"/>
  <path d="M16 28H48M28 18V46" stroke="#F9FAFB" stroke-width="4"/>
</svg>
""".strip()
    )
]

CREATE_SUBMISSION_PACK_TOOL_ICONS: Final[list[Icon]] = [
    _svg_icon(
        """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="18" fill="#DCFCE7"/>
  <path d="M16 22H48V46H16V22Z" fill="#16A34A"/>
  <path d="M16 22L22 16H42L48 22" fill="#86EFAC"/>
</svg>
""".strip()
    )
]

UPDATE_SUBMISSION_ITEM_STATUS_TOOL_ICONS: Final[list[Icon]] = [
    _svg_icon(
        """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="18" fill="#ECFCCB"/>
  <path d="M19 42L41 20L45 24L23 46H19V42Z" fill="#4D7C0F"/>
  <path d="M38 23L41 26" stroke="#D9F99D" stroke-width="4" stroke-linecap="round"/>
</svg>
""".strip()
    )
]

GET_SUBMISSION_PACK_TOOL_ICONS: Final[list[Icon]] = [
    _svg_icon(
        """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="18" fill="#F0FDF4"/>
  <rect x="18" y="14" width="28" height="38" rx="4" fill="#22C55E"/>
  <path d="M24 25H40M24 33H40M24 41H34" stroke="#F0FDF4" stroke-width="4" stroke-linecap="round"/>
</svg>
""".strip()
    )
]
