import { describe, it, expect } from 'vitest';
import ts from 'typescript';
import { parseSourceString } from '../../../src/compiler/parser.js';

describe('parseSourceString', () => {
  it('parses a simple TypeScript file', () => {
    const source = `const x: number = 42;`;
    const result = parseSourceString(source);

    expect(result.sourceFile).toBeDefined();
    expect(result.program).toBeDefined();
    expect(result.typeChecker).toBeDefined();
  });

  it('parses a class with decorators', () => {
    const source = `
      function Plugin(options: any): ClassDecorator {
        return (target) => {};
      }

      @Plugin({ name: 'Test' })
      class TestPlugin {
        greetingMessage: string = 'Hello';
      }
    `;
    const result = parseSourceString(source);

    expect(result.sourceFile).toBeDefined();

    // Find the class declaration
    let classFound = false;
    ts.forEachChild(result.sourceFile, (node) => {
      if (ts.isClassDeclaration(node) && node.name?.text === 'TestPlugin') {
        classFound = true;
      }
    });
    expect(classFound).toBe(true);
  });

  it('provides type checker', () => {
    const source = `const x: string = "hello";`;
    const result = parseSourceString(source);

    expect(result.typeChecker).toBeDefined();
  });

  it('reports diagnostics for invalid TypeScript', () => {
    const source = `
      const x: number = "not a number";
    `;
    const result = parseSourceString(source);

    // Should have type error diagnostic
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });
});
