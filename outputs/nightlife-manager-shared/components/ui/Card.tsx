import React from 'react';
import { cn } from './cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Padding preset. Default 'md' (p-6). */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Add a brand glow + accent ring (for highlighted/primary surfaces). */
  glow?: boolean;
}

const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

/** Surface container: layered dark panel with a hairline ring and depth. */
const Card: React.FC<CardProps> = ({ padding = 'md', glow = false, className, children, ...props }) => (
  <div
    className={cn(
      'rounded-2xl bg-ink-900 ring-1 ring-white/10 shadow-2xl shadow-black/40',
      glow && 'ring-brand-500/30 shadow-glow',
      PADDING[padding],
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

export default Card;
