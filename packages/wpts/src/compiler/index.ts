export { extractDecorators, extractDecoratorsFromFiles } from './decorator-extractor.js';
export type { Diagnostic, DiagnosticLevel } from './diagnostics.js';
export { DiagnosticCollection } from './diagnostics.js';
export type { ParseResult } from './parser.js';
export { getUserSourceFiles, parseSourceFile, parseSourceString } from './parser.js';
export type { BuildOptions, BuildResult } from './pipeline.js';
export { build } from './pipeline.js';
