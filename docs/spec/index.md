---
title: Zenith AI Chat ドキュメント索引
description: Zenith AI Chat の HTML ドキュメント一覧とカテゴリ別リンク。
---

<section class="hero">
  <p class="eyebrow">Zenith AI Chat Documentation</p>
  <h1>ドキュメントを読むための索引</h1>
  <p class="lead">
    <strong>初めてなら</strong> <a href="./documentation-guide.html">ドキュメントガイド</a>（読む順・ページ一覧）を先にどうぞ。ソースは <code>docs/spec</code> の Markdown、閲覧用 HTML は <code>pnpm run docs:build</code> で <code>docs/html</code> に出力する。
  </p>
</section>

<section>
  <div class="section-header">
    <h2>ドキュメント一覧</h2>
    <p class="section-kicker">Categories</p>
  </div>

  <div class="category">
    <div class="section-header">
      <h2>入口・全体</h2>
      <p class="section-kicker">Start here</p>
    </div>
    <div class="grid">
      <article class="card">
        <span class="tag">Guide</span>
        <h3><a href="./documentation-guide.html">ドキュメントガイド</a></h3>
        <p>読む順番、用途別インデックス、全ページの説明。</p>
      </article>
      <article class="card">
        <span class="tag">Specification</span>
        <h3><a href="./specification.html">全体仕様書</a></h3>
        <p>目的・構成・接続・Generative UI・品質ゲートの基準。</p>
      </article>
      <article class="card">
        <span class="tag">Decision</span>
        <h3><a href="./mcp-theme-selection.html">MCPテーマ選定メモ</a></h3>
        <p>MCP UI のテーマ判断・設計ログ。</p>
      </article>
      <article class="card">
        <span class="tag">Environment</span>
        <h3><a href="./environment-configuration.html">環境設定仕様</a></h3>
        <p>ツールバージョン、セットアップ、環境変数、起動・検証コマンド。</p>
      </article>
      <article class="card">
        <span class="tag">Workspace</span>
        <h3><a href="./workspace-overview.html">ワークスペース概要</a></h3>
        <p>パッケージ境界と通信の流れ（web / agent / mcp）。</p>
      </article>
      <article class="card">
        <span class="tag">Directories</span>
        <h3><a href="./directory-structure.html">ディレクトリ構成仕様</a></h3>
        <p>コードを置く場所の索引。</p>
      </article>
      <article class="card">
        <span class="tag">API Flow</span>
        <h3><a href="./api-communication-flow.html">API・通信フロー仕様</a></h3>
        <p>BFF、Runtime、agent 間の経路。</p>
      </article>
    </div>
  </div>

  <div class="category">
    <div class="section-header">
      <h2>開発フローと品質</h2>
      <p class="section-kicker">Workflow</p>
    </div>
    <div class="grid">
      <article class="card">
        <span class="tag">Rules</span>
        <h3><a href="./development-rules.html">開発ルール仕様</a></h3>
        <p>このリポジトリで守るべきサービス境界、依存追加方針、Generative UI、仕様更新の流れをまとめる。</p>
      </article>
      <article class="card">
        <span class="tag">Biome</span>
        <h3><a href="./biome-guide.html">Biome ガイド</a></h3>
        <p>フォーマッタ／リンターとしての運用、設定値、よくある修正、品質コマンドをまとめる。</p>
      </article>
      <article class="card">
        <span class="tag">Ruff</span>
        <h3><a href="./ruff-guide.html">Ruff ガイド</a></h3>
        <p>Python 側の formatter と linter としての運用、ルール、修正内容、品質コマンドをまとめる。</p>
      </article>
      <article class="card">
        <span class="tag">mypy</span>
        <h3><a href="./mypy-guide.html">mypy ガイド</a></h3>
        <p>strict type check の前提、対象範囲、mypy_path、修正ルール、運用上の注意をまとめる。</p>
      </article>
      <article class="card">
        <span class="tag">Hooks</span>
        <h3><a href="./pre-commit-guide.html">pre-commit ガイド</a></h3>
        <p>コミット時フックの構成、ローカルフックの役割、初回セットアップの読み方をまとめる。</p>
      </article>
      <article class="card">
        <span class="tag">Testing</span>
        <h3><a href="./test-strategy.html">テスト戦略仕様</a></h3>
        <p>pytest と Vitest の役割分担、現状のテスト配置、追加時の考え方をまとめる。</p>
      </article>
      <article class="card">
        <span class="tag">Dependencies</span>
        <h3><a href="./dependency-policy.html">依存関係ポリシー仕様</a></h3>
        <p>pnpm、uv、lockfile、runtime 依存追加の判断基準をまとめる。</p>
      </article>
    </div>
  </div>

  <div class="category">
    <div class="section-header">
      <h2>AI・UI 関連</h2>
      <p class="section-kicker">AI Surfaces</p>
    </div>
    <div class="grid">
      <article class="card">
        <span class="tag">Generative UI</span>
        <h3><a href="./generative-ui.html">Generative UI 解説</a></h3>
        <p>static、declarative、open-ended の三類型と block catalog の関係をまとめる。</p>
      </article>
      <article class="card">
        <span class="tag">CopilotKit</span>
        <h3><a href="./copilotkit-guide.html">CopilotKit ガイド</a></h3>
        <p>Next.js 側の Runtime、Provider、frontend tool 登録、agent 連携の位置づけを説明する。</p>
      </article>
      <article class="card">
        <span class="tag">AG-UI</span>
        <h3><a href="./ag-ui-guide.html">AG-UI ガイド</a></h3>
        <p>Python agent サービスの AG-UI endpoint、マウント構成、設定と CORS。</p>
      </article>
      <article class="card">
        <span class="tag">A2UI</span>
        <h3><a href="./a2ui-guide.html">A2UI ガイド</a></h3>
        <p>このリポジトリにおける A2UI の扱いと、生成 UI の block catalog との対応をまとめる。</p>
      </article>
      <article class="card">
        <span class="tag">Examples</span>
        <h3><a href="./generative-ui-examples.html">Generative UI サンプルカタログ</a></h3>
        <p>ユーザー発話に応じてどの frontend tool と block を使うかを具体ケースでまとめる。</p>
      </article>
    </div>
  </div>
</section>

<p class="footer-note">
  <a href="./documentation-guide.html">ドキュメントガイド</a>の順路に沿うと迷いにくい。全体仕様のあと環境・ワークスペース、必要に応じて品質ツールと AI・UI を読む。
</p>
