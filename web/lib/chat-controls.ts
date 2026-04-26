import { Bot, Code2, FileSearch, Image as ImageIcon, LayoutDashboard, Search } from 'lucide-react';

export const MODEL_OPTIONS = [
  {
    id: 'zenith-balanced',
    name: 'Balanced',
    icon: 'BA',
    description: 'General work, chat, and UI generation.',
  },
  {
    id: 'zenith-fast',
    name: 'Fast',
    icon: 'FA',
    description: 'Shorter answers and lower latency.',
  },
  {
    id: 'zenith-reasoning',
    name: 'Reasoning',
    icon: 'RE',
    description: 'Deeper analysis and safer plans.',
  },
  {
    id: 'zenith-ui',
    name: 'UI Builder',
    icon: 'UI',
    description: 'Prefer Generative UI and visual layouts.',
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
  selectedModel: 'zenith-balanced',
  selectedTools: ['generative-ui'],
};

export const getModelOption = (modelId: string) =>
  MODEL_OPTIONS.find((model) => model.id === modelId) ?? MODEL_OPTIONS[0];

export const getToolOption = (toolId: string) => TOOL_OPTIONS.find((tool) => tool.id === toolId);

export const buildChatControlContext = ({ selectedModel, selectedTools }: ChatControlsState) => ({
  model: getModelOption(selectedModel),
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
