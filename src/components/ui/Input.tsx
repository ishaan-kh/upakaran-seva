import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface FieldWrapProps {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

function FieldWrap({ label, required, error, hint, children }: FieldWrapProps) {
  return (
    <div>
      {label && (
        <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--tm)' }}>
          {label} {required && <span style={{ color: 'var(--d)' }}>*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-[11px] mt-1" style={{ color: 'var(--tm)' }}>{hint}</p>}
      {error && <p className="text-[11px] mt-1" style={{ color: 'var(--d)' }}>{error}</p>}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, required, className = '', ...rest },
  ref
) {
  return (
    <FieldWrap label={label} required={required} error={error} hint={hint}>
      <input
        ref={ref}
        required={required}
        className={`w-full px-3 py-2 rounded-lg border text-sm ${className}`}
        style={{ borderColor: error ? 'var(--d)' : 'var(--b)' }}
        {...rest}
      />
    </FieldWrap>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, required, className = '', rows = 3, ...rest },
  ref
) {
  return (
    <FieldWrap label={label} required={required} error={error} hint={hint}>
      <textarea
        ref={ref}
        rows={rows}
        required={required}
        className={`w-full px-3 py-2 rounded-lg border text-sm resize-y ${className}`}
        style={{ borderColor: error ? 'var(--d)' : 'var(--b)' }}
        {...rest}
      />
    </FieldWrap>
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, options, placeholder, required, className = '', ...rest },
  ref
) {
  return (
    <FieldWrap label={label} required={required} error={error} hint={hint}>
      <select
        ref={ref}
        required={required}
        className={`w-full px-3 py-2 rounded-lg border text-sm ${className}`}
        style={{ borderColor: error ? 'var(--d)' : 'var(--b)' }}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </FieldWrap>
  );
});
