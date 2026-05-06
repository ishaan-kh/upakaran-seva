import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface CardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  padded?: boolean;
  children: ReactNode;
  className?: string;
}

export function Card({ title, subtitle, action, padded = true, children, className = '' }: CardProps) {
  return (
    <section
      className={`bg-white border border-[var(--b)] rounded-xl overflow-hidden ${className}`}
    >
      {(title || action) && (
        <header className="px-5 py-3 border-b border-[var(--b)] flex items-center justify-between gap-3">
          <div>
            {title && <h2 className="fd text-base font-medium tracking-tight">{title}</h2>}
            {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--tm)' }}>{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </header>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-6">
      <div
        className="w-12 h-12 rounded-full grid place-items-center mx-auto mb-3"
        style={{ background: 'var(--s2)', color: 'var(--ts)' }}
      >
        <Icon size={20} />
      </div>
      <h3 className="fd text-base font-medium mb-1">{title}</h3>
      {message && (
        <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--tm)' }}>
          {message}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
