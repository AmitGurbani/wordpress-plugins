import ts from 'typescript';
import { toSnakeCase } from '../utils/naming.js';
import { transpileExpression } from './expression-transpiler.js';

/**
 * Transpile a TypeScript statement node to a PHP statement string.
 */
export function transpileStatement(
  node: ts.Statement,
  typeChecker: ts.TypeChecker,
  indent: string = '\t',
): string {
  switch (node.kind) {
    case ts.SyntaxKind.VariableStatement:
      return transpileVariableStatement(node as ts.VariableStatement, typeChecker, indent);

    case ts.SyntaxKind.ExpressionStatement:
      return transpileExpressionStatement(node as ts.ExpressionStatement, typeChecker, indent);

    case ts.SyntaxKind.ReturnStatement:
      return transpileReturnStatement(node as ts.ReturnStatement, typeChecker, indent);

    case ts.SyntaxKind.IfStatement:
      return transpileIfStatement(node as ts.IfStatement, typeChecker, indent);

    case ts.SyntaxKind.ForStatement:
      return transpileForStatement(node as ts.ForStatement, typeChecker, indent);

    case ts.SyntaxKind.ForOfStatement:
      return transpileForOfStatement(node as ts.ForOfStatement, typeChecker, indent);

    case ts.SyntaxKind.ForInStatement:
      return transpileForInStatement(node as ts.ForInStatement, typeChecker, indent);

    case ts.SyntaxKind.WhileStatement:
      return transpileWhileStatement(node as ts.WhileStatement, typeChecker, indent);

    case ts.SyntaxKind.DoStatement:
      return transpileDoWhileStatement(node as ts.DoStatement, typeChecker, indent);

    case ts.SyntaxKind.SwitchStatement:
      return transpileSwitchStatement(node as ts.SwitchStatement, typeChecker, indent);

    case ts.SyntaxKind.BreakStatement:
      return `${indent}break;`;

    case ts.SyntaxKind.ContinueStatement:
      return `${indent}continue;`;

    case ts.SyntaxKind.ThrowStatement:
      return transpileThrowStatement(node as ts.ThrowStatement, typeChecker, indent);

    case ts.SyntaxKind.TryStatement:
      return transpileTryStatement(node as ts.TryStatement, typeChecker, indent);

    case ts.SyntaxKind.Block:
      return transpileBlock(node as ts.Block, typeChecker, indent);

    case ts.SyntaxKind.EmptyStatement:
      return '';

    case ts.SyntaxKind.EnumDeclaration:
      return transpileEnumDeclaration(node as ts.EnumDeclaration, typeChecker, indent);

    // Unsupported constructs with helpful messages
    case ts.SyntaxKind.ClassDeclaration:
      return `${indent}/* WPTS: Nested class declarations are not supported. Use a single @Plugin class. */`;

    case ts.SyntaxKind.FunctionDeclaration:
      return `${indent}/* WPTS: Function declarations inside methods are not supported. Use arrow functions or extract to a separate method. */`;

    case ts.SyntaxKind.ImportDeclaration:
      return `${indent}/* WPTS: import/export statements are not transpiled. Use the decorator system to define plugin structure. */`;

    case ts.SyntaxKind.ExportDeclaration:
      return `${indent}/* WPTS: import/export statements are not transpiled. Use the decorator system to define plugin structure. */`;

    default:
      return `${indent}/* WPTS: Unsupported statement "${ts.SyntaxKind[node.kind]}". See https://github.com/wpts/wpts#supported-constructs */`;
  }
}

/**
 * Transpile a block of statements.
 */
export function transpileBlock(
  block: ts.Block,
  typeChecker: ts.TypeChecker,
  indent: string = '\t',
): string {
  return block.statements
    .map((stmt) => transpileStatement(stmt, typeChecker, indent))
    .filter(Boolean)
    .join('\n');
}

/**
 * Transpile a function body (Block) to PHP code string.
 */
