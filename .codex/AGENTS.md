# AGENTS.md

## Repository

Zenith AI Chat is a monorepo with these service boundaries:

- `web`: TypeScript frontend and CopilotKit runtime/BFF route handlers
- `agent`: Python agent service
- `mcp`: FastMCP tool server

## Commands

- JavaScript install: `pnpm install`
- Python install: `uv sync --all-packages --dev`
- Format: `pnpm run format`
- Lint: `pnpm run lint`
- Type check: `pnpm run typecheck`
- Full check: `pnpm run check`

## Required Practices

- Use `pnpm`, never `npm`.
- Use `uv`, never ad hoc Python installation commands.
- Keep unrelated edits out of a task.
- Prefer existing repo scripts over direct tool invocations.
- Update `docs/spec/specification.md` and run `pnpm run docs:build` (outputs `docs/html/specification.html`) when architecture or quality gates change.

## Quality

- TypeScript: Biome and `tsc --noEmit`.
- Python: Ruff and strict mypy.
- Hooks: pre-commit uses local `pnpm` and `uv`.
