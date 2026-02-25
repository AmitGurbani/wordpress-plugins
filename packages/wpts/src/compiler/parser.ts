import ts from 'typescript';
import path from 'node:path';

export interface ParseResult {
  program: ts.Program;
  sourceFile: ts.SourceFile;
  typeChecker: ts.TypeChecker;
  diagnostics: readonly ts.Diagnostic[];
}

/**
 * Return all user source files from a compiled program,
 * excluding declaration files (.d.ts) and node_modules.
 */
export function getUserSourceFiles(program: ts.Program): ts.SourceFile[] {
  return program.getSourceFiles().filter(sf =>
    !sf.isDeclarationFile &&
    !sf.fileName.includes('node_modules'),
  );
}

/**
 * Parse a TypeScript source file using the TypeScript Compiler API.
 */
export function parseSourceFile(filePath: string): ParseResult {
  const absolutePath = path.resolve(filePath);

  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
    moduleResolution: ts.ModuleResolutionKind.Node16,
    strict: true,
    esModuleInterop: true,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
    skipLibCheck: true,
    noEmit: true,
  };

  const program = ts.createProgram([absolutePath], compilerOptions);
  const sourceFile = program.getSourceFile(absolutePath);

  if (!sourceFile) {
    throw new Error(`Could not parse source file: ${absolutePath}`);
  }

  const typeChecker = program.getTypeChecker();
  const diagnostics = ts.getPreEmitDiagnostics(program, sourceFile);

  return {
    program,
    sourceFile,
    typeChecker,
    diagnostics,
  };
}

/**
 * Parse TypeScript source from a string (useful for testing).
 */
export function parseSourceString(source: string, fileName: string = 'input.ts'): ParseResult {
  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
    strict: true,
    esModuleInterop: true,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
    skipLibCheck: true,
    noEmit: true,
  };

  const host = ts.createCompilerHost(compilerOptions);
  const originalGetSourceFile = host.getSourceFile.bind(host);

  host.getSourceFile = (name, languageVersion, onError, shouldCreate) => {
    if (name === fileName) {
      return ts.createSourceFile(fileName, source, languageVersion, true);
    }
    return originalGetSourceFile(name, languageVersion, onError, shouldCreate);
  };

  host.fileExists = (name) => {
    if (name === fileName) return true;
    return ts.sys.fileExists(name);
  };

  host.readFile = (name) => {
    if (name === fileName) return source;
    return ts.sys.readFile(name);
  };

  const program = ts.createProgram([fileName], compilerOptions, host);
  const sourceFile = program.getSourceFile(fileName);

  if (!sourceFile) {
    throw new Error(`Could not parse source string`);
  }

  const typeChecker = program.getTypeChecker();
  const diagnostics = ts.getPreEmitDiagnostics(program, sourceFile);

  return {
    program,
    sourceFile,
    typeChecker,
    diagnostics,
  };
}
