import ts from 'typescript';
import type { FunctionBodyIR, ParameterIR } from '../ir/plugin-ir.js';
import { toSnakeCase } from '../utils/naming.js';
import { transpileFunctionBody } from './statement-transpiler.js';
import { mapType } from './type-mapper.js';

/**
 * Inject `global $wpdb;` at the start of a PHP method body if $wpdb is used.
 */
function injectGlobalWpdb(phpCode: string): string {
  if (/\$wpdb\b/.test(phpCode)) {
    return `\t\tglobal $wpdb;\n${phpCode}`;
  }
  return phpCode;
}

/**
 * Transpile a method's body to a PHP code string.
 */
export function transpileMethodBody(
  bodyNode: ts.Node,
  typeChecker: ts.TypeChecker,
): FunctionBodyIR {
  if (ts.isBlock(bodyNode)) {
    const phpCode = injectGlobalWpdb(transpileFunctionBody(bodyNode, typeChecker));
    return {
      phpCode,
      sourceText: bodyNode.getText(),
    };
  }

  // If the node is the method itself, get its body
  if (ts.isMethodDeclaration(bodyNode) && bodyNode.body) {
    const phpCode = injectGlobalWpdb(transpileFunctionBody(bodyNode.body, typeChecker));
    return {
      phpCode,
      sourceText: bodyNode.body.getText(),
    };
  }

  return {
    phpCode: '        // empty body',
    sourceText: '',
  };
}

/**
 * Transpile method parameters to PHP parameter strings.
 */
export function transpileParameters(
  params: { name: string; type: string; defaultValue?: string }[],
): ParameterIR[] {
  return params.map((p) => ({
    name: p.name,
    phpName: `$${toSnakeCase(p.name)}`,
    type: mapType(p.type),
    defaultValue: p.defaultValue ?? null,
  }));
}

/**
 * Format a PHP parameter list string from ParameterIR[].
 */
export function formatPhpParameters(params: ParameterIR[]): string {
  return params
    .map((p) => {
      let param = p.phpName;
      if (p.defaultValue) {
        param += ` = ${p.defaultValue}`;
      }
      return param;
    })
    .join(', ');
}
