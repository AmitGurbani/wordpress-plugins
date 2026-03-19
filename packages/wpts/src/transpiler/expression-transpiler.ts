import ts from 'typescript';
import { WP_FUNCTION_MAP, JS_METHOD_MAP } from './wp-function-map.js';
import { toSnakeCase } from '../utils/naming.js';
// Circular import with statement-transpiler is safe: both modules only call each other's
// functions at runtime (not at module load time), so ESM live bindings resolve correctly.
import { transpileBlock as transpileBlockStmts } from './statement-transpiler.js';

/**
 * Transpile a TypeScript expression node to a PHP expression string.
 */
export function transpileExpression(node: ts.Expression, typeChecker: ts.TypeChecker): string {
  switch (node.kind) {
    // Literals
    case ts.SyntaxKind.StringLiteral:
    case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
      return transpileStringLiteral(node as ts.StringLiteral);

    case ts.SyntaxKind.NumericLiteral:
      return (node as ts.NumericLiteral).text;

    case ts.SyntaxKind.TrueKeyword:
      return 'true';

    case ts.SyntaxKind.FalseKeyword:
      return 'false';

    case ts.SyntaxKind.NullKeyword:
      return 'null';

    // Identifier (variable name)
    case ts.SyntaxKind.Identifier:
      return transpileIdentifier(node as ts.Identifier, typeChecker);

    // this
    case ts.SyntaxKind.ThisKeyword:
      return '$this';

    // Binary expression (a + b, a === b, etc.)
    case ts.SyntaxKind.BinaryExpression:
      return transpileBinaryExpression(node as ts.BinaryExpression, typeChecker);

    // Prefix unary (!x, -x, ++x)
    case ts.SyntaxKind.PrefixUnaryExpression:
      return transpilePrefixUnary(node as ts.PrefixUnaryExpression, typeChecker);

    // Postfix unary (x++, x--)
    case ts.SyntaxKind.PostfixUnaryExpression:
      return transpilePostfixUnary(node as ts.PostfixUnaryExpression, typeChecker);

    // Call expression: func(args)
    case ts.SyntaxKind.CallExpression:
      return transpileCallExpression(node as ts.CallExpression, typeChecker);

    // Property access: obj.prop
    case ts.SyntaxKind.PropertyAccessExpression:
      return transpilePropertyAccess(node as ts.PropertyAccessExpression, typeChecker);

    // Element access: obj[key]
    case ts.SyntaxKind.ElementAccessExpression:
      return transpileElementAccess(node as ts.ElementAccessExpression, typeChecker);

    // Template literal: `hello ${name}`
    case ts.SyntaxKind.TemplateExpression:
      return transpileTemplateLiteral(node as ts.TemplateExpression, typeChecker);

    // Ternary: a ? b : c
    case ts.SyntaxKind.ConditionalExpression:
      return transpileConditional(node as ts.ConditionalExpression, typeChecker);

    // Array literal: [1, 2, 3]
    case ts.SyntaxKind.ArrayLiteralExpression:
      return transpileArrayLiteral(node as ts.ArrayLiteralExpression, typeChecker);

    // Object literal: { key: value }
    case ts.SyntaxKind.ObjectLiteralExpression:
      return transpileObjectLiteral(node as ts.ObjectLiteralExpression, typeChecker);

    // Parenthesized expression: (expr)
    case ts.SyntaxKind.ParenthesizedExpression:
      return `(${transpileExpression((node as ts.ParenthesizedExpression).expression, typeChecker)})`;

    // Arrow function: (x) => x * 2
    case ts.SyntaxKind.ArrowFunction:
      return transpileArrowFunction(node as ts.ArrowFunction, typeChecker);

    // typeof
    case ts.SyntaxKind.TypeOfExpression:
      return transpileTypeOf(node as ts.TypeOfExpression, typeChecker);

    // void expression
    case ts.SyntaxKind.VoidExpression:
      return 'null';

    // Non-null assertion: x!
    case ts.SyntaxKind.NonNullExpression:
      return transpileExpression((node as ts.NonNullExpression).expression, typeChecker);

    // As expression: x as Type (strip type assertion)
    case ts.SyntaxKind.AsExpression:
      return transpileExpression((node as ts.AsExpression).expression, typeChecker);

    // Unsupported constructs with helpful messages
    case ts.SyntaxKind.AwaitExpression:
      return `/* WPTS: async/await is not supported. Use synchronous WordPress API calls instead. */ ${node.getText()}`;

    case ts.SyntaxKind.ClassExpression:
      return `/* WPTS: Class expressions are not supported. Define classes at the top level with decorators. */`;

    case ts.SyntaxKind.YieldExpression:
      return `/* WPTS: Generators (yield) are not supported in PHP transpilation. */`;

    // Spread element: ...arr (in function calls, emits PHP splat operator)
    case ts.SyntaxKind.SpreadElement: {
      const spread = node as ts.SpreadElement;
      return `...${transpileExpression(spread.expression, typeChecker)}`;
    }

    // Delete expression: delete obj.prop -> unset()
    case ts.SyntaxKind.DeleteExpression: {
      const delExpr = node as ts.DeleteExpression;
      const operand = transpileExpression(delExpr.expression, typeChecker);
      return `unset( ${operand} )`;
    }

    case ts.SyntaxKind.RegularExpressionLiteral:
      return `/* WPTS: Regular expressions are not supported. Use preg_match() / preg_replace() via direct PHP calls. */`;

    case ts.SyntaxKind.TaggedTemplateExpression:
      return `/* WPTS: Tagged template literals are not supported. Use regular string concatenation. */`;

    case ts.SyntaxKind.NewExpression: {
      const newExpr = node as ts.NewExpression;
      // Class names in `new` expressions should NOT get $ prefix — they are class references, not variables
      let className: string;
      if (ts.isIdentifier(newExpr.expression)) {
        className = newExpr.expression.text;
      } else {
        className = transpileExpression(newExpr.expression, typeChecker);
      }
      const newArgs = newExpr.arguments ? newExpr.arguments.map(a => transpileExpression(a, typeChecker)) : [];
      return `new ${phpCall(className, newArgs)}`;
    }

    default:
      return `/* WPTS: Unsupported construct "${ts.SyntaxKind[node.kind]}". See https://github.com/wpts/wpts#supported-constructs */ ${node.getText()}`;
  }
}