export function transpileFunctionBody(
  body: ts.Block | ts.Node,
  typeChecker: ts.TypeChecker,
): string {
  if (ts.isBlock(body)) {
    return transpileBlock(body, typeChecker, '\t\t');
  }
  // Single expression body
  if (ts.isExpression(body)) {
    return `\t\treturn ${transpileExpression(body, typeChecker)};`;
  }
  return '\t\t/* empty body */';
}

function transpileVariableStatement(
  node: ts.VariableStatement,
  typeChecker: ts.TypeChecker,
  indent: string,
): string {
  const declarations = node.declarationList.declarations;
  return declarations
    .map((decl) => {
      // Object destructuring: const { a, b } = obj;
      if (ts.isObjectBindingPattern(decl.name)) {
        const obj = decl.initializer ? transpileExpression(decl.initializer, typeChecker) : 'null';
        return decl.name.elements
          .map((el) => {
            if (el.dotDotDotToken) {
              return `${indent}/* WPTS: Rest elements (...) in destructuring are not supported. Extract properties individually. */`;
            }
            // { x: renamed } -> propertyName = 'x', name = 'renamed'
            // { x } -> propertyName is undefined, name = 'x'
            const propName = el.propertyName
              ? ts.isIdentifier(el.propertyName)
                ? el.propertyName.text
                : el.propertyName.getText()
              : ts.isIdentifier(el.name)
                ? el.name.text
                : el.name.getText();
            const varName = ts.isIdentifier(el.name) ? `$${toSnakeCase(el.name.text)}` : '$var';
            if (el.initializer) {
              const defaultVal = transpileExpression(el.initializer, typeChecker);
              return `${indent}${varName} = ${obj}['${propName}'] ?? ${defaultVal};`;
            }
            return `${indent}${varName} = ${obj}['${propName}'];`;
          })
          .join('\n');
      }

      // Array destructuring: const [a, b] = arr;
      if (ts.isArrayBindingPattern(decl.name)) {
        const arr = decl.initializer
          ? transpileExpression(decl.initializer, typeChecker)
          : 'array()';
        return decl.name.elements
          .map((el, i) => {
            if (ts.isOmittedExpression(el)) return ''; // skip holes
            const bindEl = el as ts.BindingElement;
            if (bindEl.dotDotDotToken) {
              return `${indent}/* WPTS: Rest elements (...) in destructuring are not supported. Use array_slice() instead. */`;
            }
            const varName = ts.isIdentifier(bindEl.name)
              ? `$${toSnakeCase(bindEl.name.text)}`
              : '$var';
            if (bindEl.initializer) {
              const defaultVal = transpileExpression(bindEl.initializer, typeChecker);
              return `${indent}${varName} = ${arr}[${i}] ?? ${defaultVal};`;
            }
            return `${indent}${varName} = ${arr}[${i}];`;
          })
          .filter(Boolean)
          .join('\n');
      }

      // Simple variable: const x = value;
      const name = ts.isIdentifier(decl.name) ? `$${toSnakeCase(decl.name.text)}` : '$var';
      if (decl.initializer) {
        const value = transpileExpression(decl.initializer, typeChecker);
        return `${indent}${name} = ${value};`;
      }
      return `${indent}${name} = null;`;
    })
    .join('\n');
}

function transpileExpressionStatement(
  node: ts.ExpressionStatement,
  typeChecker: ts.TypeChecker,
  indent: string,
): string {
  const expr = transpileExpression(node.expression, typeChecker);
  // echo is a language construct, doesn't need semicolon handling
  if (expr.startsWith('echo ')) {
    return `${indent}${expr};`;
  }
  return `${indent}${expr};`;
}

function transpileReturnStatement(
  node: ts.ReturnStatement,
  typeChecker: ts.TypeChecker,
  indent: string,
): string {
  if (node.expression) {
    const expr = transpileExpression(node.expression, typeChecker);
    return `${indent}return ${expr};`;
  }
  return `${indent}return;`;
}

