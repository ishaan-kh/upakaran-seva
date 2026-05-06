import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
  children: ReactNode;
}

const sizeClass: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ open, onClose, title, subtitle, size = 'md', footer, children }: ModalProps) {
  // Prevent body scroll while open + Esc to close
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{ background: 'rgba(31, 22, 17, 0.45)' }}
      onClick={onClose}
    >
      <div
        className={`w-full ${sizeClass[size]} bg-white rounded-2xl overflow-hidden a-fi flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || subtitle) && (
          <header className="px-5 py-4 border-b border-[var(--b)] flex items-start justify-between gap-3">
            <div>
              {title && <h2 className="fd text-lg font-medium tracking-tight">{title}</h2>}
              {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--tm)' }}>{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full grid place-items-center hover:bg-[var(--s2)]"
              style={{ color: 'var(--tm)' }}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </header>
        )}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
        {footer && <footer className="px-5 py-3 border-t border-[var(--b)] flex justify-end gap-2">{footer}</footer>}
      </div>
    </div>
  );
}
