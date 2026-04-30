# AGENTS.md

## Scope

This repository is a monorepo for Zenith AI Chat.

- FE/BFF: `web` TypeScript, Next.js, React, CopilotKit, pnpm
- BE: `agent` Python agent service, uv
- MCP: `mcp` Python, FastMCP, uv

## Required Commands

- Install JavaScript dependencies: `pnpm install`
- Install Python dependencies: `uv sync --all-packages --dev`
- Format: `pnpm run format`
- Lint: `pnpm run lint`
- Type check: `pnpm run typecheck`
- Full quality gate: `pnpm run check`
- Install hooks: `uv run pre-commit install`

## Rules

- Use `pnpm`; do not use `npm`.
- Use `uv`; do not install Python packages with `pip` or `python install`.
- Use test-driven development for behavior changes: write or update the failing test first, confirm the failure, implement the smallest fix, then rerun the targeted test.
- For CopilotKit changes, test the observable contract first: UI behavior, `/api/copilotkit` request/response behavior, agent context values, endpoint selection, and frontend tool registration. Do not depend on CopilotKit runtime internals in tests.
- Keep service boundaries explicit:
  - `web` hosts the Next.js frontend and BFF route handlers.
  - `web` uses CopilotKit to access `ag-ui`.
  - `agent` owns agent behavior.
  - `mcp` owns tool exposure.
- Do not add runtime dependencies unless the target package and import name are confirmed.
- Treat Ruff, Biome, `tsc`, and mypy diagnostics as tracked work. Fix introduced or affected errors before completion; do not silence rules unless the reason is explicit in the config or nearest code.
- Update `docs/specification.html` when architecture, commands, or service contracts change.

## Quality Baseline

- TypeScript: Biome plus `tsc --noEmit`.
- Python: Ruff plus strict mypy.
- Lint commands must fail on diagnostics: `pnpm run lint:ts` runs Biome, and `pnpm run lint:py` runs `uv run ruff check .`.
- Git hooks: pre-commit runs lockfile refresh, Biome, Ruff, and mypy.
