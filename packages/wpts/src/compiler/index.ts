export { parseSourceFile, parseSourceString } from './parser.js';
export type { ParseResult } from './parser.js';
export { DiagnosticCollection } from './diagnostics.js';
export type { Diagnostic, DiagnosticLevel } from './diagnostics.js';
export { extractDecorators } from './decorator-extractor.js';
export { build } from './pipeline.js';
export type { BuildOptions, BuildResult } from './pipeline.js';
