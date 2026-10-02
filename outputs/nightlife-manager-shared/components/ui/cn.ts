// Tiny class-name joiner: drops falsy values so conditional classes read cleanly.
// (No dependency on clsx/tailwind-merge to keep the bundle lean.)
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
