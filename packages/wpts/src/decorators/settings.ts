export interface SettingOptions {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'url';
  default: unknown;
  label: string;
  description?: string;
  sanitize?: string;
  sensitive?: boolean;
  /** Include this setting in the auto-generated public GET /config endpoint. */
  exposeInConfig?: boolean;
  /** Auto-generate a filter that defaults to the WooCommerce currency when available. */
  wooCurrencyDefault?: boolean;
}

/**
 * Registers a WordPress setting.
 * Generates `register_setting()` calls and a REST API endpoint for the setting.
 */
export function Setting(options: SettingOptions): (...args: any[]) => any {
  return (..._args: any[]) => {
    // No-op at runtime — metadata is extracted at compile time by the transpiler.
  };
}
