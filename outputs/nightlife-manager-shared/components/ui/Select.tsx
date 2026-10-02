import React from 'react';
import { cn } from './cn';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

const BASE =
  'w-full bg-ink-950/60 border rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none transition-all';

/** Native select styled to match the rest of the form controls. */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, id, children, ...props }, ref) => {
    const selectId = id ?? props.name;
    return (
      <div>
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-slate-400 mb-2">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(BASE, error ? 'border-red-500/50' : 'border-white/10', className)}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
      </div>
    );
  },
);
Select.displayName = 'Select';

export default Select;
