// Cryptographically secure token generation (no Firebase dependency, so it is
// trivially unit-testable). Uses crypto.getRandomValues() instead of
// Math.random(): 24 alphanumeric chars = 62^24 combinations (practically unguessable).

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export const generateSecureToken = (length: number = 24): string => {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => CHARS[byte % CHARS.length]).join('');
};

// Secure public token for lists (24 characters).
export const generatePublicToken = (): string => generateSecureToken(24);
