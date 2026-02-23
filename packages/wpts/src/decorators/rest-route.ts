export interface RestRouteOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  capability?: string;
}

/**
 * Registers a custom WordPress REST API route.
 * The decorated method becomes the route callback, transpiled to PHP.
 */
export function RestRoute(route: string, options: RestRouteOptions): MethodDecorator {
  return function (_target, _propertyKey, _descriptor) {
    // No-op at runtime — metadata is extracted at compile time by the transpiler.
  };
}
