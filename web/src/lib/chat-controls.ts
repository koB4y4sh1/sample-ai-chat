import { Bot, Code2, FileSearch, Image as ImageIcon, LayoutDashboard, Search } from 'lucide-react';

export const MODEL_OPTIONS = [
  {
    id: 'openai',
    provider: 'openai',
    model: 'gpt-5.4-nano',
    agentId: 'zenith',
    name: 'OpenAI',
    icon: 'OA',
    description: 'Azure Foundry OpenAI agent endpoint.',
  },
  {
    id: 'anthropic',
    provider: 'anthropic',
    model: 'claude-sonnet-4-5',
    agentId: 'zenith',
    name: 'Anthropic',
    icon: 'AN',
    description: 'Azure Foundry Anthropic agent endpoint.',
  },
  {
    id: 'lang-chain',
    provider: 'lang-chain',
    model: 'langgraph',
    agentId: 'zenith',
    name: 'LangGraph',
    icon: 'LG',
    description: 'Python LangChain LangGraph AG-UI endpoint.',
  },
] as const;

export const TOOL_OPTIONS = [
  {
    id: 'generative-ui',
    name: 'Generative UI',
    description: 'Render structured answers as interactive UI.',
    icon: LayoutDashboard,
  },
  {
    id: 'mcp-apps',
    name: 'MCP Apps',
    description: 'Open-ended embedded app surfaces.',
    icon: Bot,
  },
  {
    id: 'web-search',
    name: 'Web Search',
    description: 'Use current external information when needed.',
    icon: Search,
  },
  {
    id: 'code-review',
    name: 'Code Review',
    description: 'Inspect code, diffs, and implementation risk.',
    icon: Code2,
  },
  {
    id: 'file-analysis',
    name: 'File Analysis',
    description: 'Use attached documents, JSON, CSV, and logs.',
    icon: FileSearch,
  },
  {
    id: 'image-analysis',
    name: 'Image Analysis',
    description: 'Use attached screenshots and images.',
    icon: ImageIcon,
  },
] as const;

export type ChatModelId = (typeof MODEL_OPTIONS)[number]['id'];
export type ChatToolId = (typeof TOOL_OPTIONS)[number]['id'];

export type ChatControlsState = {
  selectedModel: ChatModelId;
  selectedTools: ChatToolId[];
};

export const DEFAULT_CHAT_CONTROLS: ChatControlsState = {
  selectedModel: 'openai',
  selectedTools: ['generative-ui'],
};

export const getModelOption = (modelId: string) =>
  MODEL_OPTIONS.find((model) => model.id === modelId) ?? MODEL_OPTIONS[0];

export const isChatModelId = (modelId: string): modelId is ChatModelId =>
  MODEL_OPTIONS.some((model) => model.id === modelId);

export const getToolOption = (toolId: string) => TOOL_OPTIONS.find((tool) => tool.id === toolId);

export const buildChatControlContext = ({ selectedTools }: ChatControlsState) => ({
  enabledTools: selectedTools.flatMap((toolId) => {
    const tool = getToolOption(toolId);
    return tool ? [{ id: tool.id, name: tool.name, description: tool.description }] : [];
  }),
  rules: [
    'Treat this as user-selected UI/runtime preference context.',
    'Prefer enabled tools when they fit the user request.',
    'If Generative UI is enabled and the user asks for visual or structured output, call the frontend UI tool instead of returning raw JSON.',
    'If File Analysis or Image Analysis is enabled, inspect attached content when present.',
  ],
});

export const CHAT_SUGGESTIONS = [
  {
    title: '根拠を確認',
    message: '今の回答の根拠、前提、未確定事項を整理してください。',
  },
  {
    title: '実装手順',
    message: 'この内容を実装する場合の手順、影響範囲、確認コマンドを整理してください。',
  },
  {
    title: 'リスク確認',
    message: 'この方針のリスク、壊れやすい点、追加で確認すべきテストを挙げてください。',
  },
  {
    title: 'UIで整理',
    message: '今の内容をGenerative UIで、判断材料、タスク、確認事項に分けて表示してください。',
  },
] as const;

