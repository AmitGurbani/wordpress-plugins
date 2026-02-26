/**
 * Registers a WordPress shortcode.
 * The decorated method becomes the shortcode render callback.
 */
export function Shortcode(tag: string): (...args: any[]) => any {
  return function (..._args: any[]) {
    // No-op at runtime — metadata is extracted at compile time by the transpiler.
  };
}
