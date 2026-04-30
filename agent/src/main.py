if __package__:
    from .app import create_app
else:
    import sys
    from pathlib import Path

    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from src.app import create_app


def main() -> None:
    import uvicorn

    uvicorn.run(create_app(), host="127.0.0.1", port=8100)


if __name__ == "__main__":
    main()


__all__ = ["create_app", "main"]
