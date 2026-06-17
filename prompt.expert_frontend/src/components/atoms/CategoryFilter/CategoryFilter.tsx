interface CategoryFilterProps {
  categories: string[];
  active: string | undefined;
  onChange: (category: string | undefined) => void;
  className?: string;
}

export function CategoryFilter({ categories, active, onChange, className = '' }: CategoryFilterProps) {
  return (
    <div className={`flex items-center gap-1.5 overflow-x-auto pb-1 ${className}`}>
      <Pill label="Todas" selected={active === undefined} onClick={() => onChange(undefined)} />
      {categories.map((category) => (
        <Pill
          key={category}
          label={category.toLowerCase().replace('_', ' ')}
          selected={active === category}
          onClick={() => onChange(category)}
        />
      ))}
    </div>
  );
}

function Pill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors duration-150 border
        ${selected
          ? 'bg-[var(--color-aurora-1)]/15 border-[var(--color-aurora-1)]/40 text-[var(--color-aurora-1)]'
          : 'bg-transparent border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]'
        }`}
    >
      {label}
    </button>
  );
}
