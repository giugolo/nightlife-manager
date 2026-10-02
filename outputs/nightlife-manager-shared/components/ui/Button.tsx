import React from 'react';
import { cn } from './cn';
import Spinner from './Spinner';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  // Apple style: flat system blue, subtle press (no gradient/glow).
  primary:
    'bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700',
  secondary:
    'bg-white/10 hover:bg-white/15 text-white active:bg-white/5',
  danger: 'bg-danger hover:bg-danger-dark text-white',
  ghost: 'bg-transparent hover:bg-white/5 text-brand-400 active:text-brand-500',
};

const SIZES: Record<Size, string> = {
  sm: 'py-2 px-4 text-sm rounded-lg',
  md: 'py-2.5 px-5 rounded-xl',
  lg: 'py-3 px-6 text-lg rounded-2xl',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Stretch to the container width. */
  fullWidth?: boolean;
  /** Show a spinner and disable the button. */
  loading?: boolean;
}

/** Primary action button with variants, sizes and a built-in loading state. */
const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  className,
  children,
  ...props
}) => (
  <button
    disabled={disabled || loading}
    className={cn(
      'font-medium transition-all flex items-center justify-center gap-2',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950',
      VARIANTS[variant],
      SIZES[size],
      fullWidth && 'w-full',
      className,
    )}
    {...props}
  >
    {loading ? <Spinner size={size === 'sm' ? 'sm' : 'md'} /> : children}
  </button>
);

export default Button;
