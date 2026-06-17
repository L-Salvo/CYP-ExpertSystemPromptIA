import { cn } from '../../shared/lib/cn';

interface OnboardingProgressProps {
  steps: string[];
  current: number; // 0-based
}

export function OnboardingProgress({ steps, current }: OnboardingProgressProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-300',
              i <= current ? 'bg-[var(--color-aurora-2)]' : 'bg-[var(--color-surface-3)]',
            )}
          />
        ))}
      </div>
      <p className="text-xs text-[var(--color-text-muted)]">
        Paso {current + 1} de {steps.length} · {steps[current]}
      </p>
    </div>
  );
}
