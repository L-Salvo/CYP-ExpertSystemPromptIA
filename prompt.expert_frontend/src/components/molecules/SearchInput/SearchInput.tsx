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
        className="absolute left-3 text-white/30 pointer-events-none"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/05 border border-white/08 rounded-xl py-2 pl-8 pr-3 text-sm text-white/70
          placeholder:text-white/25 outline-none focus:border-white/20 focus:bg-white/08 transition-all duration-150"
      />
    </div>
  );
}
