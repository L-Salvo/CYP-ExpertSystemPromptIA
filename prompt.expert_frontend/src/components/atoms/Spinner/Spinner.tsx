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
        className={`block rounded-full border-2 border-white/20 border-t-white/80 ${sizes[size]}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
      />
      {label && (
        <span className="text-sm text-white/50 animate-pulse">{label}</span>
      )}
    </div>
  );
}
