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
  /** Auto-generate a WooCommerce dependency admin notice. */
  wooNotice?: 'recommended' | 'required';
  /**
   * GitHub repo ("<owner>/<repo>") to enable auto-updates from GitHub Releases.
   * Case-sensitive. Generates the `Update URI` plugin header and a self-contained
   * updater class that hooks `update_plugins_{hostname}` and `plugins_api` (WP 5.8+).
   */
  githubRepo?: string;
  /**
   * Override the Update URI. Derived from githubRepo + slug when omitted.
   * The hostname becomes the filter suffix; the full URI is the per-plugin identity
   * key enforced by the generated updater's `UpdateURI` string check.
   */
  updateUri?: string;
}

/**
 * Marks a class as a WordPress plugin entry point.
 * Provides metadata for the plugin header.
 */
export function Plugin(_options: PluginOptions): (...args: any[]) => any {
  return (..._args: any[]) => {
    // No-op at runtime — metadata is extracted at compile time by the transpiler.
  };
}
