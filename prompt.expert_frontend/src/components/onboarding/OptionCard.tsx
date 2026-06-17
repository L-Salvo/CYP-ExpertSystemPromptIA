import { Check } from 'lucide-react';
import { cn } from '../../shared/lib/cn';

interface OptionCardProps {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export function OptionCard({ selected, onSelect, title, description, icon }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'group relative flex items-center gap-3 w-full text-left rounded-xl border px-4 py-3 transition-all duration-150',
        selected
          ? 'border-[var(--color-aurora-2)]/60 bg-[var(--color-aurora-2)]/8'
          : 'border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-3)]',
      )}
    >
      {icon && <span className="text-[var(--color-text-secondary)] flex-shrink-0">{icon}</span>}
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-[var(--color-text-primary)]">{title}</span>
        {description && (
          <span className="block text-xs text-[var(--color-text-muted)] mt-0.5">{description}</span>
        )}
      </span>
      <span
        className={cn(
          'flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-150',
          selected
            ? 'border-[var(--color-aurora-2)] bg-[var(--color-aurora-2)] text-white'
            : 'border-[var(--color-border-hover)] text-transparent',
        )}
      >
        <Check size={12} strokeWidth={3} />
      </span>
    </button>
  );
}
