import { Sparkles } from 'lucide-react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-surface-0)]">
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Brand */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl glow-neon-accent flex items-center justify-center">
            <Sparkles size={24} className="text-[var(--color-aurora-1)]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-text-primary)] tracking-tight">{title}</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">{subtitle}</p>
          </div>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-6">{children}</div>

        {footer && <div className="text-center text-sm text-[var(--color-text-secondary)]">{footer}</div>}
      </div>
    </div>
  );
}