function transpileIfStatement(
  node: ts.IfStatement,
  typeChecker: ts.TypeChecker,
  indent: string,
): string {
  const condition = transpileExpression(node.expression, typeChecker);
  const thenBody = transpileStatementBody(node.thenStatement, typeChecker, indent);
  let result = `${indent}if ( ${condition} ) {\n${thenBody}\n${indent}}`;

  if (node.elseStatement) {
    if (ts.isIfStatement(node.elseStatement)) {
      // else if
      const elseIf = transpileIfStatement(node.elseStatement, typeChecker, indent);
      // Remove the indent from the else-if to chain properly
      result += ` else${elseIf.substring(indent.length)}`;
    } else {
      const elseBody = transpileStatementBody(node.elseStatement, typeChecker, indent);
      result += ` else {\n${elseBody}\n${indent}}`;
    }
  }

  return result;
}

function transpileForStatement(
  node: ts.ForStatement,
  typeChecker: ts.TypeChecker,
  indent: string,
): string {
  let init = '';
  if (node.initializer) {
    if (ts.isVariableDeclarationList(node.initializer)) {
      init = node.initializer.declarations
        .map((d) => {
          const name = ts.isIdentifier(d.name) ? `$${toSnakeCase(d.name.text)}` : '$i';
          const value = d.initializer ? transpileExpression(d.initializer, typeChecker) : '0';
          return `${name} = ${value}`;
        })
        .join(', ');
    } else {
      init = transpileExpression(node.initializer, typeChecker);
    }
  }

  const condition = node.condition ? transpileExpression(node.condition, typeChecker) : '';
  const incrementor = node.incrementor ? transpileExpression(node.incrementor, typeChecker) : '';
  const body = transpileStatementBody(node.statement, typeChecker, indent);

  return `${indent}for ( ${init}; ${condition}; ${incrementor} ) {\n${body}\n${indent}}`;
}

function transpileForOfStatement(
  node: ts.ForOfStatement,
  typeChecker: ts.TypeChecker,
  indent: string,
): string {
  const expr = transpileExpression(node.expression, typeChecker);
  const body = transpileStatementBody(node.statement, typeChecker, indent);

  if (ts.isVariableDeclarationList(node.initializer)) {
    const decl = node.initializer.declarations[0];

    // Simple: for (const item of items)
    if (ts.isIdentifier(decl.name)) {
      return `${indent}foreach ( ${expr} as $${toSnakeCase(decl.name.text)} ) {\n${body}\n${indent}}`;
    }

    // Object destructuring: for (const { id, name } of items)
    if (ts.isObjectBindingPattern(decl.name)) {
      const tempVar = '$__item';
      const innerIndent = `${indent}\t`;
      const destructured = decl.name.elements
        .map((el) => {
          if (el.dotDotDotToken) {
            return `${innerIndent}/* WPTS: Rest elements (...) in for-of destructuring are not supported. */`;
          }
          const propName = el.propertyName
            ? ts.isIdentifier(el.propertyName)
              ? el.propertyName.text
              : el.propertyName.getText()
            : ts.isIdentifier(el.name)
              ? el.name.text
              : el.name.getText();
          const varName = ts.isIdentifier(el.name) ? `$${toSnakeCase(el.name.text)}` : '$var';
          if (el.initializer) {
            const defaultVal = transpileExpression(el.initializer, typeChecker);
            return `${innerIndent}${varName} = ${tempVar}['${propName}'] ?? ${defaultVal};`;
          }
          return `${innerIndent}${varName} = ${tempVar}['${propName}'];`;
        })
        .join('\n');
      return `${indent}foreach ( ${expr} as ${tempVar} ) {\n${destructured}\n${body}\n${indent}}`;
    }

    // Array destructuring: for (const [key, val] of entries)
    if (ts.isArrayBindingPattern(decl.name)) {
      const tempVar = '$__item';
      const innerIndent = `${indent}\t`;
      const destructured = decl.name.elements
        .map((el, i) => {
          if (ts.isOmittedExpression(el)) return '';
          const bindEl = el as ts.BindingElement;
          if (bindEl.dotDotDotToken) {
            return `${innerIndent}/* WPTS: Rest elements (...) in for-of destructuring are not supported. */`;
          }
          const varName = ts.isIdentifier(bindEl.name)
            ? `$${toSnakeCase(bindEl.name.text)}`
            : '$var';
          if (bindEl.initializer) {
            const defaultVal = transpileExpression(bindEl.initializer, typeChecker);
            return `${innerIndent}${varName} = ${tempVar}[${i}] ?? ${defaultVal};`;
          }
          return `${innerIndent}${varName} = ${tempVar}[${i}];`;
        })
        .filter(Boolean)
        .join('\n');
      return `${indent}foreach ( ${expr} as ${tempVar} ) {\n${destructured}\n${body}\n${indent}}`;
    }
  }

  return `${indent}foreach ( ${expr} as $item ) {\n${body}\n${indent}}`;
}

