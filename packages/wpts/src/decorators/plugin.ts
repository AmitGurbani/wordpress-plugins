export interface PluginOptions {
  name: string;
  slug?: string;
  uri?: string;
  description: string;
  version: string;
  author: string;
  authorUri?: string;
  license: string;
  licenseUri?: string;
  textDomain?: string;
  domainPath?: string;
  requiresWP?: string;
  requiresPHP?: string;
}

/**
 * Marks a class as a WordPress plugin entry point.
 * Provides metadata for the plugin header.
 */
export function Plugin(options: PluginOptions): (...args: any[]) => any {
  return function (..._args: any[]) {
    // No-op at runtime — metadata is extracted at compile time by the transpiler.
  };
}
