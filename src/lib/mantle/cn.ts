/** Tiny className joiner (swap for clsx/tailwind-merge if the project already has one). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
