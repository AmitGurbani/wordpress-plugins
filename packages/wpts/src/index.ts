// Public API — decorators for user import

export type {
  BuildOptions,
  BuildResult,
  Diagnostic,
  DiagnosticLevel,
  ParseResult,
} from './compiler/index.js';
// Compiler
export {
  build,
  DiagnosticCollection,
  extractDecorators,
  parseSourceFile,
  parseSourceString,
} from './compiler/index.js';
export type { WptsConfig } from './config.js';
// Config
export { loadConfig } from './config.js';
export type {
  AdminPageOptions,
  AjaxHandlerOptions,
  CustomPostTypeOptions,
  CustomTaxonomyOptions,
  DiagnosticsRouteOptions,
  HookOptions,
  PluginOptions,
  RestRouteOptions,
  SettingOptions,
} from './decorators/index.js';
export {
  Action,
  Activate,
  AdminPage,
  AjaxHandler,
  CustomPostType,
  CustomTaxonomy,
  Deactivate,
  DiagnosticsRoute,
  Filter,
  Plugin,
  RestRoute,
  Setting,
  Shortcode,
} from './decorators/index.js';
// IR types
export type {
  ActionIR,
  AdminPageIR,
  AjaxHandlerIR,
  CustomPostTypeIR,
  CustomTaxonomyIR,
  FilterIR,
  FunctionBodyIR,
  HookContext,
  ParameterIR,
  PluginIR,
  PluginMetadata,
  RestRouteIR,
  SettingIR,
  ShortcodeIR,
} from './ir/index.js';

// WordPress API global declarations (activates declare global when imported)
export type { WPGlobals } from './runtime/wp-types.js';
