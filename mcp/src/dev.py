"""MCP 開発用のホットリロードランチャー。"""

from __future__ import annotations

import argparse
import signal
import subprocess
import sys
from pathlib import Path
from typing import Final

from watchfiles import DefaultFilter, watch

REPO_ROOT: Final = Path(__file__).resolve().parents[2]
SRC_ROOT: Final = REPO_ROOT / "mcp" / "src"
TARGETS: Final[dict[str, tuple[str, str]]] = {
    "root": ("server", "main"),
    "root-http": ("server", "main_http"),
    "document-review": ("servers.document_review.server", "main"),
    "listing-assist": ("servers.listing_assist.server", "main"),
    "map-view": ("servers.map_view.server", "main"),
    "quote-compare": ("servers.quote_compare.server", "main"),
    "submission-pack": ("servers.submission_pack.server", "main"),
}


def _build_command(target: str) -> list[str]:
    module_name, function_name = TARGETS[target]
    return [
        sys.executable,
        "-c",
        (f"import sys; sys.path.insert(0, r'{SRC_ROOT}'); from {module_name} import {function_name}; {function_name}()"),
    ]


def _start_child(target: str) -> subprocess.Popen[bytes]:
    creationflags = getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0)
    return subprocess.Popen(  # noqa: S603
        _build_command(target),
        cwd=REPO_ROOT,
        creationflags=creationflags,
    )


def _stop_child(process: subprocess.Popen[bytes]) -> None:
    if process.poll() is not None:
        return

    try:
        if sys.platform == "win32":
            process.send_signal(signal.CTRL_BREAK_EVENT)
        else:
            process.terminate()
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=5)


def run_with_reload(target: str) -> None:
    """指定した MCP エントリポイントをファイル変更時に再起動する。"""

    process = _start_child(target)

    try:
        for _ in watch(str(SRC_ROOT), watch_filter=DefaultFilter()):
            _stop_child(process)
            process = _start_child(target)
    except KeyboardInterrupt:
        pass
    finally:
        _stop_child(process)


def main() -> None:
    """CLI からホットリロード対象の MCP サーバーを選んで起動する。"""

    parser = argparse.ArgumentParser(description="Run a Zenith MCP server with hot reload.")
    parser.add_argument("target", choices=sorted(TARGETS))
    args = parser.parse_args()
    run_with_reload(args.target)


if __name__ == "__main__":
    main()
