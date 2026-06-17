import React, { useId } from 'react';
import { cn } from '../../lib/cn';

interface FieldBaseProps {
  label?: string;
  error?: string;
  hint?: string;
  /** Right-aligned slot (e.g. icon, char counter). */
  trailing?: React.ReactNode;
}

const fieldShell =
  'w-full bg-[var(--color-surface-2)] border rounded-xl text-sm text-[var(--color-text-primary)] ' +
  'placeholder:text-[var(--color-text-muted)] outline-none transition-colors duration-150 ' +
  'focus:border-[var(--color-aurora-2)]/50 disabled:opacity-50 disabled:cursor-not-allowed';

function useFieldIds(error?: string) {
  const id = useId();
  return { id, errorId: error ? `${id}-error` : undefined };
}

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & FieldBaseProps;

export function Input({ label, error, hint, trailing, className = '', id: idProp, ...rest }: InputProps) {
  const { id, errorId } = useFieldIds(error);
  const inputId = idProp ?? id;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-[var(--color-text-secondary)]">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className={cn(
            fieldShell,
            'h-10 px-3.5',
            trailing ? 'pr-10' : '',
            error ? 'border-[var(--color-error)]/60' : 'border-[var(--color-border)]',
            className,
          )}
          {...rest}
        />
        {trailing && (
          <span className="absolute right-3 text-[var(--color-text-muted)] pointer-events-none">{trailing}</span>
        )}
      </div>
      {error ? (
        <p id={errorId} className="text-xs text-[var(--color-error)]">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-[var(--color-text-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & FieldBaseProps;

export function Textarea({ label, error, hint, className = '', id: idProp, ...rest }: TextareaProps) {
  const { id, errorId } = useFieldIds(error);
  const inputId = idProp ?? id;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-[var(--color-text-secondary)]">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={errorId}
        className={cn(
          fieldShell,
          'px-3.5 py-2.5 resize-none leading-relaxed',
          error ? 'border-[var(--color-error)]/60' : 'border-[var(--color-border)]',
          className,
        )}
        {...rest}
      />
      {error ? (
        <p id={errorId} className="text-xs text-[var(--color-error)]">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-[var(--color-text-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}
