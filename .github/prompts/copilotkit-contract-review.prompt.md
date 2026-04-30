---
name: "copilotkit-contract-review"
description: "CopilotKit 変更の契約カバレッジと service 境界違反をレビューする。"
agent: "agent"
---
現在の CopilotKit 関連変更をレビューする。

確認対象は以下に限定する。

- `/api/copilotkit` の request / response 契約
- CopilotKit provider と agent context の値
- provider / model による endpoint 選択
- frontend tool 登録と render 入力
- Generative UI の失敗時処理
- `web`、`agent`、`mcp` 間の service 境界違反

指摘事項を先に示し、可能ならファイルと行番号を付ける。無関係な style issue には触れない。
