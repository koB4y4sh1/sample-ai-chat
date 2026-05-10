import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Step } from './types';

export function StepContainer({ children }: { children: ReactNode }) {
  return (
    <div data-testid="select-steps" className="flex">
      <div className="relative max-w-full w-[600px] rounded-xl border border-gray-200/80 bg-gradient-to-br from-white via-gray-50 to-white p-6 text-gray-800 shadow-lg backdrop-blur-sm dark:border-slate-700/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:text-white dark:shadow-2xl">
        {children}
      </div>
    </div>
  );
}

export function StepHeader({
  enabledCount,
  totalCount,
  status,
  showStatus = false,
}: {
  enabledCount: number;
  totalCount: number;
  status?: string;
  showStatus?: boolean;
}) {
  return (
    <div className="mb-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-xl font-bold text-transparent">
          Select Steps
        </h2>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500 dark:text-slate-400">
            {enabledCount}/{totalCount} Selected
          </div>
          {showStatus ? (
            <div
              className={`rounded-full border px-2 py-1 text-xs font-medium ${
                status === 'executing'
                  ? 'border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/30 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              {status === 'executing' ? 'Ready' : 'Waiting'}
            </div>
          ) : null}
        </div>
      </div>

      <div className="relative h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
        <div
          className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
          style={{ width: `${totalCount > 0 ? (enabledCount / totalCount) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
}

export function StepItem({
  step,
  status,
  onToggle,
  disabled = false,
}: {
  step: Step;
  status?: string;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-center rounded-lg p-3 transition-all duration-300 ${
        step.status === 'enabled'
          ? 'border border-blue-200/60 bg-gradient-to-r from-blue-50 to-purple-50 dark:border-blue-500/30 dark:from-blue-900/20 dark:to-purple-900/10'
          : 'border border-gray-200/40 bg-gray-50/50 dark:border-slate-600/30 dark:bg-slate-800/30'
      }`}
    >
      <label data-testid="step-item" className="flex w-full cursor-pointer items-center">
        <div className="relative">
          <input
            type="checkbox"
            checked={step.status === 'enabled'}
            onChange={onToggle}
            className="sr-only"
            disabled={disabled}
          />
          <div
            className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all duration-200 ${
              step.status === 'enabled'
                ? 'border-blue-500 bg-gradient-to-br from-blue-500 to-purple-600'
                : 'border-gray-300 bg-white dark:border-slate-400 dark:bg-slate-700'
            } ${disabled ? 'opacity-60' : ''}`}
          >
            {step.status === 'enabled' ? (
              <Check className="h-3 w-3 text-white" aria-hidden strokeWidth={3} />
            ) : null}
          </div>
        </div>
        <span
          data-testid="step-text"
          className={`ml-3 font-medium transition-all duration-300 ${
            step.status !== 'enabled' && status !== 'inProgress'
              ? 'text-gray-400 line-through dark:text-slate-500'
              : 'text-gray-800 dark:text-white'
          } ${disabled ? 'opacity-60' : ''}`}
        >
          {step.description}
        </span>
      </label>
    </div>
  );
}

export function ActionButton({
  variant,
  disabled,
  onClick,
  children,
}: {
  variant: 'primary' | 'secondary' | 'success' | 'danger';
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const baseClasses = 'px-6 py-3 rounded-lg font-semibold transition-all duration-200';
  const enabledClasses = 'hover:scale-105 shadow-md hover:shadow-lg';
  const disabledClasses = 'opacity-50 cursor-not-allowed';

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white shadow-lg hover:shadow-xl',
    secondary:
      'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 hover:border-gray-400 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white dark:border-slate-600 dark:hover:border-slate-500',
    success:
      'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl',
    danger:
      'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl',
  };

  return (
    <button
      type="button"
      className={`${baseClasses} ${disabled ? disabledClasses : enabledClasses} ${
        disabled && variant === 'secondary'
          ? 'bg-gray-200 text-gray-500'
          : disabled && variant === 'success'
            ? 'bg-gray-400'
            : variantClasses[variant]
      }`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function DecorativeElements({
  variant = 'default',
}: {
  variant?: 'default' | 'success' | 'danger';
}) {
  return (
    <>
      <div
        className={`absolute top-3 right-3 h-16 w-16 rounded-full blur-xl ${
          variant === 'success'
            ? 'bg-gradient-to-br from-green-200/30 to-emerald-200/30 dark:from-green-500/10 dark:to-emerald-500/10'
            : variant === 'danger'
              ? 'bg-gradient-to-br from-red-200/30 to-pink-200/30 dark:from-red-500/10 dark:to-pink-500/10'
              : 'bg-gradient-to-br from-blue-200/30 to-purple-200/30 dark:from-blue-500/10 dark:to-purple-500/10'
        }`}
      />
      <div
        className={`absolute bottom-3 left-3 h-12 w-12 rounded-full blur-xl ${
          variant === 'default'
            ? 'bg-gradient-to-br from-purple-200/30 to-pink-200/30 dark:from-purple-500/10 dark:to-pink-500/10'
            : 'opacity-50'
        }`}
      />
    </>
  );
}
