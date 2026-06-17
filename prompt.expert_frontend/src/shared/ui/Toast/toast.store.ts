import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
  /** ms before auto-dismiss; 0 = sticky */
  duration: number;
}

interface ToastStore {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, 'id'>) => number;
  dismiss: (id: number) => void;
  clear: () => void;
}

let counter = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = ++counter;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    if (toast.duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, toast.duration);
    }
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

function show(variant: ToastVariant, message: string, duration = 4000) {
  return useToastStore.getState().push({ variant, message, duration });
}

/**
 * Imperative toast API — callable anywhere (inside or outside React),
 * e.g. in react-query onError callbacks.
 *
 *   toast.success('Chat renombrado');
 *   toast.error('No se pudo eliminar');
 */
export const toast = {
  success: (message: string, duration?: number) => show('success', message, duration),
  error: (message: string, duration?: number) => show('error', message, duration),
  info: (message: string, duration?: number) => show('info', message, duration),
  dismiss: (id: number) => useToastStore.getState().dismiss(id),
};
