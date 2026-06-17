import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useFocusTrap, useScrollLock } from '../../hooks';

type ModalSize = 'sm' | 'md' | 'lg';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  /** Hide the default header close button. */
  hideClose?: boolean;
  /** Prevent closing on backdrop click / Escape (e.g. blocking onboarding step). */
  dismissible?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  hideClose = false,
  dismissible = true,
}: ModalProps) {
  const labelId = useId();
  const descId = useId();
  const trapRef = useFocusTrap<HTMLDivElement>(open);
  useScrollLock(open);

  useEffect(() => {
    if (!open || !dismissible) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, dismissible, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          {/* Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[var(--color-scrim)] backdrop-blur-md"
            onClick={dismissible ? onClose : undefined}
          />

          {/* Dialog */}
          <motion.div
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? labelId : undefined}
            aria-describedby={description ? descId : undefined}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className={cn(
              'glass-deep relative w-full max-h-[85vh] flex flex-col overflow-hidden rounded-3xl',
              sizeClasses[size],
            )}
          >
            {(title || !hideClose) && (
              <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-[var(--color-border)]">
                <div className="min-w-0">
                  {title && (
                    <h2 id={labelId} className="text-base font-semibold text-[var(--color-text-primary)]">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id={descId} className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                      {description}
                    </p>
                  )}
                </div>
                {!hideClose && (
                  <button
                    onClick={onClose}
                    aria-label="Cerrar"
                    className="flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto">{children}</div>

            {footer && (
              <div className="px-6 py-4 border-t border-[var(--color-border)] flex items-center justify-end gap-2">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
