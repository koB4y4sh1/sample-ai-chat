Zenith AI Chat / Test Strategy

# テスト戦略仕様

この仕様は、現状のテスト配置と、変更時にテストを追加するときの覚え方を整理する。現状のコードでは smoke と単体寄りのテストが中心なので、目的に合わせて拡張する。

## 1. 現在のテスト配置

| 領域 | ツール | 所在・内容 |
| --- | --- | --- |
| agent | `pytest` | `test_app.py` で endpoint 登録と health、`test_ag_ui_package.py` で import smoke など。 |
| mcp | `pytest` | package import、server の起動、tool、repository の状態更新などを確認している。 |
| web | `Vitest` + `jsdom` | `App.test.tsx` と `DeclarativeRenderer.test.tsx` などで UI 単体を確認する。 |

## 2. 実行コマンド

```
uv run pytest
pnpm --filter @zenith/web test
pnpm run test
pnpm --filter @zenith/web exec vitest run components/chat/App.test.tsx
```

ルートの `pnpm run test` は Python と frontend を続けて実行する。個別の失敗を潰すときはパッケージ単位で切るとよい。

## 3. どこまで書くか

| 変更の種類 | 推奨テスト |
| --- | --- |
| FastAPI endpoint、settings、agent app の変更 | pytest で app 生成と endpoint 応答を確認する。 |
| MCP tool の仕様や repository 更新 | pytest で tool 名と状態遷移を確認する。 |
| React の表示、会話入力、renderer の差分 | Vitest で DOM 表示と入力結果を確認する。 |
| ごく小さい package scaffold | import smoke で足りる場合もあるが、feature では実質と矛盾しないようにする。 |

## 4. この仕様として頭に置くこと

- agent と mcp は Python の単体寄りテストが主体である。
- web は jsdom 上の UI テストが主体である。
- feature 変更では smoke だけで済ませず、必要なら統合確認まで足す。
- service 境界は contract test を優先する、という方針がある。