function transpileStringLiteral(node: ts.StringLiteral): string {
  // Use single quotes (WordPress coding standards)
  const text = node.text.replace(/'/g, "\\'");
  return `'${text}'`;
}

function transpileIdentifier(node: ts.Identifier, typeChecker: ts.TypeChecker): string {
  const name = node.text;

  // WordPress API functions stay as-is (will be handled by call expression)
  // But only if the identifier is NOT a local variable declaration.
  if (WP_FUNCTION_MAP[name]) {
    const symbol = typeChecker.getSymbolAtLocation(node);
    const isVariable = symbol?.declarations?.some(
      d => ts.isVariableDeclaration(d) || ts.isParameter(d) || ts.isBindingElement(d)
    );
    if (!isVariable) {
      return WP_FUNCTION_MAP[name];
    }
  }

  // PHP superglobals — preserve verbatim (already include $ in the name)
  if (name === '$_SERVER' || name === '$_POST' || name === '$_GET' || name === '$_REQUEST'
      || name === '$_SESSION' || name === '$_COOKIE' || name === '$_FILES' || name === '$_ENV') {
    return name;
  }

  // PHP superglobals and constants
  if (name === 'undefined') return 'null';
  if (name === 'NaN') return 'NAN';
  if (name === 'Infinity') return 'INF';
  if (name === '__FILE__') return '__FILE__';

  // Regular variable — add $ prefix and convert to snake_case
  return `$${toSnakeCase(name)}`;
}

function transpileBinaryExpression(node: ts.BinaryExpression, typeChecker: ts.TypeChecker): string {
  // Detect typeof x === 'type' pattern and emit idiomatic PHP is_*() calls
  const typeofResult = tryTranspileTypeofComparison(node, typeChecker);
  if (typeofResult !== null) {
    return typeofResult;
  }

  const left = transpileExpression(node.left, typeChecker);
  const right = transpileExpression(node.right, typeChecker);
  const op = transpileBinaryOperator(node.operatorToken, node, typeChecker);

  return `${left} ${op} ${right}`;
}

function tryTranspileTypeofComparison(node: ts.BinaryExpression, typeChecker: ts.TypeChecker): string | null {
  const op = node.operatorToken.kind;
  if (op !== ts.SyntaxKind.EqualsEqualsEqualsToken && op !== ts.SyntaxKind.ExclamationEqualsEqualsToken) {
    return null;
  }

  let typeofExpr: ts.TypeOfExpression | null = null;
  let typeStr: string | null = null;

  if (ts.isTypeOfExpression(node.left) && ts.isStringLiteral(node.right)) {
    typeofExpr = node.left;
    typeStr = node.right.text;
  } else if (ts.isStringLiteral(node.left) && ts.isTypeOfExpression(node.right)) {
    typeStr = node.left.text;
    typeofExpr = node.right;
  }

  if (!typeofExpr || !typeStr) return null;

  const operand = transpileExpression(typeofExpr.expression, typeChecker);
  const negate = op === ts.SyntaxKind.ExclamationEqualsEqualsToken;

  const typeMap: Record<string, string> = {
    'string': 'is_string',
    'number': 'is_numeric',
    'boolean': 'is_bool',
    'object': 'is_array',
    'undefined': 'is_null',
    'function': 'is_callable',
  };

  const phpFunc = typeMap[typeStr];
  if (!phpFunc) return null;

  const call = `${phpFunc}( ${operand} )`;
  return negate ? `! ${call}` : call;
}

function transpileBinaryOperator(
  token: ts.BinaryOperatorToken,
  node: ts.BinaryExpression,
  typeChecker: ts.TypeChecker,
): string {
  switch (token.kind) {
    case ts.SyntaxKind.PlusToken:
    case ts.SyntaxKind.PlusEqualsToken: {
      // Check if string concatenation
      if (isStringType(node.left, typeChecker) || isStringType(node.right, typeChecker)) {
        return token.kind === ts.SyntaxKind.PlusEqualsToken ? '.=' : '.';
      }
      return token.kind === ts.SyntaxKind.PlusEqualsToken ? '+=' : '+';
    }
    case ts.SyntaxKind.MinusToken: return '-';
    case ts.SyntaxKind.MinusEqualsToken: return '-=';
    case ts.SyntaxKind.AsteriskToken: return '*';
    case ts.SyntaxKind.AsteriskEqualsToken: return '*=';
    case ts.SyntaxKind.SlashToken: return '/';
    case ts.SyntaxKind.SlashEqualsToken: return '/=';
    case ts.SyntaxKind.PercentToken: return '%';
    case ts.SyntaxKind.PercentEqualsToken: return '%=';
    case ts.SyntaxKind.AsteriskAsteriskToken: return '**';

    // Comparison
    case ts.SyntaxKind.EqualsEqualsToken: return '==';
    case ts.SyntaxKind.EqualsEqualsEqualsToken: return '===';
    case ts.SyntaxKind.ExclamationEqualsToken: return '!=';
    case ts.SyntaxKind.ExclamationEqualsEqualsToken: return '!==';
    case ts.SyntaxKind.LessThanToken: return '<';
    case ts.SyntaxKind.LessThanEqualsToken: return '<=';
    case ts.SyntaxKind.GreaterThanToken: return '>';
    case ts.SyntaxKind.GreaterThanEqualsToken: return '>=';

    // Logical
    case ts.SyntaxKind.AmpersandAmpersandToken: return '&&';
    case ts.SyntaxKind.BarBarToken: return '||';
    case ts.SyntaxKind.QuestionQuestionToken: return '??'; // Nullish coalescing

    // Bitwise
    case ts.SyntaxKind.AmpersandToken: return '&';
    case ts.SyntaxKind.BarToken: return '|';
    case ts.SyntaxKind.CaretToken: return '^';
    case ts.SyntaxKind.LessThanLessThanToken: return '<<';
    case ts.SyntaxKind.GreaterThanGreaterThanToken: return '>>';

    // Assignment
    case ts.SyntaxKind.EqualsToken: return '=';
    case ts.SyntaxKind.AmpersandAmpersandEqualsToken: return '&&=';
    case ts.SyntaxKind.BarBarEqualsToken: return '||=';
    case ts.SyntaxKind.QuestionQuestionEqualsToken: return '??=';

    // instanceof
    case ts.SyntaxKind.InstanceOfKeyword: return 'instanceof';

    default:
      return token.getText();
  }
}

function transpilePrefixUnary(node: ts.PrefixUnaryExpression, typeChecker: ts.TypeChecker): string {
  const operand = transpileExpression(node.operand, typeChecker);
  switch (node.operator) {
    case ts.SyntaxKind.ExclamationToken: return `! ${operand}`;
    case ts.SyntaxKind.MinusToken: return `-${operand}`;
    case ts.SyntaxKind.PlusToken: return `+${operand}`;
    case ts.SyntaxKind.TildeToken: return `~${operand}`;
    case ts.SyntaxKind.PlusPlusToken: return `++${operand}`;
    case ts.SyntaxKind.MinusMinusToken: return `--${operand}`;
    default: return operand;
  }
}

function transpilePostfixUnary(node: ts.PostfixUnaryExpression, typeChecker: ts.TypeChecker): string {
  const operand = transpileExpression(node.operand, typeChecker);
  switch (node.operator) {
    case ts.SyntaxKind.PlusPlusToken: return `${operand}++`;
    case ts.SyntaxKind.MinusMinusToken: return `${operand}--`;
    default: return operand;
  }
}

function transpileCallExpression(node: ts.CallExpression, typeChecker: ts.TypeChecker): string {
  const args = node.arguments.map(a => transpileExpression(a, typeChecker));

  // Method call: obj.method(args) or obj?.method(args)
  if (ts.isPropertyAccessExpression(node.expression)) {
    const obj = node.expression.expression;
    const methodName = node.expression.name.text;

    // Optional chaining: obj?.method(args)
    if (node.expression.questionDotToken) {
      const objStr = transpileExpression(obj, typeChecker);
      return `(${objStr} !== null ? ${objStr}->${phpCall(toSnakeCase(methodName), args)} : null)`;
    }

    // console.log -> error_log
    if (ts.isIdentifier(obj) && obj.text === 'console') {
      if (methodName === 'log' || methodName === 'warn' || methodName === 'error') {
        return phpCall('error_log', args);
      }
    }

    // Date methods -> PHP time functions
    if (ts.isIdentifier(obj) && obj.text === 'Date') {
      if (methodName === 'now') return 'time()';
      if (methodName === 'parse') return phpCall('strtotime', args);
      if (methodName === 'UTC') return phpCall('gmmktime', args);
    }

    // JSON.stringify -> json_encode, JSON.parse -> json_decode
    if (ts.isIdentifier(obj) && obj.text === 'JSON') {
      if (methodName === 'stringify') return phpCall('json_encode', args);
      if (methodName === 'parse') return phpCall('json_decode', [args[0], 'true']);
    }

    // Math methods
    if (ts.isIdentifier(obj) && obj.text === 'Math') {
      const mathMap: Record<string, string> = {
        floor: 'floor', ceil: 'ceil', round: 'round', abs: 'abs',
        min: 'min', max: 'max', random: 'mt_rand', pow: 'pow',
        sqrt: 'sqrt', log: 'log', sin: 'sin', cos: 'cos', tan: 'tan',
      };
      if (mathMap[methodName]) {
        return phpCall(mathMap[methodName], args);
      }
    }

    // Object.keys / Object.values
    if (ts.isIdentifier(obj) && obj.text === 'Object') {
      if (methodName === 'keys') return phpCall('array_keys', [args[0]]);
      if (methodName === 'values') return phpCall('array_values', [args[0]]);
      if (methodName === 'assign') return phpCall('array_merge', args);
      if (methodName === 'entries') return phpCall('array_map', ['null', phpCall('array_keys', [args[0]]), phpCall('array_values', [args[0]])]);
    }

    // Type-ambiguous methods: different PHP function for strings vs arrays
    const ambiguousStringMethods: Record<string, (objStr: string, a: string[]) => string> = {
      indexOf: (o, a) => `strpos( ${o}, ${a[0]} )`,
      includes: (o, a) => `str_contains( ${o}, ${a[0]} )`,
      lastIndexOf: (o, a) => `strrpos( ${o}, ${a[0]} )`,
      slice: (o, a) => a.length === 2 ? `substr( ${o}, ${a[0]}, ${a[1]} - ${a[0]} )` : `substr( ${o}, ${a[0]} )`,
      concat: (o, a) => [o, ...a].join(' . '),
      padEnd: (o, a) => `str_pad( ${[o, ...a].join(', ')}, STR_PAD_RIGHT )`,
    };

    if (ambiguousStringMethods[methodName] && isStringType(obj, typeChecker)) {
      const objStr = transpileExpression(obj, typeChecker);
      return ambiguousStringMethods[methodName](objStr, args);
    }

    // Custom array methods requiring special PHP generation
    if (methodName === 'find') {
      const objStr = transpileExpression(obj, typeChecker);
      return `(reset( array_filter( ${objStr}, ${args[0]} ) ) ?: null)`;
    }

    if (methodName === 'reduce') {
      const objStr = transpileExpression(obj, typeChecker);
      if (args.length === 2) {
        return `array_reduce( ${objStr}, ${args[0]}, ${args[1]} )`;
      }
      return `array_reduce( ${objStr}, ${args[0]} )`;
    }

    if (methodName === 'some') {
      const objStr = transpileExpression(obj, typeChecker);
      return `count( array_filter( ${objStr}, ${args[0]} ) ) > 0`;
    }

    if (methodName === 'every') {
      const objStr = transpileExpression(obj, typeChecker);
      return `count( array_filter( ${objStr}, ${args[0]} ) ) === count( ${objStr} )`;
    }

    if (methodName === 'flat') {
      const objStr = transpileExpression(obj, typeChecker);
      return `array_merge( ...${objStr} )`;
    }

    // JS built-in method -> PHP function mapping
    if (JS_METHOD_MAP[methodName]) {
      const mapping = JS_METHOD_MAP[methodName];
      const objStr = transpileExpression(obj, typeChecker);

      switch (mapping.objectPosition) {
        case 'first':
          return phpCall(mapping.phpFunc, [objStr, ...args]);
        case 'last':
          return phpCall(mapping.phpFunc, [...args, objStr]);
        case 'swap':
          return phpCall(mapping.phpFunc, [...args, objStr]);
      }
    }

    // this.method(args) -> $this->method(args)
    if (obj.kind === ts.SyntaxKind.ThisKeyword) {
      return `$this->${phpCall(toSnakeCase(methodName), args)}`;
    }

    // General method call: $obj->method(args)
    const objStr = transpileExpression(obj, typeChecker);
    return `${objStr}->${phpCall(toSnakeCase(methodName), args)}`;
  }

  // Direct function call
  if (ts.isIdentifier(node.expression)) {
    const funcName = node.expression.text;

    // WordPress API function
    if (WP_FUNCTION_MAP[funcName]) {
      const phpFunc = WP_FUNCTION_MAP[funcName];
      // 'echo' is a language construct, not a function
      if (phpFunc === 'echo') {
        return `echo ${args.join(', ')}`;
      }
      // getallheaders() is unavailable in PHP CLI (WP-CLI) — guard with function_exists
      if (phpFunc === 'getallheaders') {
        return `function_exists( 'getallheaders' ) ? getallheaders() : array()`;
      }
      return phpCall(phpFunc, args);
    }

    // parseInt / parseFloat
    if (funcName === 'parseInt') return phpCall('intval', [args[0]]);
    if (funcName === 'parseFloat') return phpCall('floatval', [args[0]]);
    if (funcName === 'String') return phpCall('strval', [args[0]]);
    if (funcName === 'Number') return phpCall('intval', [args[0]]);
    if (funcName === 'Boolean') return phpCall('boolval', [args[0]]);
    if (funcName === 'Array' && args.length > 0) return phpCall('array_fill', ['0', args[0], 'null']);
    if (funcName === 'isNaN') return phpCall('is_nan', [args[0]]);
    if (funcName === 'isFinite') return phpCall('is_finite', [args[0]]);

    // General function — convert to snake_case
    return phpCall(toSnakeCase(funcName), args);
  }

  // Fallback
  const callee = transpileExpression(node.expression, typeChecker);
  return phpCall(callee, args);
}

function transpilePropertyAccess(node: ts.PropertyAccessExpression, typeChecker: ts.TypeChecker): string {
  const prop = node.name.text;

  // Optional chaining: obj?.prop
  if (node.questionDotToken) {
    const obj = transpileExpression(node.expression, typeChecker);
    // this?.prop is same as this->prop in PHP (this is never null)
    if (node.expression.kind === ts.SyntaxKind.ThisKeyword) {
      return `$this->${toSnakeCase(prop)}`;
    }
    return `(${obj} !== null ? ${obj}['${prop}'] : null)`;
  }

  // Enum member access: Direction.Up -> Direction::UP
  if (ts.isIdentifier(node.expression)) {
    try {
      const exprSymbol = typeChecker.getSymbolAtLocation(node.expression);
      if (exprSymbol && (exprSymbol.flags & ts.SymbolFlags.RegularEnum)) {
        const enumName = node.expression.text;
        const memberName = prop
          .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
          .toUpperCase();
        return `${enumName}::${memberName}`;
      }
    } catch {
      // Fall through to normal property access
    }
  }

  const obj = transpileExpression(node.expression, typeChecker);

  // this.prop -> $this->prop
  if (node.expression.kind === ts.SyntaxKind.ThisKeyword) {
    return `$this->${toSnakeCase(prop)}`;
  }

  // .length -> count() or strlen()
  if (prop === 'length') {
    if (isStringType(node.expression, typeChecker)) {
      return `strlen( ${obj} )`;
    }
    return `count( ${obj} )`;
  }

  // Math.PI, Math.E
  if (ts.isIdentifier(node.expression) && node.expression.text === 'Math') {
    if (prop === 'PI') return 'M_PI';
    if (prop === 'E') return 'M_E';
  }

  // $wpdb property access -> object property (not array key)
  if (ts.isIdentifier(node.expression) && node.expression.text === 'wpdb') {
    return `$wpdb->${prop}`;
  }

  // General property access -> array key access (WordPress convention)
  return `${obj}['${prop}']`;
}

function transpileElementAccess(node: ts.ElementAccessExpression, typeChecker: ts.TypeChecker): string {
  const obj = transpileExpression(node.expression, typeChecker);
  const index = transpileExpression(node.argumentExpression, typeChecker);

  // Optional chaining: arr?.[0]
  if (node.questionDotToken) {
    return `(${obj} !== null ? ${obj}[${index}] : null)`;
  }

  return `${obj}[${index}]`;
}

function transpileTemplateLiteral(node: ts.TemplateExpression, typeChecker: ts.TypeChecker): string {
  const parts: string[] = [];

  // Head
  if (node.head.text) {
    parts.push(`'${node.head.text.replace(/'/g, "\\'")}'`);
  }

  // Spans
  for (const span of node.templateSpans) {
    parts.push(transpileExpression(span.expression, typeChecker));
    if (span.literal.text) {
      parts.push(`'${span.literal.text.replace(/'/g, "\\'")}'`);
    }
  }

  return parts.join(' . ');
}

function transpileConditional(node: ts.ConditionalExpression, typeChecker: ts.TypeChecker): string {
  const condition = transpileExpression(node.condition, typeChecker);
  const whenTrue = transpileExpression(node.whenTrue, typeChecker);
  const whenFalse = transpileExpression(node.whenFalse, typeChecker);
  return `${condition} ? ${whenTrue} : ${whenFalse}`;
}

function transpileArrayLiteral(node: ts.ArrayLiteralExpression, typeChecker: ts.TypeChecker): string {
  if (node.elements.length === 0) return 'array()';

  // Check for spread elements: [...arr, 4, 5] -> array_merge( $arr, array( 4, 5 ) )
  const hasSpread = node.elements.some(e => ts.isSpreadElement(e));
  if (hasSpread) {
    const groups: string[] = [];
    let currentGroup: string[] = [];
    for (const el of node.elements) {
      if (ts.isSpreadElement(el)) {
        if (currentGroup.length > 0) {
          groups.push(`array( ${currentGroup.join(', ')} )`);
          currentGroup = [];
        }
        groups.push(transpileExpression(el.expression, typeChecker));
      } else {
        currentGroup.push(transpileExpression(el, typeChecker));
      }
    }
    if (currentGroup.length > 0) {
      groups.push(`array( ${currentGroup.join(', ')} )`);
    }
    return groups.length === 1 ? groups[0] : `array_merge( ${groups.join(', ')} )`;
  }

  const elements = node.elements.map(e => transpileExpression(e, typeChecker));
  return `array( ${elements.join(', ')} )`;
}

function transpileObjectLiteral(node: ts.ObjectLiteralExpression, typeChecker: ts.TypeChecker): string {
  if (node.properties.length === 0) return 'array()';

  // Check for spread: { ...obj, key: val } -> array_merge( $obj, array( 'key' => $val ) )
  const hasSpread = node.properties.some(p => ts.isSpreadAssignment(p));
  if (hasSpread) {
    const groups: string[] = [];
    let currentProps: string[] = [];
    for (const prop of node.properties) {
      if (ts.isSpreadAssignment(prop)) {
        if (currentProps.length > 0) {
          groups.push(`array( ${currentProps.join(', ')} )`);
          currentProps = [];
        }
        groups.push(transpileExpression(prop.expression, typeChecker));
      } else {
        currentProps.push(transpileObjectProperty(prop, typeChecker));
      }
    }
    if (currentProps.length > 0) {
      groups.push(`array( ${currentProps.join(', ')} )`);
    }
    return `array_merge( ${groups.join(', ')} )`;
  }

  const props = node.properties.map(p => transpileObjectProperty(p, typeChecker));
  return `array( ${props.join(', ')} )`;
}

function transpileObjectProperty(prop: ts.ObjectLiteralElementLike, typeChecker: ts.TypeChecker): string {
  if (ts.isPropertyAssignment(prop)) {
    const key = ts.isIdentifier(prop.name)
      ? `'${prop.name.text}'`
      : ts.isStringLiteral(prop.name)
        ? `'${prop.name.text}'`
        : transpileExpression(prop.name as ts.Expression, typeChecker);
    const value = transpileExpression(prop.initializer, typeChecker);
    return `${key} => ${value}`;
  }
  if (ts.isShorthandPropertyAssignment(prop)) {
    const name = prop.name.text;
    return `'${name}' => $${name}`;
  }
  return `/* UNSUPPORTED property type */`;
}

function transpileArrowFunction(node: ts.ArrowFunction, typeChecker: ts.TypeChecker): string {
  const params = node.parameters.map(p => {
    const name = ts.isIdentifier(p.name) ? `$${toSnakeCase(p.name.text)}` : '$param';
    return name;
  });

  // Simple expression body: (x) => x * 2
  if (!ts.isBlock(node.body)) {
    const body = transpileExpression(node.body, typeChecker);
    return `function( ${params.join(', ')} ) { return ${body}; }`;
  }

  // Block body — transpile each statement using the statement transpiler
  const block = node.body as ts.Block;
  const bodyCode = transpileBlockStmts(block, typeChecker, '\t\t');
  return `function( ${params.join(', ')} ) {\n${bodyCode}\n\t}`;
}

function transpileTypeOf(node: ts.TypeOfExpression, typeChecker: ts.TypeChecker): string {
  const operand = transpileExpression(node.expression, typeChecker);
  // typeof in PHP comparisons are usually done with is_* functions
  // This returns gettype() which can be compared
  return `gettype( ${operand} )`;
}

/**
 * Format a PHP function call with proper spacing.
 * No args: `func()`, with args: `func( arg1, arg2 )`.
 */
function phpCall(name: string, args: string[]): string {
  if (args.length === 0) return `${name}()`;
  return `${name}( ${args.join(', ')} )`;
}

/**
 * Check if an expression is of string type using the TypeScript type checker.
 */
function isStringType(node: ts.Expression, typeChecker: ts.TypeChecker): boolean {
  // Heuristic check first — most reliable for literals
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateExpression(node)) {
    return true;
  }

  try {
    const type = typeChecker.getTypeAtLocation(node);
    // Check if the type is assignable to string
    if (type.flags & ts.TypeFlags.StringLike) {
      return true;
    }
    const typeStr = typeChecker.typeToString(type);
    return typeStr === 'string';
  } catch {
    return false;
  }
}
