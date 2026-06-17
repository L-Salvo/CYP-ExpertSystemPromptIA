/**
 * cn — class name composer.
 * Dependency-free helper to conditionally join Tailwind/utility classes.
 * Accepts strings, falsy values (skipped) and { [class]: boolean } maps.
 *
 *   cn('px-2', isActive && 'bg-accent', { 'opacity-50': disabled })
 */
export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | Record<string, boolean | null | undefined>;

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === 'string' || typeof input === 'number') {
      out.push(String(input));
    } else if (typeof input === 'object') {
      for (const key in input) {
        if (input[key]) out.push(key);
      }
    }
  }
  return out.join(' ');
}
