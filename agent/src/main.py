if __package__:
    from .config import get_settings, parse_cors_origins
    from .lang_chain.app import create_app as create_lang_chain_app
    from .mfa.app import create_app as create_mfa_app
else:
    import sys
    from pathlib import Path

    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from src.config import get_settings, parse_cors_origins
    from src.lang_chain.app import create_app as create_lang_chain_app
    from src.mfa.app import create_app as create_mfa_app

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Zenith Agent Service")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=parse_cors_origins(settings.cors_origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.mount("/mfa", create_mfa_app())
    app.mount("/lang-chain", create_lang_chain_app())

    @app.get("/health")
    async def healthcheck() -> dict[str, str]:
        return {
            "status": "ok",
            "mfa": "/mfa",
            "lang_chain": "/lang-chain",
        }

    return app


def main() -> None:
    import uvicorn

    uvicorn.run(create_app(), host="127.0.0.1", port=8100)


if __name__ == "__main__":
    main()


__all__ = ["create_app", "main"]
