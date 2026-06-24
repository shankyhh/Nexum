import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' };

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 py-12 overflow-auto"
      style={{ background: 'rgba(4,6,12,0.6)', backdropFilter: 'blur(3px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={cn('w-full bg-surface-panel border border-border rounded-xl shadow-card animate-fade-in', sizes[size])}>
        {/* Header */}
        {title && (
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <div className="flex-1">
              <div className="font-semibold text-content">{title}</div>
              {subtitle && <div className="text-xs text-content-faint mt-0.5">{subtitle}</div>}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-md text-content-dim hover:text-content hover:bg-surface-elev transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-5 py-5 max-h-[65vh] overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
