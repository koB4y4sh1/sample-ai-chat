"""Small .env loader for MCP services."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Final

REPO_ROOT: Final = Path(__file__).resolve().parents[3]


def _parse_env_line(line: str) -> tuple[str, str] | None:
    stripped = line.strip()
    if not stripped or stripped.startswith("#"):
        return None

    if stripped.startswith("export "):
        stripped = stripped.removeprefix("export ").strip()

    key, separator, raw_value = stripped.partition("=")
    if not separator:
        return None

    key = key.strip()
    if not key:
        return None

    value = raw_value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
        value = value[1:-1]

    return key, value


def load_env_file(path: Path) -> None:
    if not path.exists():
        return

    for line in path.read_text(encoding="utf-8").splitlines():
        parsed = _parse_env_line(line)
        if parsed is None:
            continue

        key, value = parsed
        os.environ.setdefault(key, value)


def load_repo_env() -> None:
    load_env_file(REPO_ROOT / ".env")
    load_env_file(REPO_ROOT / "mcp" / ".env")
