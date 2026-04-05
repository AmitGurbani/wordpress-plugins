export interface AjaxHandlerOptions {
  public?: boolean;
  capability?: string;
  nonce?: boolean;
}

/**
 * Registers a WordPress AJAX handler (wp_ajax_{action}).
 * The decorated method becomes the AJAX callback, transpiled to PHP.
 * Nonce verification and capability checks are auto-injected.
 */
export function AjaxHandler(
  _action: string,
  _options?: AjaxHandlerOptions,
): (...args: any[]) => any {
  return (..._args: any[]) => {
    // No-op at runtime — metadata is extracted at compile time by the transpiler.
  };
}
