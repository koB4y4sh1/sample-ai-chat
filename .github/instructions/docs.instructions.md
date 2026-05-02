---
name: "Repository Documentation"
description: "ドキュメントとリポジトリ共通ガイドに適用するルール。"
applyTo: "docs/**/*.{html,md},AGENTS.md,CODING.md,.github/**/*.md,skills/**/*.md"
---

# Documentation

- ドキュメントの正は `docs/spec/*.md`。閲覧用 HTML は `pnpm run docs:build` で `docs/html` に生成する。
- リポジトリ共通の Markdown ガイドはルート、`.github/`、または `skills/` 配下に置く（共有エージェントスキルは `skills/*/SKILL.md`）。
- アーキテクチャ、コマンド、環境変数、service contract、tool schema、CI、pre-commit の挙動を変えた場合は `docs/spec/specification.md` を更新し、`pnpm run docs:build` で `docs/html/specification.html` を再生成する。
- ドキュメントは事実と運用手順に限定する。宣伝文句は追加しない。
