import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary:   'text-white border',
  secondary: 'border',
  ghost:     'border-transparent',
  danger:    'text-white border',
};

const sizeClass: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
  md: 'h-9 px-3.5 text-sm gap-2 rounded-lg',
  lg: 'h-10 px-4 text-sm gap-2 rounded-lg',
};

const variantStyle: Record<Variant, React.CSSProperties> = {
  primary:   { background: 'var(--p)',       borderColor: 'var(--pd)' },
  secondary: { background: 'var(--surface)', borderColor: 'var(--b)', color: 'var(--t)' },
  ghost:     { background: 'transparent',    color: 'var(--tm)' },
  danger:    { background: 'var(--d)',       borderColor: 'var(--di)' },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', leftIcon, rightIcon, children, className = '', style, disabled, ...rest },
  ref
) {
  const base = 'inline-flex items-center justify-center font-semibold transition-all whitespace-nowrap select-none';
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 active:scale-[0.98]';

  return (
    <button
      ref={ref}
      disabled={disabled}
      className={`${base} ${variantClass[variant]} ${sizeClass[size]} ${disabledClass} ${className}`}
      style={{ ...variantStyle[variant], ...style }}
      {...rest}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
});
