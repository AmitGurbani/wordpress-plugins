import ts from 'typescript';
import { transpileFunctionBody } from './statement-transpiler.js';
import { mapType } from './type-mapper.js';
import type { FunctionBodyIR, ParameterIR } from '../ir/plugin-ir.js';
import { toSnakeCase } from '../utils/naming.js';

/**
 * Transpile a method's body to a PHP code string.
 */
export function transpileMethodBody(
  bodyNode: ts.Node,
  typeChecker: ts.TypeChecker,
): FunctionBodyIR {
  if (ts.isBlock(bodyNode)) {
    const phpCode = transpileFunctionBody(bodyNode, typeChecker);
    return {
      phpCode,
      sourceText: bodyNode.getText(),
    };
  }

  // If the node is the method itself, get its body
  if (ts.isMethodDeclaration(bodyNode) && bodyNode.body) {
    const phpCode = transpileFunctionBody(bodyNode.body, typeChecker);
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
  return params.map(p => ({
    name: p.name,
    phpName: `$${p.name}`,
    type: mapType(p.type),
    defaultValue: p.defaultValue ?? null,
  }));
}

/**
 * Format a PHP parameter list string from ParameterIR[].
 */
export function formatPhpParameters(params: ParameterIR[]): string {
  return params
    .map(p => {
      let param = p.phpName;
      if (p.defaultValue) {
        param += ` = ${p.defaultValue}`;
      }
      return param;
    })
    .join(', ');
}
