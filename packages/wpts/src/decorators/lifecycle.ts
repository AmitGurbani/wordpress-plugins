/**
 * Marks a method to run on plugin activation.
 * Maps to `register_activation_hook()`.
 */
export function Activate(): (...args: any[]) => any {
  return (..._args: any[]) => {
    // No-op at runtime — metadata is extracted at compile time by the transpiler.
  };
}

/**
 * Marks a method to run on plugin deactivation.
 * Maps to `register_deactivation_hook()`.
 */
export function Deactivate(): (...args: any[]) => any {
  return (..._args: any[]) => {
    // No-op at runtime — metadata is extracted at compile time by the transpiler.
  };
}
