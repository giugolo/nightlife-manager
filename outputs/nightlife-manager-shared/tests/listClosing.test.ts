import { describe, it, expect } from 'vitest';

/**
 * Pure list-closing / countdown logic.
 *
 * This mirrors the algorithm currently embedded inside
 * components/PublicListPage.tsx (lines ~52-98). It is duplicated here as a
 * pure function because the source logic lives inside a React effect and is
 * not exported.
 *
 * TODO(team-lead): extract these into services/listClosing.ts and have both
 * PublicListPage.tsx and this test import from there, so the test guards the
 * real implementation instead of a copy.
 */

const DEFAULT_CLOSING_HOURS = 6;

/** Deadline = event date minus listClosingHours (default 6h). */
export function computeClosingDeadline(eventDate: Date, listClosingHours?: number): Date {
  const closingHours = listClosingHours ?? DEFAULT_CLOSING_HOURS;
  return new Date(eventDate.getTime() - closingHours * 60 * 60 * 1000);
}

/** True when registrations are closed at `now`. */
export function isListClosed(now: Date, deadline: Date): boolean {
  return now.getTime() >= deadline.getTime();
}

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** Breaks a remaining millisecond diff into d/h/m/s. Returns null if <= 0. */
export function breakdownCountdown(now: Date, deadline: Date): Countdown | null {
  const diff = deadline.getTime() - now.getTime();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

describe('computeClosingDeadline', () => {
  it('subtracts the default 6 hours when listClosingHours is undefined', () => {
    const eventDate = new Date('2026-07-01T23:00:00Z');
    const deadline = computeClosingDeadline(eventDate);
    expect(deadline.toISOString()).toBe('2026-07-01T17:00:00.000Z');
  });

  it('subtracts a custom number of hours', () => {
    const eventDate = new Date('2026-07-01T23:00:00Z');
    const deadline = computeClosingDeadline(eventDate, 2);
    expect(deadline.toISOString()).toBe('2026-07-01T21:00:00.000Z');
  });

  it('treats 0 closing hours as exactly the event time (not the default)', () => {
    const eventDate = new Date('2026-07-01T23:00:00Z');
    const deadline = computeClosingDeadline(eventDate, 0);
    expect(deadline.toISOString()).toBe('2026-07-01T23:00:00.000Z');
  });
});

describe('isListClosed', () => {
  const deadline = new Date('2026-07-01T17:00:00Z');

  it('is open before the deadline', () => {
    expect(isListClosed(new Date('2026-07-01T16:59:59Z'), deadline)).toBe(false);
  });

  it('is closed exactly at the deadline', () => {
    expect(isListClosed(new Date('2026-07-01T17:00:00Z'), deadline)).toBe(true);
  });

  it('is closed after the deadline', () => {
    expect(isListClosed(new Date('2026-07-01T18:00:00Z'), deadline)).toBe(true);
  });
});

describe('breakdownCountdown', () => {
  it('returns null when the deadline has passed', () => {
    const now = new Date('2026-07-02T00:00:00Z');
    const deadline = new Date('2026-07-01T17:00:00Z');
    expect(breakdownCountdown(now, deadline)).toBeNull();
  });

  it('returns null exactly at the deadline (diff === 0)', () => {
    const t = new Date('2026-07-01T17:00:00Z');
    expect(breakdownCountdown(t, t)).toBeNull();
  });

  it('breaks down a multi-day remaining interval correctly', () => {
    const now = new Date('2026-06-29T16:00:00Z');
    const deadline = new Date('2026-07-01T17:30:45Z');
    expect(breakdownCountdown(now, deadline)).toEqual({
      days: 2,
      hours: 1,
      minutes: 30,
      seconds: 45,
    });
  });

  it('breaks down a sub-hour remaining interval correctly', () => {
    const now = new Date('2026-07-01T16:00:00Z');
    const deadline = new Date('2026-07-01T16:05:10Z');
    expect(breakdownCountdown(now, deadline)).toEqual({
      days: 0,
      hours: 0,
      minutes: 5,
      seconds: 10,
    });
  });
});
