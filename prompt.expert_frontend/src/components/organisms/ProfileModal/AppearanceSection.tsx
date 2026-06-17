import { Sun, Moon } from 'lucide-react';
import { cn } from '../../../shared/lib/cn';
import { useUIStore } from '../../../store/ui.store';

type ThemeChoice = 'light' | 'dark';

const OPTIONS: { value: ThemeChoice; label: string; icon: typeof Sun; swatch: string }[] = [
  { value: 'light', label: 'Claro', icon: Sun, swatch: 'bg-[#eceff4]' },
  { value: 'dark', label: 'Oscuro', icon: Moon, swatch: 'bg-[#080808]' },
];

export function AppearanceSection() {
  const { theme, toggleTheme } = useUIStore();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Tema</h3>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Elegí cómo se ve la aplicación.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const selected = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                if (!selected) toggleTheme();
              }}
              aria-pressed={selected}
              className={cn(
                'flex flex-col gap-3 rounded-xl border p-4 transition-all duration-150 text-left',
                selected
                  ? 'border-[var(--color-aurora-2)]/60 bg-[var(--color-aurora-2)]/8'
                  : 'border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-border-hover)]',
              )}
            >
              <div className={cn('h-16 rounded-lg border border-[var(--color-border)]', opt.swatch)} />
              <div className="flex items-center gap-2">
                <Icon size={15} className="text-[var(--color-text-secondary)]" />
                <span className="text-sm font-medium text-[var(--color-text-primary)]">{opt.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
