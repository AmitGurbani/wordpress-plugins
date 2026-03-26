/**
 * Maps TypeScript types to PHP types.
 */

const TYPE_MAP: Record<string, string> = {
  string: 'string',
  number: 'int',
  boolean: 'bool',
  void: 'void',
  null: 'null',
  undefined: 'null',
  any: 'mixed',
  unknown: 'mixed',
  never: 'never',
  object: 'array',
};

/**
 * Convert a TypeScript type string to a PHP type string.
 */
export function mapType(tsType: string): string {
  // Handle nullable types: T | null, T | undefined
  const nullable = tsType.includes('| null') || tsType.includes('| undefined');
  const cleanType = tsType
    .replace(/\|\s*null/g, '')
    .replace(/\|\s*undefined/g, '')
    .trim();

  const mapped = mapSingleType(cleanType);
  return nullable ? `?${mapped}` : mapped;
}

function mapSingleType(tsType: string): string {
  // Direct mapping
  if (TYPE_MAP[tsType]) {
    return TYPE_MAP[tsType];
  }

  // Array types: string[], number[], etc.
  if (tsType.endsWith('[]')) {
    return 'array';
  }

  // Generic array: Array<T>
  if (tsType.startsWith('Array<')) {
    return 'array';
  }

  // Record<K,V> -> array
  if (tsType.startsWith('Record<')) {
    return 'array';
  }

  // float
  if (tsType === 'float' || tsType === 'double') {
    return 'float';
  }

  // Default: use as-is (could be a class name)
  return tsType;
}

/**
 * Map a TypeScript type to a PHP default value string.
 */
export function mapDefaultValue(tsType: string): string {
  switch (tsType) {
    case 'string':
      return "''";
    case 'number':
      return '0';
    case 'boolean':
      return 'false';
    case 'array':
    case 'object':
      return 'array()';
    default:
      return 'null';
  }
}
