import { ChevronDown } from 'lucide-react';
import { type ChatModelId, getModelOption, MODEL_OPTIONS } from '@/lib/chat-controls';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
  value: ChatModelId;
  onChange: (val: ChatModelId) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const selected = getModelOption(value);

  return (
    <div className="relative group">
      <div className="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-sidebar-bg px-4 py-1.5 text-xs font-medium text-text-primary shadow-xs transition-colors hover:bg-bg">
        <div className="h-2 w-2 rounded-full bg-accent-gradient" />
        <span>{selected.name}</span>
        <ChevronDown className="h-3 w-3 text-text-secondary" />
      </div>

      <div className="invisible absolute bottom-full left-0 z-50 mb-2 w-64 rounded-xl border border-border bg-sidebar-bg p-1 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
        {MODEL_OPTIONS.map((model) => (
          <button
            key={model.id}
            type="button"
            onClick={() => onChange(model.id)}
            className={cn(
              'flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-2 text-left text-xs transition-colors',
              value === model.id
                ? 'bg-bg text-text-primary font-medium'
                : 'hover:bg-bg text-text-secondary hover:text-text-primary',
            )}
          >
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border text-[10px]">
              {model.icon}
            </span>
            <span className="min-w-0">
              <span className="block font-medium">{model.name}</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-text-secondary">
                {model.description}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
