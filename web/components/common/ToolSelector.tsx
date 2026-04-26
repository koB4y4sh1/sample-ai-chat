import { Briefcase, Globe, Image as ImageIcon } from 'lucide-react';
import type React from 'react';
import { cn } from '../../lib/utils';

const tools = [
  { id: 'search', name: 'Web Search', icon: Globe },
  { id: 'image', name: 'Generate Image', icon: ImageIcon },
  { id: 'data', name: 'Data Analysis', icon: Briefcase },
];

interface ToolSelectorProps {
  value: string[];
  onChange: (val: string[]) => void;
}

export function ToolSelector({ value, onChange }: ToolSelectorProps) {
  const toggleTool = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  return (
    <div className="relative group">
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-sidebar-bg hover:bg-bg transition-colors cursor-pointer text-xs font-medium text-text-primary shadow-xs">
        <div className="w-4 h-4 rounded-[4px] bg-accent-gradient opacity-80" />
        <span>{value.length > 0 ? `Tools (${value.length})` : 'Tools'}</span>
      </div>

      <div className="absolute top-full mt-2 left-0 w-56 bg-sidebar-bg border border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-2 z-50">
        <div className="p-2 text-[10px] font-bold text-text-secondary uppercase tracking-wider">
          Available Tools
        </div>
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = value.includes(tool.id);
          return (
            <button
              key={tool.id}
              type="button"
              onClick={(e) => toggleTool(tool.id, e)}
              className={cn(
                'flex w-full items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-xs transition-all mb-0.5 text-left',
                isActive
                  ? 'bg-bg text-text-primary font-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg',
              )}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-[4px] flex items-center justify-center transition-colors',
                  isActive
                    ? 'bg-sidebar-bg border border-border'
                    : 'bg-bg border border-transparent',
                )}
              >
                <Icon className={cn('w-3.5 h-3.5', isActive ? 'icon-gradient' : 'opacity-40')} />
              </div>
              <span className="flex-1">{tool.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
