# Zenith AI Chat

CopilotKit FE, FastAPI BFF, AgentFramework-based agent service, and FastMCP server
for a monorepo chat application.

## Layout

```text
a2ui/   TypeScript frontend and CopilotKit runtime
bff/    FastAPI backend-for-frontend
ag-ui/  Python agent service
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

## Quality Gates

```bash
pnpm run format
pnpm run check
```

The root `check` script runs Biome, Ruff, TypeScript type checks, and strict mypy.

## Development

```bash
pnpm run dev:fe
```

Service implementations for `bff`, `ag-ui`, and `mcp` are intentionally scaffolded
only as packages at this stage. Add service entry points after the API contracts are fixed.
