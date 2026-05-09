import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function DialogSurface({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn('rounded-2xl border border-border bg-sidebar-bg shadow-2xl', className)}
      {...props}
    >
      {children}
    </div>
  );
}
