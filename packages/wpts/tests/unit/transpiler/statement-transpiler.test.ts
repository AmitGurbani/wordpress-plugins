import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { parseSourceString } from '../../../src/compiler/parser.js';
import {
  transpileBlock,
  transpileStatement,
} from '../../../src/transpiler/statement-transpiler.js';

/**
 * Helper: parse a TS function body and transpile it to PHP.
 */
function transpileBody(body: string): string {
  const source = `function test() {\n${body}\n}`;
  const { sourceFile, typeChecker } = parseSourceString(source);

  let result = '';
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isFunctionDeclaration(node) && node.body) {
      result = transpileBlock(node.body, typeChecker, '    ');
    }
  });
  return result;
}

describe('transpileStatement', () => {
  describe('variable declarations', () => {
    it('transpiles let with initializer', () => {
      const result = transpileBody('let x = 1;');
      expect(result).toBe('    $x = 1;');
    });

    it('transpiles const with string', () => {
      const result = transpileBody('const name = "hello";');
      expect(result).toBe("    $name = 'hello';");
    });

    it('transpiles let without initializer', () => {
      const result = transpileBody('let x: number;');
      expect(result).toBe('    $x = null;');
    });
  });

  describe('return statements', () => {
    it('transpiles return with expression', () => {
      const result = transpileBody('return 42;');
      expect(result).toBe('    return 42;');
    });

    it('transpiles empty return', () => {
      const result = transpileBody('return;');
      expect(result).toBe('    return;');
    });

    it('transpiles return with string', () => {
      const result = transpileBody('return "hello";');
      expect(result).toBe("    return 'hello';");
    });
  });

  describe('if statements', () => {
    it('transpiles simple if', () => {
      const result = transpileBody('if (true) { return 1; }');
      expect(result).toContain('if ( true )');
      expect(result).toContain('return 1;');
    });

    it('transpiles if/else', () => {
      const result = transpileBody('if (true) { return 1; } else { return 2; }');
      expect(result).toContain('if ( true )');
      expect(result).toContain('else');
      expect(result).toContain('return 2;');
    });

    it('transpiles if/else if/else', () => {
      const result = transpileBody(
        'if (true) { return 1; } else if (false) { return 2; } else { return 3; }',
      );
      expect(result).toContain('if ( true )');
      // PHP supports both "elseif" and "else if" — we emit "elseif" which is more common
      expect(result).toContain('if ( false )');
      expect(result).toContain('else');
    });
  });

  describe('for loops', () => {
    it('transpiles C-style for loop', () => {
      const result = transpileBody('for (let i = 0; i < 10; i++) { }');
      expect(result).toContain('for (');
      expect(result).toContain('$i = 0');
      expect(result).toContain('$i < 10');
      expect(result).toContain('$i++');
    });

    it('transpiles for...of to foreach', () => {
      const result = transpileBody('const items = [1, 2]; for (const item of items) { }');
      expect(result).toContain('foreach ( $items as $item )');
    });

    it('transpiles for...in to foreach with keys', () => {
      const result = transpileBody('const obj = {}; for (const key in obj) { }');
      expect(result).toContain('foreach ( $obj as $key => $value )');
    });
  });

  describe('for-of with destructuring', () => {
    it('transpiles for-of with object destructuring', () => {
      const result = transpileBody(
        'const items: any[] = []; for (const { id, name } of items) { const x = id; }',
      );
      expect(result).toContain('foreach ( $items as $__item )');
      expect(result).toContain("$id = $__item['id'];");
      expect(result).toContain("$name = $__item['name'];");
    });

    it('transpiles for-of with array destructuring', () => {
      const result = transpileBody(
        'const entries: any[] = []; for (const [key, val] of entries) { const x = key; }',
      );
      expect(result).toContain('foreach ( $entries as $__item )');
      expect(result).toContain('$key = $__item[0];');
      expect(result).toContain('$val = $__item[1];');
    });

    it('transpiles for-of with destructuring defaults', () => {
      const result = transpileBody(
        'const items: any[] = []; for (const { id, name = "unknown" } of items) { }',
      );
      expect(result).toContain("$name = $__item['name'] ?? 'unknown';");
    });

    it('transpiles for-of with destructuring rename', () => {
      const result = transpileBody(
        'const items: any[] = []; for (const { id: userId } of items) { }',
      );
      expect(result).toContain("$user_id = $__item['id'];");
    });
  });

  describe('enum declarations', () => {
    it('transpiles numeric enum', () => {
      const result = transpileBody('enum Direction { Up, Down, Left, Right }');
      expect(result).toContain('class Direction {');
      expect(result).toContain('const UP = 0;');
      expect(result).toContain('const DOWN = 1;');
      expect(result).toContain('const LEFT = 2;');
      expect(result).toContain('const RIGHT = 3;');
    });

    it('transpiles string enum', () => {
      const result = transpileBody('enum Status { Active = "active", Inactive = "inactive" }');
      expect(result).toContain('class Status {');
      expect(result).toContain("const ACTIVE = 'active';");
      expect(result).toContain("const INACTIVE = 'inactive';");
    });

    it('transpiles enum with explicit numeric values', () => {
      const result = transpileBody('enum Priority { Low = 1, Medium = 5, High = 10 }');
      expect(result).toContain('const LOW = 1;');
      expect(result).toContain('const MEDIUM = 5;');
      expect(result).toContain('const HIGH = 10;');
    });
  });

  describe('while loops', () => {
    it('transpiles while loop', () => {
      const result = transpileBody('while (true) { break; }');
      expect(result).toContain('while ( true )');
      expect(result).toContain('break;');
    });
  });

  describe('switch statements', () => {
    it('transpiles switch/case', () => {
      const result = transpileBody('switch (1) { case 1: break; default: break; }');
      expect(result).toContain('switch ( 1 )');
      expect(result).toContain('case 1:');
      expect(result).toContain('default:');
    });
  });

  describe('try/catch', () => {
    it('transpiles try/catch', () => {
      const result = transpileBody('try { return 1; } catch (e) { return 2; }');
      expect(result).toContain('try {');
      expect(result).toContain('catch ( \\Exception $e )');
    });
  });

  describe('expression statements', () => {
    it('transpiles function calls', () => {
      const source = `declare function getOption(k: string): any;\nfunction test() { getOption("key"); }`;
      const { sourceFile, typeChecker } = parseSourceString(source);

      let result = '';
      ts.forEachChild(sourceFile, (node) => {
        if (ts.isFunctionDeclaration(node) && node.name?.text === 'test' && node.body) {
          result = transpileBlock(node.body, typeChecker, '    ');
        }
      });
      expect(result).toBe("    get_option( 'key' );");
    });
  });

  describe('object destructuring', () => {
    it('transpiles basic object destructuring', () => {
      const result = transpileBody('const obj = { a: 1, b: 2 }; const { a, b } = obj;');
      expect(result).toContain("$a = $obj['a'];");
      expect(result).toContain("$b = $obj['b'];");
    });

    it('transpiles object destructuring with rename', () => {
      const result = transpileBody('const obj = { x: 1 }; const { x: renamed } = obj;');
      expect(result).toContain("$renamed = $obj['x'];");
    });

    it('transpiles object destructuring with default', () => {
      const result = transpileBody('const obj: any = {}; const { a = "default" } = obj;');
      expect(result).toContain("$a = $obj['a'] ?? 'default';");
    });
  });

  describe('array destructuring', () => {
    it('transpiles basic array destructuring', () => {
      const result = transpileBody('const arr = [1, 2, 3]; const [a, b] = arr;');
      expect(result).toContain('$a = $arr[0];');
      expect(result).toContain('$b = $arr[1];');
    });

    it('transpiles array destructuring with skipped elements', () => {
      const result = transpileBody('const arr = [1, 2, 3]; const [a, , c] = arr;');
      expect(result).toContain('$a = $arr[0];');
      expect(result).toContain('$c = $arr[2];');
      expect(result).not.toContain('$arr[1]');
    });

    it('transpiles array destructuring with default', () => {
      const result = transpileBody('const arr: any[] = []; const [a = 10] = arr;');
      expect(result).toContain('$a = $arr[0] ?? 10;');
    });
  });

  describe('complete function bodies', () => {
    it('transpiles a multi-statement function', () => {
      const result = transpileBody(`
        const message = "Hello";
        const count = 0;
        if (count > 0) {
          return message;
        }
        return "default";
      `);

      expect(result).toContain("$message = 'Hello';");
      expect(result).toContain('$count = 0;');
      expect(result).toContain('if ( $count > 0 )');
      expect(result).toContain('return $message;');
      expect(result).toContain("return 'default';");
    });
  });
});
