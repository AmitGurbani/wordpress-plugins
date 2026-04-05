export interface HookOptions {
  priority?: number;
  acceptedArgs?: number;
}

/**
 * Registers a WordPress action hook.
 * The decorated method becomes the callback for the hook.
 */
export function Action(_hookName: string, _options?: HookOptions): (...args: any[]) => any {
  return (..._args: any[]) => {
    // No-op at runtime — metadata is extracted at compile time by the transpiler.
  };
}

/**
 * Registers a WordPress filter hook.
 * The decorated method becomes the callback for the filter.
 */
export function Filter(_hookName: string, _options?: HookOptions): (...args: any[]) => any {
  return (..._args: any[]) => {
    // No-op at runtime — metadata is extracted at compile time by the transpiler.
  };
}
