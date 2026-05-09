import { Check } from 'lucide-react';
import type React from 'react';
import { type ChatToolId, TOOL_OPTIONS } from '@/lib/chat-controls';
import { cn } from '@/lib/utils';

interface ToolSelectorProps {
  value: ChatToolId[];
  onChange: (val: ChatToolId[]) => void;
}

export function ToolSelector({ value, onChange }: ToolSelectorProps) {
  const toggleTool = (id: ChatToolId, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  return (
    <div className="relative group">
      <div className="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-sidebar-bg px-4 py-1.5 text-xs font-medium text-text-primary shadow-xs transition-colors hover:bg-bg">
        <div className="h-4 w-4 rounded-[4px] bg-accent-gradient opacity-80" />
        <span>{value.length > 0 ? `Tools (${value.length})` : 'Tools'}</span>
      </div>

      <div className="invisible absolute bottom-full left-0 z-50 mb-2 w-72 rounded-xl border border-border bg-sidebar-bg p-2 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
        <div className="p-2 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
          Available Tools
        </div>
        {TOOL_OPTIONS.map((tool) => {
          const Icon = tool.icon;
          const isActive = value.includes(tool.id);
          return (
            <button
              key={tool.id}
              type="button"
              onClick={(e) => toggleTool(tool.id, e)}
              className={cn(
                'mb-0.5 flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-2 text-left text-xs transition-all',
                isActive
                  ? 'bg-bg text-text-primary font-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg',
              )}
            >
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] transition-colors',
                  isActive
                    ? 'bg-sidebar-bg border border-border'
                    : 'bg-bg border border-transparent',
                )}
              >
                <Icon className={cn('h-3.5 w-3.5', isActive ? 'icon-gradient' : 'opacity-40')} />
              </div>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{tool.name}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-text-secondary">
                  {tool.description}
                </span>
              </span>
              {isActive ? <Check className="mt-1 h-3.5 w-3.5 text-brand-end" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
