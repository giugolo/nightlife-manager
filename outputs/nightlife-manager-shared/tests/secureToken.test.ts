import { describe, it, expect } from 'vitest';
import { generateSecureToken } from '../services/token';

const TOKEN_CHARSET = /^[A-Za-z0-9]+$/;

describe('generateSecureToken', () => {
  it('defaults to a length of 24', () => {
    expect(generateSecureToken()).toHaveLength(24);
  });

  it('honours a custom length', () => {
    expect(generateSecureToken(16)).toHaveLength(16);
    expect(generateSecureToken(8)).toHaveLength(8);
  });

  it('only uses alphanumeric characters', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateSecureToken(32)).toMatch(TOKEN_CHARSET);
    }
  });

  it('produces unique values across many calls (no obvious collisions)', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      seen.add(generateSecureToken(24));
    }
    expect(seen.size).toBe(1000);
  });
});