function transpileForInStatement(
  node: ts.ForInStatement,
  typeChecker: ts.TypeChecker,
  indent: string,
): string {
  const expr = transpileExpression(node.expression, typeChecker);
  const body = transpileStatementBody(node.statement, typeChecker, indent);

  if (ts.isVariableDeclarationList(node.initializer)) {
    const decl = node.initializer.declarations[0];

    // Simple: for (const key in obj)
    if (ts.isIdentifier(decl.name)) {
      return `${indent}foreach ( ${expr} as $${toSnakeCase(decl.name.text)} => $value ) {\n${body}\n${indent}}`;
    }

    // Array destructuring: for (const [key, val] in obj)
    if (ts.isArrayBindingPattern(decl.name)) {
      const tempKey = '$__key';
      const tempVal = '$__value';
      const innerIndent = `${indent}\t`;
      const elements = decl.name.elements;
      const destructured: string[] = [];
      if (elements.length >= 1 && !ts.isOmittedExpression(elements[0])) {
        const bindEl = elements[0] as ts.BindingElement;
        const varName = ts.isIdentifier(bindEl.name) ? `$${toSnakeCase(bindEl.name.text)}` : '$var';
        destructured.push(`${innerIndent}${varName} = ${tempKey};`);
      }
      if (elements.length >= 2 && !ts.isOmittedExpression(elements[1])) {
        const bindEl = elements[1] as ts.BindingElement;
        const varName = ts.isIdentifier(bindEl.name) ? `$${toSnakeCase(bindEl.name.text)}` : '$var';
        destructured.push(`${innerIndent}${varName} = ${tempVal};`);
      }
      return `${indent}foreach ( ${expr} as ${tempKey} => ${tempVal} ) {\n${destructured.join('\n')}\n${body}\n${indent}}`;
    }
  }

  return `${indent}foreach ( ${expr} as $key => $value ) {\n${body}\n${indent}}`;
}

function transpileWhileStatement(
  node: ts.WhileStatement,
  typeChecker: ts.TypeChecker,
  indent: string,
): string {
  const condition = transpileExpression(node.expression, typeChecker);
  const body = transpileStatementBody(node.statement, typeChecker, indent);
  return `${indent}while ( ${condition} ) {\n${body}\n${indent}}`;
}

function transpileDoWhileStatement(
  node: ts.DoStatement,
  typeChecker: ts.TypeChecker,
  indent: string,
): string {
  const condition = transpileExpression(node.expression, typeChecker);
  const body = transpileStatementBody(node.statement, typeChecker, indent);
  return `${indent}do {\n${body}\n${indent}} while ( ${condition} );`;
}

