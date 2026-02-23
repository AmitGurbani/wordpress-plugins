// Public API — decorators for user import
export {
  Plugin,
  Action,
  Filter,
  AdminPage,
  Setting,
  Activate,
  Deactivate,
  Shortcode,
  CustomPostType,
  CustomTaxonomy,
  RestRoute,
  AjaxHandler,
} from './decorators/index.js';

export type {
  PluginOptions,
  HookOptions,
  AdminPageOptions,
  SettingOptions,
  CustomPostTypeOptions,
  CustomTaxonomyOptions,
  RestRouteOptions,
  AjaxHandlerOptions,
} from './decorators/index.js';

// IR types
export type {
  PluginIR,
  PluginMetadata,
  ActionIR,
  FilterIR,
  SettingIR,
  AdminPageIR,
  ShortcodeIR,
  FunctionBodyIR,
  ParameterIR,
  HookContext,
  CustomPostTypeIR,
  CustomTaxonomyIR,
  RestRouteIR,
  AjaxHandlerIR,
} from './ir/index.js';

// Compiler
export { parseSourceFile, parseSourceString } from './compiler/index.js';
export { build } from './compiler/index.js';
export { DiagnosticCollection } from './compiler/index.js';
export { extractDecorators } from './compiler/index.js';
export type { ParseResult, BuildOptions, BuildResult } from './compiler/index.js';
export type { Diagnostic, DiagnosticLevel } from './compiler/index.js';

// Config
export { loadConfig } from './config.js';
export type { WptsConfig } from './config.js';
