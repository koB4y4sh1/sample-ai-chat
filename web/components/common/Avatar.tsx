import { Sparkles, User } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AvatarProps {
  role: 'user' | 'assistant';
}

export function Avatar({ role }: AvatarProps) {
  return (
    <div
      className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm',
        role === 'user'
          ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          : 'bg-slate-900 dark:bg-white text-white dark:text-black',
      )}
    >
      {role === 'user' ? (
        <User className="w-5 h-5" />
      ) : (
        <Sparkles className="w-5 h-5 icon-gradient" />
      )}
    </div>
  );
}
