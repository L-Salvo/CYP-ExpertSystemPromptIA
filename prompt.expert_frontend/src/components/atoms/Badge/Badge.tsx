import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'inference' | 'success' | 'warning' | 'error';
  className?: string;
}

const variantStyles: Record<string, string> = {
  default:
    'bg-[var(--color-surface-3)] text-[var(--color-text-secondary)] border border-[var(--color-border)]',
  inference:
    'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border border-[var(--color-border)] font-mono text-xs',
  success:
    'bg-green-500/12 text-green-300 border border-green-500/20',
  warning:
    'bg-yellow-500/12 text-yellow-300 border border-yellow-500/20',
  error:
    'bg-red-500/12 text-red-300 border border-red-500/20',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
