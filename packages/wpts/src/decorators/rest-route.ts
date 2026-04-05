export interface RestRouteOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  capability?: string;
  public?: boolean;
}

/**
 * Registers a custom WordPress REST API route.
 * The decorated method becomes the route callback, transpiled to PHP.
 */
export function RestRoute(_route: string, _options: RestRouteOptions): (...args: any[]) => any {
  return (..._args: any[]) => {
    // No-op at runtime — metadata is extracted at compile time by the transpiler.
  };
}
