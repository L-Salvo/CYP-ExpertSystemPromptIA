import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Buscar chat...' }: SearchInputProps) {
  return (
    <div className="relative flex items-center">
      <Search
        size={13}
        className="absolute left-3 text-[var(--color-text-muted)] pointer-events-none"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl py-2 pl-8 pr-3 text-sm text-[var(--color-text-primary)]
          placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-border-hover)] focus:bg-[var(--color-surface-3)] transition-all duration-150"
      />
    </div>
  );
}
