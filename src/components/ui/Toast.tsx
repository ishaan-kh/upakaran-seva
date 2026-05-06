import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Check, AlertCircle, Info, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  variant: ToastVariant;
  message: string;
}

interface ToastContextValue {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastIdCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((variant: ToastVariant, message: string) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, variant, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismiss = useCallback(
    (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)),
    []
  );

  const value: ToastContextValue = {
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
        {toasts.map((t) => {
          const styles = stylesFor(t.variant);
          return (
            <div
              key={t.id}
              className="px-4 py-3 rounded-lg shadow-lg flex items-start gap-2.5 a-fi"
              style={{ background: styles.bg, color: styles.color, border: `1px solid ${styles.border}` }}
            >
              {styles.icon}
              <span className="text-sm flex-1">{t.message}</span>
              <button onClick={() => dismiss(t.id)} className="opacity-60 hover:opacity-100" aria-label="Dismiss">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

function stylesFor(variant: ToastVariant) {
  if (variant === 'success') {
    return {
      bg: 'var(--scs)', color: 'var(--sci)', border: 'var(--sc)',
      icon: <Check size={16} />,
    };
  }
  if (variant === 'error') {
    return {
      bg: 'var(--ds)', color: 'var(--di)', border: 'var(--d)',
      icon: <AlertCircle size={16} />,
    };
  }
  return {
    bg: 'var(--ins)', color: 'var(--ini)', border: 'var(--in)',
    icon: <Info size={16} />,
  };
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
