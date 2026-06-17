import { motion } from 'framer-motion';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };

export function Spinner({ size = 'md', label }: SpinnerProps) {
  return (
    <div className="flex items-center gap-3">
      <motion.span
        className={`block rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-text-primary)] ${sizes[size]}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
      />
      {label && (
        <span className="text-sm text-[var(--color-text-secondary)] animate-pulse">{label}</span>
      )}
    </div>
  );
}
