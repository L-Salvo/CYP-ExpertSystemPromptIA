import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'inference' | 'success' | 'warning' | 'error';
  className?: string;
}

const variantStyles: Record<string, string> = {
  default:
    'bg-white/08 text-white/70 border border-white/10',
  inference:
    'bg-white/06 text-white/60 border border-white/08 font-mono text-xs',
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