function transpileSwitchStatement(
  node: ts.SwitchStatement,
  typeChecker: ts.TypeChecker,
  indent: string,
): string {
  const expr = transpileExpression(node.expression, typeChecker);
  const innerIndent = `${indent}\t`;
  const caseIndent = `${innerIndent}    `;

  const cases = node.caseBlock.clauses.map((clause) => {
    if (ts.isCaseClause(clause)) {
      const caseExpr = transpileExpression(clause.expression, typeChecker);
      const stmts = clause.statements
        .map((s) => transpileStatement(s, typeChecker, caseIndent))
        .filter(Boolean)
        .join('\n');
      return `${innerIndent}case ${caseExpr}:\n${stmts}`;
    } else {
      // Default clause
      const stmts = clause.statements
        .map((s) => transpileStatement(s, typeChecker, caseIndent))
        .filter(Boolean)
        .join('\n');
      return `${innerIndent}default:\n${stmts}`;
    }
  });

  return `${indent}switch ( ${expr} ) {\n${cases.join('\n')}\n${indent}}`;
}

function transpileThrowStatement(
  node: ts.ThrowStatement,
  typeChecker: ts.TypeChecker,
  indent: string,
): string {
  if (node.expression) {
    const expr = transpileExpression(node.expression, typeChecker);
    return `${indent}throw ${expr};`;
  }
  return `${indent}throw new \\Exception();`;
}

function transpileTryStatement(
  node: ts.TryStatement,
  typeChecker: ts.TypeChecker,
  indent: string,
): string {
  const tryBody = transpileBlock(node.tryBlock, typeChecker, `${indent}\t`);
  let result = `${indent}try {\n${tryBody}\n${indent}}`;

  if (node.catchClause) {
    const varName = node.catchClause.variableDeclaration
      ? ts.isIdentifier(node.catchClause.variableDeclaration.name)
        ? `$${toSnakeCase((node.catchClause.variableDeclaration.name as ts.Identifier).text)}`
        : '$e'
      : '$e';
    const catchBody = transpileBlock(node.catchClause.block, typeChecker, `${indent}\t`);
    result += ` catch ( \\Exception ${varName} ) {\n${catchBody}\n${indent}}`;
  }

  if (node.finallyBlock) {
    const finallyBody = transpileBlock(node.finallyBlock, typeChecker, `${indent}\t`);
    result += ` finally {\n${finallyBody}\n${indent}}`;
  }

  return result;
}

function transpileEnumDeclaration(
  node: ts.EnumDeclaration,
  typeChecker: ts.TypeChecker,
  indent: string,
): string {
  const enumName = node.name.text;
  const innerIndent = `${indent}\t`;
  const lines: string[] = [];

  lines.push(`${indent}class ${enumName} {`);

  let autoValue = 0;
  for (const member of node.members) {
    const memberName = ts.isIdentifier(member.name)
      ? member.name.text
      : ts.isStringLiteral(member.name)
        ? member.name.text
        : member.name.getText();

    // Convert to UPPER_SNAKE_CASE
    const phpConstName = memberName.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();

    if (member.initializer) {
      const value = transpileExpression(member.initializer, typeChecker);
      lines.push(`${innerIndent}const ${phpConstName} = ${value};`);
      if (ts.isNumericLiteral(member.initializer)) {
        autoValue = parseInt(member.initializer.text, 10) + 1;
      }
    } else {
      lines.push(`${innerIndent}const ${phpConstName} = ${autoValue};`);
      autoValue++;
    }
  }

  lines.push(`${indent}}`);
  return lines.join('\n');
}

/**
 * Helper to transpile a statement that may or may not be a block.
 */
function transpileStatementBody(
  node: ts.Statement,
  typeChecker: ts.TypeChecker,
  indent: string,
): string {
  const innerIndent = `${indent}\t`;
  if (ts.isBlock(node)) {
    return transpileBlock(node, typeChecker, innerIndent);
  }
  return transpileStatement(node, typeChecker, innerIndent);
}
