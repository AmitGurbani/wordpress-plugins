export interface DiagnosticsRouteOptions {
  /** Option key suffix for the last-error option (default: 'last_error'). */
  errorOptionSuffix?: string;
}

/**
 * Marks a class as providing diagnostics routes.
 * Auto-generates a GET /diagnostics/last-error endpoint.
 */
export function DiagnosticsRoute(_options?: DiagnosticsRouteOptions): (...args: any[]) => any {
  return (..._args: any[]) => {
    // No-op at runtime — metadata is extracted at compile time by the transpiler.
  };
}
