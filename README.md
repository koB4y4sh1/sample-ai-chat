# Zenith AI Chat

Next.js frontend/BFF, AgentFramework-based AG-UI service, and FastMCP server for
a monorepo chat application.

## Layout

```text
web/    Next.js frontend and BFF route handlers
agent/  Python agent service
mcp/    FastMCP tool server
docs/   Markdown sources (`spec/`), generated HTML (`html/`), templates (`template/`)
```

## Prerequisites

- Node.js 24.x
- pnpm 10.33.x
- uv 0.11.x
- Python 3.14.x

## Setup

```bash
pnpm install
uv sync --all-packages --dev
uv run pre-commit install
```

Copy the environment examples that apply to the services you run.

```bash
cp web/.env.example web/.env
cp /.env.example /.env
```

## Quality Gates

```bash
pnpm run format
pnpm run check
```

The root `check` script runs Biome, Ruff, TypeScript type checks, and strict mypy.

## Development

```bash
pnpm run dev:web
pnpm run dev:agent
pnpm run dev:mcp
```

The request path is now:

- `web` serves the Next.js app and exposes the BFF route at `/api/copilotkit`
- the Next.js route hosts CopilotKit Runtime and forwards agent runs to `/copilotkit`
- `` hosts the Microsoft Agent Framework endpoint via `add_agent_framework_fastapi_endpoint`

The `mcp` package now provides four dedicated FastMCP servers:

- `document-diff-review` for structured diff review plus human approval decisions
- `marketplace-listing-assist` for seller-facing listing drafts, pricing guidance, and posting checklists
- `quote-comparison-workspace` for vendor quote comparison and decision tracking
- `submission-pack-workspace` for checklist-driven application and submission preparation

The source tree is organized around a mounted root server at `mcp/src/server.py`,
with child server packages under `mcp/src/servers/*` and shared helpers under
`mcp/src/shared`.

The mounted root server supports both transports; the default dev script uses HTTP with hot reload:

- `pnpm run dev:mcp` watches `mcp/src` and runs the `root-http` target (streamable HTTP at `http://127.0.0.1:8101/mcp`, restarting on Python changes).

Other targets (stdio `root`, child servers, and so on) use `uv run python mcp/src/dev.py <target>`; see `TARGETS` in `mcp/src/dev.py`.

Set provider credentials in `/.env` before running a real model-backed conversation.
Set `GOOGLE_MAPS_API_KEY` in `/.env` for the MCP Google Maps app, or in
`web/.env` for the Next.js iframe route.
