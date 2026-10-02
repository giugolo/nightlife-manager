import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from './cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Optional leading icon (lucide-react component). */
  icon?: LucideIcon;
  /** Error message shown below the field; also reddens the border. */
  error?: string;
}

const BASE =
  'w-full bg-ink-950/60 border rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none transition-all';

/** Text input with optional label, leading icon and error state. */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon: Icon, error, className, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-400 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && <Icon className="absolute left-3 top-3 h-5 w-5 text-slate-500 pointer-events-none" />}
          <input
            ref={ref}
            id={inputId}
            className={cn(BASE, Icon && 'pl-10', error ? 'border-red-500/50' : 'border-white/10', className)}
            {...props}
          />
        </div>
        {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';

export default Input;
