import { cn } from '../../lib/utils';
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

interface FieldWrapperProps {
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  required?: boolean;
}

export function FieldWrapper({ label, error, hint, children, className, required }: FieldWrapperProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-xs font-semibold text-content-dim">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-content-faint">{hint}</p>}
    </div>
  );
}

const fieldClass = 'w-full bg-surface-elev border border-border rounded-md px-3 py-2.5 text-[13.5px] text-content outline-none transition-colors placeholder:text-content-faint focus:border-brand';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, required, ...props }, ref) => (
    <FieldWrapper label={label} error={error} hint={hint} required={required}>
      <input ref={ref} className={cn(fieldClass, error && 'border-red-500', className)} {...props} />
    </FieldWrapper>
  )
);
Input.displayName = 'Input';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, children, className, required, ...props }, ref) => (
    <FieldWrapper label={label} error={error} hint={hint} required={required}>
      <select ref={ref} className={cn(fieldClass, 'cursor-pointer', error && 'border-red-500', className)} {...props}>
        {children}
      </select>
    </FieldWrapper>
  )
);
Select.displayName = 'Select';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, required, ...props }, ref) => (
    <FieldWrapper label={label} error={error} hint={hint} required={required}>
      <textarea ref={ref} className={cn(fieldClass, 'resize-y min-h-[80px]', error && 'border-red-500', className)} {...props} />
    </FieldWrapper>
  )
);
Textarea.displayName = 'Textarea';
