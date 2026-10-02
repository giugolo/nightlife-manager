import React from 'react';
import { cn } from './cn';

type SpinnerSize = 'sm' | 'md' | 'lg';
type SpinnerTone = 'white' | 'brand';

// Literal classes so Tailwind's content scan keeps them (no dynamic `w-${n}`).
const SIZES: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-8 h-8',
};

const TONES: Record<SpinnerTone, string> = {
  white: 'border-white/30 border-t-white',
  brand: 'border-brand-500/30 border-t-brand-500',
};

interface SpinnerProps {
  size?: SpinnerSize;
  /** 'white' for use on colored buttons, 'brand' for neutral page backgrounds. */
  tone?: SpinnerTone;
  className?: string;
}

/** Indeterminate ring spinner used inside buttons and loading states. */
const Spinner: React.FC<SpinnerProps> = ({ size = 'md', tone = 'white', className }) => (
  <div
    role="status"
    aria-label="Caricamento"
    className={cn(SIZES[size], TONES[tone], 'border-2 rounded-full animate-spin', className)}
  />
);

export default Spinner;
