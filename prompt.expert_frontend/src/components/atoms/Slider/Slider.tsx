interface SliderProps {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

const levelLabels: Record<number, string> = {
  1: 'Básico', 2: 'Básico', 3: 'Básico',
  4: 'Intermedio', 5: 'Intermedio', 6: 'Intermedio', 7: 'Intermedio',
  8: 'Avanzado', 9: 'Avanzado', 10: 'Avanzado',
};

export function Slider({ id, value, onChange, min = 1, max = 10, disabled }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const label = levelLabels[value];

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
        <span>Nivel</span>
        <span className="font-semibold text-[var(--color-text-primary)]">
          {value} / {max} — {label}
        </span>
      </div>

      <div className="relative h-5 flex items-center">
        {/* Track */}
        <div className="absolute inset-x-0 h-2 rounded-full bg-[var(--color-surface-4)]">
          {/* Fill */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[var(--color-aurora-2)] transition-all duration-150"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Native range input (interaction layer) — peer drives the thumb focus ring */}
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          value={value}
          disabled={disabled}
          aria-valuetext={`${value} de ${max}, nivel ${label}`}
          onChange={(e) => onChange(Number(e.target.value))}
          className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed m-0"
        />

        {/* Visible thumb */}
        <span
          aria-hidden="true"
          className="absolute h-4 w-4 -translate-x-1/2 rounded-full bg-[var(--color-text-primary)] border-2 border-[var(--color-surface-1)] shadow transition-[left] duration-150
            peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--focus-ring)] peer-focus-visible:ring-offset-0"
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );
}
