/**
 * Naming convention utilities for converting between TypeScript and WordPress/PHP conventions.
 */

/**
 * Convert a string to slug-case (kebab-case).
 * "Hello World Plugin" → "hello-world-plugin"
 * "MyAwesomePlugin" → "my-awesome-plugin"
 */
export function toSlugCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .replace(/-+/g, '-')
    .toLowerCase()
    .replace(/^-|-$/g, '');
}

/**
 * Convert a string to snake_case.
 * "greetingMessage" → "greeting_message"
 * "MyAwesomePlugin" → "my_awesome_plugin"
 * "appendGreeting" → "append_greeting"
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .replace(/_+/g, '_')
    .toLowerCase()
    .replace(/^_|_$/g, '');
}

/**
 * Convert a string to PascalCase.
 * "hello-world-plugin" → "HelloWorldPlugin"
 * "my_awesome_plugin" → "MyAwesomePlugin"
 * "greeting message" → "GreetingMessage"
 */
export function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9\s_-]/g, '')
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Convert to WordPress PHP class name convention (underscore-separated PascalCase).
 * "HelloGreeter" → "Hello_Greeter"
 * "MyAwesomePlugin" → "My_Awesome_Plugin"
 */
export function toWPClassName(str: string): string {
  // First normalize to PascalCase if needed
  const pascal = /^[A-Z]/.test(str) && !/[\s_-]/.test(str) ? str : toPascalCase(str);

  return pascal.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z])([A-Z][a-z])/g, '$1_$2');
}

/**
 * Convert a plugin name to a constant prefix.
 * "Hello Greeter" → "HELLO_GREETER_"
 * "my-awesome-plugin" → "MY_AWESOME_PLUGIN_"
 */
export function toConstantPrefix(str: string): string {
  return toSnakeCase(str).toUpperCase() + '_';
}

/**
 * Convert a plugin name to a function prefix.
 * "Hello Greeter" → "hello_greeter_"
 * "my-awesome-plugin" → "my_awesome_plugin_"
 */
export function toFunctionPrefix(str: string): string {
  return toSnakeCase(str) + '_';
}

/**
 * Convert a camelCase WordPress API function name to snake_case PHP equivalent.
 * "getOption" → "get_option"
 * "wpEnqueueScript" → "wp_enqueue_script"
 * "escHtml" → "esc_html"
 */
export function toPhpFunctionName(camelCase: string): string {
  return toSnakeCase(camelCase);
}

/**
 * Convert a WordPress file prefix from a plugin name.
 * "Hello Greeter" → "hello-greeter"
 * "MyAwesomePlugin" → "my-awesome-plugin"
 */
export function toFilePrefix(str: string): string {
  return toSlugCase(str);
}

/**
 * Derive a text domain from a plugin name.
 * Same as slug case.
 */
export function toTextDomain(str: string): string {
  return toSlugCase(str);
}
