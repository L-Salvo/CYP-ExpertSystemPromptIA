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

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between text-xs text-white/50">
        <span>Nivel</span>
        <span className="font-semibold text-white/80">
          {value} / {max} — {levelLabels[value]}
        </span>
      </div>
      <div className="relative h-2 w-full rounded-full bg-white/08">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-white/70 transition-all duration-150"
          style={{ width: `${pct}%` }}
        />
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full appearance-none cursor-pointer bg-transparent h-2 opacity-0 absolute"
        style={{ top: '-8px', position: 'relative' }}
      />
    </div>
  );
}
