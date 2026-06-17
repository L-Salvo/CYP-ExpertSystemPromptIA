import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({ label, error, options, placeholder, className = '', id: idProp, ...rest }: SelectProps) {
  const generatedId = useId();
  const selectId = idProp ?? generatedId;
  const errorId = error ? `${selectId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-xs font-medium text-[var(--color-text-secondary)]">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className={cn(
            'w-full h-10 pl-3.5 pr-9 rounded-xl bg-[var(--color-surface-2)] border text-sm text-[var(--color-text-primary)]',
            'outline-none transition-colors duration-150 appearance-none cursor-pointer',
            'focus:border-[var(--color-aurora-2)]/50 disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-[var(--color-error)]/60' : 'border-[var(--color-border)]',
            className,
          )}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={15}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
        />
      </div>
      {error && (
        <p id={errorId} className="text-xs text-[var(--color-error)]">
          {error}
        </p>
      )}
    </div>
  );
}
