# Zenith AI Chat

Next.js frontend/BFF, AgentFramework-based AG-UI service, and FastMCP server for
a monorepo chat application.

## Layout

```text
web/    Next.js frontend and BFF route handlers
agent/  Python agent service
mcp/    FastMCP tool server
docs/   HTML specifications
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
```

The request path is now:

- `web` serves the Next.js app and exposes the BFF route at `/api/copilotkit`
- the Next.js route hosts CopilotKit Runtime and forwards agent runs to `/copilotkit`
- `` hosts the Microsoft Agent Framework endpoint via `add_agent_framework_fastapi_endpoint`

Set provider credentials in `/.env` before running a real model-backed conversation.