export const HOME_PROMPT_SUGGESTIONS = [
  {
    title: '実行計画をUI化',
    description: 'task_planで方針、タスク、リスク、完了条件をカード表示します。',
    message:
      'Generative UIのtask_planで、次の要件を「実装方針」「影響範囲」「タスク」「リスク」「完了条件」に分けて表示してください。\n\n要件: チャット履歴にtool_callとtool_resultを正しい順序で保持し、画面にもツール実行状況を表示する。',
  },
  {
    title: '比較表を作成',
    description: 'comparisonとdecisionで選択肢、評価軸、推奨案を可視化します。',
    message:
      'Generative UIでcomparisonとdecisionを使い、次の選択肢を比較して推奨案を表示してください。\n\n選択肢: 1. OpenAI endpointを直接使う 2. LangChain endpointに統合する 3. MCP toolを別サービスとして呼ぶ\n評価軸: 保守性、実装コスト、障害調査のしやすさ、AG-UI互換性。',
  },
  {
    title: '進捗を可視化',
    description: 'progress_trackerとchecklistで作業状態を追えるUIを作ります。',
    message:
      'Generative UIのprogress_trackerとchecklistで、次の作業の進捗UIを作ってください。\n\n作業: 仕様確認、テスト追加、実装修正、lint/typecheck、動作確認\n現在の状態: 仕様確認は完了、テスト追加は進行中、残りは未着手。',
  },
  {
    title: '確認パネルを表示',
    description: 'confirmation_panelで実行前の内容、影響、承認項目を表示します。',
    message:
      'Generative UIのconfirmation_panelで、次の操作を実行前確認として表示してください。\n\n操作: LangChain endpointの設定変更\n表示項目: 実行内容、影響範囲、ロールバック方針、承認ボタン。',
  },
  {
    title: 'Google Maps MCP App',
    description: 'MCP AppsでGoogle Mapsをiframe表示し、中心座標とmarkerを確認します。',
    message:
      'MCP Appsのmap_view_show_google_mapを使って、Google Mapsをiframeに表示してください。\n\n地図: 東京駅周辺\n中心座標: lat 35.681236, lng 139.767125\nzoom: 14\nmarkers:\n- 東京駅: lat 35.681236, lng 139.767125, note 丸の内中央口\n- 皇居外苑: lat 35.679501, lng 139.758037, note 徒歩圏の確認地点',
  },
] as const;

export const LEGACY_HOME_PROMPT_SUGGESTIONS = [
  {
    title: 'エラーを診断する',
    description: '原因候補、再現手順、修正案、確認コマンドに分解します。',
    message:
      '以下のエラーを error_diagnosis で、原因候補、再現手順、修正案、確認コマンドに分けて整理して。\n\n',
  },
  {
    title: '実装計画を作る',
    description: '要件から影響範囲、作業順、リスク、完了条件を整理します。',
    message:
      'この要件をもとに、実装方針、影響範囲、タスク分解、リスク、完了条件を task_plan で整理して。\n\n',
  },
  {
    title: '変更差分を校閲する',
    description: '変更前後、改善点、注意点を diff_preview で確認します。',
    message:
      '以下の文章を校閲し、変更前後を diff_preview で表示して。あわせて修正理由を短く整理して。\n\n',
  },
  {
    title: '実行前に確認する',
    description: '削除、更新、外部送信などの前に承認パネルを作ります。',
    message:
      '次の作業を実行する前に confirmation_panel で、実行内容、影響範囲、取り消し方法、承認アクションを表示して。\n\n',
  },
] as const;

const TOOL_SUGGESTION_MAP: Partial<
  Record<ChatToolId, ReadonlyArray<{ title: string; message: string }>>
> = {
  'web-search': [
    { title: '最新情報を検索', message: 'この話題に関する最新情報をWeb検索して要約してください。' },
    {
      title: '比較情報を調べる',
      message: 'この選択肢についてWeb検索で比較情報を集めて整理してください。',
    },
  ],
  'code-review': [
    {
      title: '実装手順',
      message: 'この内容を実装する場合の手順、影響範囲、確認コマンドを整理してください。',
    },
    {
      title: 'リスク確認',
      message: 'この方針のリスク、壊れやすい点、追加で確認すべきテストを挙げてください。',
    },
  ],
  'generative-ui': [
    {
      title: 'UIで整理',
      message: '今の内容をGenerative UIで、判断材料、タスク、確認事項に分けて表示してください。',
    },
  ],
  'file-analysis': [
    {
      title: 'ファイルを分析',
      message: '添付ファイルの内容を分析し、重要なポイントと問題点を整理してください。',
    },
  ],
};

const BASE_SUGGESTIONS = [
  { title: '根拠を確認', message: '今の回答の根拠、前提、未確定事項を整理してください。' },
  { title: '次のアクション', message: 'この内容から次に取るべきアクションを3つ提案してください。' },
];

export const buildToolAwareSuggestions = (
  selectedTools: ChatToolId[],
): ReadonlyArray<{ title: string; message: string }> => {
  const toolSpecific = selectedTools.flatMap((id) => TOOL_SUGGESTION_MAP[id] ?? []);
  const seen = new Set<string>();
  const unique = [...BASE_SUGGESTIONS, ...toolSpecific].filter(({ title }) => {
    if (seen.has(title)) return false;
    seen.add(title);
    return true;
  });
  return unique.slice(0, 4);
};
