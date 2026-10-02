import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from './cn';

const MAX_WIDTH = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Hide the default close (×) button in the header. */
  hideClose?: boolean;
  size?: keyof typeof MAX_WIDTH;
  children: React.ReactNode;
  /** Optional footer area (e.g. action buttons). */
  footer?: React.ReactNode;
  className?: string;
}

/** Centered dialog with backdrop, Escape-to-close and a scrollable body. */
const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  hideClose = false,
  size = 'md',
  children,
  footer,
  className,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'w-full bg-ink-900 ring-1 ring-white/10 rounded-2xl shadow-2xl shadow-black/60 animate-in',
          'max-h-[90vh] overflow-y-auto modal-mobile-full',
          MAX_WIDTH[size],
          className,
        )}
      >
        {(title || !hideClose) && (
          <div className="flex items-center justify-between p-6 pb-4">
            {title && <h2 className="text-xl font-bold text-white">{title}</h2>}
            {!hideClose && (
              <button
                onClick={onClose}
                aria-label="Chiudi"
                className="ml-auto text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className="px-6 pb-6">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-white/10">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
