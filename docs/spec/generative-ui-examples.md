Zenith AI Chat / Generative UI Example Catalog

# Generative UI サンプルカタログ

この仕様は、ユーザー発話に応じてどの frontend tool と UI block を選ぶと説明しやすいかを具体例でまとめたものである。完璧な一覧ではなく、運用上の判断のヒントとして使う。

## 1. 使い分けの基本

| ユーザー意図の例 | 主な tool | 狙い |
| --- | --- | --- |
| ダッシュボード風の status / summary | `show_zenith_panel` | 指標が決まっていて複数の数値と next actions を見せたい。 |
| 表・比較・一覧・アクションなど宣言的な見せ方 | `show_ui_spec` | block catalog の組み合わせで柔軟にレイアウトできる。 |
| 埋め込みアプリ型の調査・ツール | `Runtime mcpApps.servers` | iframe surface を使う MCP Apps 表示が主役。 |

## 2. 具体例

| ユーザー発話のニュアンス | 候補 tool | 候補 block / 表示 |
| --- | --- | --- |
| 案件の状況をカードで見せたい | `show_zenith_panel` | title、summary、metrics、nextActions を使う構成が無難。 |
| 検索結果をリストや表、アクション付きで見せたい | `show_ui_spec` | `callout`、`table`、`actions` など。 |
| 複数案を比較して決めたい | `show_ui_spec` | `comparison`、`decision`、`risk_matrix` など。 |
| 進捗を一覧で見せたい | `show_ui_spec` | `progress`、`checklist`、`timeline` など。 |
| リファクタの before / after を見せたい | `show_ui_spec` | `diff_preview` 系 block。before と after を両方渡す。 |
| フライトの候補をカードで出したい | `show_flight_options` または `show_ui_spec` | ドメイン固有の flight result surface を優先する。 |
| 組み込みアプリを実行したい | `Runtime mcpApps.servers` | appId と prompt に応じて iframe で出す。 |

## 3. 運用で気をつけること

- 会話の一文に複数 tool を無秩序に混ぜない。
- flight 系は raw JSON のまま渡さない。
- diff 表示では before と after を揃えて渡す。
- MCP Apps が必要なときだけ iframe を選ぶ。
