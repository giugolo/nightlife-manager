import React from 'react';
import { cn } from './cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const BASE =
  'w-full bg-ink-950/60 border rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none transition-all resize-y';

/** Multi-line text input styled to match Input/Select. */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const areaId = id ?? props.name;
    return (
      <div>
        {label && (
          <label htmlFor={areaId} className="block text-sm font-medium text-slate-400 mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={areaId}
          className={cn(BASE, error ? 'border-red-500/50' : 'border-white/10', className)}
          {...props}
        />
        {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

export default Textarea;
