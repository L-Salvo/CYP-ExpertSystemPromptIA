import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore, type ToastVariant } from './toast.store';
import { cn } from '../../lib/cn';

const variantConfig: Record<
  ToastVariant,
  { icon: typeof Info; accent: string; ring: string }
> = {
  success: { icon: CheckCircle2, accent: 'text-[var(--color-success)]', ring: 'border-[var(--color-success)]/25' },
  error: { icon: AlertCircle, accent: 'text-[var(--color-error)]', ring: 'border-[var(--color-error)]/25' },
  info: { icon: Info, accent: 'text-[var(--color-aurora-1)]', ring: 'border-[var(--color-aurora-1)]/25' },
};

/**
 * Toaster — global toast stack. Mount once near the app root.
 * Announces messages to assistive tech via aria-live.
 */
export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      role="region"
      aria-label="Notificaciones"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const cfg = variantConfig[t.variant];
          const Icon = cfg.icon;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              role={t.variant === 'error' ? 'alert' : 'status'}
              aria-live={t.variant === 'error' ? 'assertive' : 'polite'}
              className={cn(
                'glass pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 min-w-[260px] max-w-[360px] shadow-lg',
                cfg.ring,
              )}
            >
              <Icon size={16} className={cn('mt-0.5 flex-shrink-0', cfg.accent)} />
              <p className="flex-1 text-sm text-[var(--color-text-primary)] leading-snug">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Cerrar notificación"
                className="flex-shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
