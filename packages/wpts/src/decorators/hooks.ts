export interface HookOptions {
  priority?: number;
  acceptedArgs?: number;
}

/**
 * Registers a WordPress action hook.
 * The decorated method becomes the callback for the hook.
 */
export function Action(hookName: string, options?: HookOptions): (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void {
  return function (_target, _propertyKey, _descriptor) {
    // No-op at runtime — metadata is extracted at compile time by the transpiler.
  };
}

/**
 * Registers a WordPress filter hook.
 * The decorated method becomes the callback for the filter.
 */
export function Filter(hookName: string, options?: HookOptions): (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void {
  return function (_target, _propertyKey, _descriptor) {
    // No-op at runtime — metadata is extracted at compile time by the transpiler.
  };
}
