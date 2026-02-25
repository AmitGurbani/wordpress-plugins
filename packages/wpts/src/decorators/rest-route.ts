export interface RestRouteOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  capability?: string;
  public?: boolean;
}

/**
 * Registers a custom WordPress REST API route.
 * The decorated method becomes the route callback, transpiled to PHP.
 */
export function RestRoute(route: string, options: RestRouteOptions): (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void {
  return function (_target, _propertyKey, _descriptor) {
    // No-op at runtime — metadata is extracted at compile time by the transpiler.
  };
}
