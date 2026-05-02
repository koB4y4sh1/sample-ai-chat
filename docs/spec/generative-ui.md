# Generative UI 解説

対象: Zenith AI Chat / 更新日: 2026-04-25

**関連:** [全体仕様書](./specification.html) · [CopilotKit ガイド](./copilotkit-guide.html) · [サンプルカタログ](./generative-ui-examples.html)

## 結論

このアプリのGenerative UIは、AIが任意のHTMLを直接返す仕組みではない。 AIがfrontend toolを呼び出すか、CopilotKit RuntimeがMCP Appsをiframe surfaceとして表示している。

## 現在の表示方式

| 方式 | tool | 説明 |
| --- | --- | --- |
| Static | `show_zenith_panel` | 事前実装済みの`ZenithPanel`へagentがデータを流し込む。 |
| Declarative | `show_ui_spec` | agentがversioned UI schemaを返し、frontendのrendererがblock UIへ変換する。 |
| MCP Apps | `Runtime mcpApps.servers` | FastMCP AppsのresourceをCopilotKit Runtimeがiframe surfaceとして表示する。 |

## 何が「生成」されているのか

| 対象 | 生成されるか | 説明 |
| --- | --- | --- |
| React component | 生成されない | Staticでは`ZenithPanel`、Declarativeでは各block rendererがfrontendに固定実装されている。 |
| HTML / CSS | 生成されない | Static/Declarativeでは見た目はReactとTailwind classで決まる。MCP AppsではFastMCP AppsのresourceをRuntimeが表示する。 |
| UIに入るデータ | 生成される | Staticのpanel引数、DeclarativeのUI schema、MCP Appsの自然入力をagentがtool引数として作る。 |
| どのUIを使うかの判断 | 生成される | ユーザー要求に応じて、agentがfrontend toolを呼ぶか判断する。 |

## 登場人物

| 要素 | 役割 |
| --- | --- |
| ユーザー | 「Generative UIで表示して」「ステータスカードにして」などと依頼する。 |
| agent | 通常の文章で返すか、frontend toolまたはMCP Appsのどれを呼ぶか判断する。 |
| CopilotKit | agentのtool callをfrontendへ中継し、登録済みtoolのrenderを実行する。 |
| frontend | `useFrontendTool`でtoolを登録し、React componentを描画する。 |

## 処理の流れ

**1\. ユーザーが依頼する** 例: 「Generative UIでプロジェクト状況をステータスカード表示して」

**2\. agentがtool callを選ぶ** instructionにより、固定カードは`show_zenith_panel`、柔軟なschema UIは`show_ui_spec`、MCP AppsはRuntime登録されたApp toolを呼ぶ。

**3\. agentがUI用データを作る** `title`、`summary`、`metrics`、`nextActions`をtool引数にする。

**4\. CopilotKitがfrontendへ渡す** tool名に一致するfrontend toolを探し、登録済みの`render`を呼ぶ。

**5\. ReactがUIを描画する** `ZenithPanel`がtool引数をpropsとして受け取り、チャット内にカードUIを表示する。

## 実際の流れを1行で見る

```
ユーザー入力 → agent判断 → frontend tool call → CopilotKit → React renderer / iframe → チャット画面に表示
```

## このアプリのtool仕様

| 項目 | 値 |
| --- | --- |
| tool名 | `show_zenith_panel` / `show_ui_spec` / `show_flight_options` / `Runtime mcpApps.servers` |
| 登録API | `useFrontendTool` |
| 登録ファイル | `web/components/chat/GenerativeUIRegistry.tsx` |
| 表示component | `ZenithPanel` / `DeclarativeRenderer` / `StableMcpAppsActivityRenderer` |
| agent名 | `zenith` |
| tool実行後の追加応答 | `followUp: false` |

## tool引数

| field | 意味 | 制約 |
| --- | --- | --- |
| `title` | カードのタイトル | 必須 |
| `summary` | 本文の要約 | 必須 |
| `tone` | カードの意味合い | `neutral` / `positive` / `warning` |
| `metrics` | 数値や状態を表示するタイル | 最大4件 |
| `nextActions` | 次にやること | 最大5件 |

## 具体例

### ユーザー入力

```
Generative UIで、現在のプロジェクト状況をステータスカードとして表示して。
メトリクスを3つ、次のアクションを3つ含めて。
```

### agentが内部的に返すイメージ

```
show_zenith_panel({
  title: "Project Status",
  summary: "チャットUIとGenerative UIの基本実装は完了しています。",
  tone: "positive",
  metrics: [
    { label: "UI", value: "Done" },
    { label: "Agent", value: "Connected" },
    { label: "Docs", value: "Updated" }
  ],
  nextActions: [
    "実データに基づくmetricsへ置き換える",
    "tool種類を増やす",
    "E2Eでtool renderingを検証する"
  ]
})
```

### 画面に出るもの

上記の引数を受け取った`ZenithPanel`が、チャット内にカード、メトリクスタイル、 Next Actionsのリストとして表示される。

## 重要な制約

*   LLMが任意のUIを自由に作るわけではない。
*   Static/Declarativeで表示できるUIは、frontendに登録済みのtool、schema、React rendererに限定される。
*   MCP Appsはraw HTMLをagentから直接受け取らず、FastMCP AppsのresourceをRuntime経由で表示する。
*   toolを呼ぶかどうかはagentの判断に依存するため、promptでは「Generative UI」「ステータスカード」などを明示する。
*   agent instructionを変えた場合は`pnpm run dev:agent`を再起動する。

## 実装ファイル

| ファイル | 見るポイント |
| --- | --- |
| `web/components/chat/GenerativeUIRegistry.tsx` | frontend tool登録。汎用の`show_mcp_app`は登録しない。 |
| `web/components/chat/App.tsx` | `CopilotKitProvider`配下に`GenerativeUIRegistry`を配置。 |
| `web/components/generative-ui/declarative/DeclarativeRenderer.tsx` | Declarative UI schemaをReact UIへ変換。 |
| `web/components/chat/StableMcpAppsActivityRenderer.tsx` | MCP Apps activityを安定したiframe surfaceとして表示。 |
| `agent/src/app.py` | Generative UI要求時にtoolを呼ぶagent instruction。 |

## 公式docsとの関係

CopilotKitのdocsでは、Generative UIはagentの状態やtool呼び出しをUIとして描画する仕組みとして扱われる。 このアプリでは、そのうちfrontend toolの`render`を使う方式を採用している。

参照: [CopilotKit official docs llms-full.txt](https://docs.copilotkit.ai/llms-full.txt)
