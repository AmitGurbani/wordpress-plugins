/**
 * Registers a WordPress shortcode.
 * The decorated method becomes the shortcode render callback.
 */
export function Shortcode(tag: string): (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void {
  return function (_target, _propertyKey, _descriptor) {
    // No-op at runtime — metadata is extracted at compile time by the transpiler.
  };
}
