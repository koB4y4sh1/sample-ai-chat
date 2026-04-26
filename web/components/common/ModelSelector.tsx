import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

const models = [{ id: 'zenith', name: 'Zenith Agent', icon: 'AG' }];

interface ModelSelectorProps {
  value: string;
  onChange: (val: string) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const selected = models.find((model) => model.id === value) ?? models[0];

  return (
    <div className="relative group">
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-sidebar-bg hover:bg-bg transition-colors cursor-pointer text-xs font-medium text-text-primary shadow-xs">
        <div className="w-2 h-2 rounded-full bg-accent-gradient" />
        <span>{selected.name}</span>
        <ChevronDown className="w-3 h-3 text-text-secondary" />
      </div>

      <div className="absolute top-full mt-2 left-0 w-48 bg-sidebar-bg border border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-1 z-50">
        {models.map((model) => (
          <button
            key={model.id}
            type="button"
            onClick={() => onChange(model.id)}
            className={cn(
              'flex w-full items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors text-left',
              value === model.id
                ? 'bg-bg text-text-primary font-medium'
                : 'hover:bg-bg text-text-secondary hover:text-text-primary',
            )}
          >
            <span>{model.icon}</span>
            <span>{model.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
