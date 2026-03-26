/**
 * PHP code formatting utilities following WordPress coding standards.
 */

/**
 * Escape a string for PHP single-quoted string literal.
 */
export function phpEscapeString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Generate a PHP file header comment with "silence is golden" guard.
 */
export function phpFileGuard(): string {
  return `<?php
/**
 * Silence is golden.
 */
`;
}

/**
 * Generate the security check that prevents direct access.
 */
export function phpSecurityCheck(): string {
  return `if ( ! defined( 'WPINC' ) ) {
\tdie;
}`;
}

/**
 * Indent a block of PHP code.
 */
export function phpIndent(code: string, tabs: number = 1): string {
  const indent = '\t'.repeat(tabs);
  return code
    .split('\n')
    .map((line) => (line.trim() ? `${indent}${line}` : ''))
    .join('\n');
}
