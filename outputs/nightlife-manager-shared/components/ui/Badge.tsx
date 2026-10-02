import React from 'react';
import { cn } from './cn';

type BadgeVariant = 'purple' | 'blue' | 'green' | 'red' | 'amber' | 'pink' | 'slate';

// Full literal classes per variant so the Tailwind content scan keeps them.
const VARIANTS: Record<BadgeVariant, string> = {
  purple: 'bg-purple-500/20 text-purple-400',
  blue: 'bg-blue-500/20 text-blue-400',
  green: 'bg-green-500/10 text-green-400',
  red: 'bg-red-500/20 text-red-400',
  amber: 'bg-amber-500/20 text-amber-400',
  pink: 'bg-pink-500/20 text-pink-400',
  slate: 'bg-slate-800 text-slate-400',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

/** Small rounded status pill. */
const Badge: React.FC<BadgeProps> = ({ variant = 'slate', className, children, ...props }) => (
  <span
    className={cn('text-xs font-bold px-2.5 py-1 rounded-full', VARIANTS[variant], className)}
    {...props}
  >
    {children}
  </span>
);

export default Badge;
