"""MCP サーバー群で共有するスカラー型と補助関数。"""

from __future__ import annotations

from uuid import uuid4

type JSONScalar = str | int | float | bool | None


def build_identifier(prefix: str) -> str:
    """インメモリセッション向けの短い識別子を生成する。"""

    return f"{prefix}_{uuid4().hex[:12]}"


def normalize_label(value: str) -> str:
    """ユーザー入力の文字列を安定した識別子断片へ正規化する。"""

    cleaned = "".join(character.lower() if character.isalnum() else "-" for character in value)
    collapsed = "-".join(fragment for fragment in cleaned.split("-") if fragment)
    return collapsed or "item"
