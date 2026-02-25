export interface SettingOptions {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  default: unknown;
  label: string;
  description?: string;
  sanitize?: string;
}

/**
 * Registers a WordPress setting.
 * Generates `register_setting()` calls and a REST API endpoint for the setting.
 */
export function Setting(options: SettingOptions): (target: any, propertyKey: string | symbol) => void {
  return function (_target, _propertyKey) {
    // No-op at runtime — metadata is extracted at compile time by the transpiler.
  };
}
