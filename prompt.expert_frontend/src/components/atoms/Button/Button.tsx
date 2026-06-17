import React from 'react';

type Variant = 'primary' | 'ghost' | 'danger' | 'glass';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-white text-black font-semibold hover:bg-white/90 active:scale-95',
  ghost:
    'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] active:scale-95',
  danger:
    'bg-transparent text-[var(--color-error)] hover:bg-[var(--color-error)]/12 active:scale-95',
  glass:
    'glass text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] active:scale-95',
};

const sizeStyles: Record<Size, string> = {
  sm: 'h-7 px-3 text-xs rounded-md',
  md: 'h-9 px-4 text-sm rounded-lg',
  lg: 'h-11 px-6 text-base rounded-xl',
  icon: 'h-9 w-9 rounded-lg flex items-center justify-center',
};

export function Button({
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 transition-all duration-150 font-medium cursor-pointer border-0 outline-none disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none';

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}
