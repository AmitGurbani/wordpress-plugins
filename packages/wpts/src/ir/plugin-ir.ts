import type ts from 'typescript';

/**
 * Intermediate Representation (IR) for a WordPress plugin.
 * This is the contract between the parser/extractor and the generators.
 */

export interface PluginIR {
  metadata: PluginMetadata;
  settings: SettingIR[];
  actions: ActionIR[];
  filters: FilterIR[];
  adminPages: AdminPageIR[];
  shortcodes: ShortcodeIR[];
  customPostTypes: CustomPostTypeIR[];
  customTaxonomies: CustomTaxonomyIR[];
  restRoutes: RestRouteIR[];
  ajaxHandlers: AjaxHandlerIR[];
  activation: FunctionBodyIR | null;
  deactivation: FunctionBodyIR | null;
}

export interface PluginMetadata {
  name: string;
  slug: string;
  uri: string;
  description: string;
  version: string;
  author: string;
  authorUri: string;
  license: string;
  licenseUri: string;
  textDomain: string;
  domainPath: string;
  requiresWP: string;
  requiresPHP: string;
  // Derived names
  className: string;
  constantPrefix: string;
  functionPrefix: string;
  filePrefix: string;
}

export interface ActionIR {
  hookName: string;
  methodName: string;
  phpMethodName: string;
  priority: number;
  acceptedArgs: number;
  body: FunctionBodyIR;
  context: HookContext;
}

export interface FilterIR {
  hookName: string;
  methodName: string;
  phpMethodName: string;
  priority: number;
  acceptedArgs: number;
  parameters: ParameterIR[];
  body: FunctionBodyIR;
  context: HookContext;
}

export interface SettingIR {
  propertyName: string;
  key: string;
  optionName: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  default: unknown;
  label: string;
  description: string;
  sanitize: string | null;
}

export interface AdminPageIR {
  pageTitle: string;
  menuTitle: string;
  capability: string;
  menuSlug: string;
  iconUrl: string;
  position: number | null;
  parentSlug: string | null;
}

export interface ShortcodeIR {
  tag: string;
  methodName: string;
  phpMethodName: string;
  parameters: ParameterIR[];
  body: FunctionBodyIR;
}

export interface CustomPostTypeIR {
  slug: string;
  singularName: string;
  pluralName: string;
  description: string;
  public: boolean;
  showInRest: boolean;
  hasArchive: boolean;
  supports: string[];
  menuIcon: string;
  menuPosition: number | null;
  rewriteSlug: string | null;
  capabilityType: string;
  taxonomies: string[];
}

export interface CustomTaxonomyIR {
  slug: string;
  singularName: string;
  pluralName: string;
  postTypes: string[];
  description: string;
  public: boolean;
  showInRest: boolean;
  hierarchical: boolean;
  showAdminColumn: boolean;
  rewriteSlug: string | null;
}

export interface RestRouteIR {
  route: string;
  method: string;
  capability: string;
  methodName: string;
  phpMethodName: string;
  body: FunctionBodyIR;
}

export interface AjaxHandlerIR {
  action: string;
  public: boolean;
  capability: string;
  nonce: boolean;
  methodName: string;
  phpMethodName: string;
  body: FunctionBodyIR;
}

export interface FunctionBodyIR {
  phpCode: string;
  sourceText: string;
}

export interface ParameterIR {
  name: string;
  phpName: string;
  type: string;
  defaultValue: string | null;
}

export type HookContext = 'admin' | 'public' | 'both';

/**
 * Raw decorator data extracted from AST before processing into IR.
 */
export interface RawPluginData {
  plugin: RawPluginDecorator | null;
  settings: RawSettingDecorator[];
  actions: RawActionDecorator[];
  filters: RawFilterDecorator[];
  adminPages: RawAdminPageDecorator[];
  shortcodes: RawShortcodeDecorator[];
  customPostTypes: RawCustomPostTypeDecorator[];
  customTaxonomies: RawCustomTaxonomyDecorator[];
  restRoutes: RawRestRouteDecorator[];
  ajaxHandlers: RawAjaxHandlerDecorator[];
  activation: RawLifecycleDecorator | null;
  deactivation: RawLifecycleDecorator | null;
}

export interface RawPluginDecorator {
  name: string;
  slug?: string;
  uri?: string;
  description: string;
  version: string;
  author: string;
  authorUri?: string;
  license: string;
  licenseUri?: string;
  textDomain?: string;
  domainPath?: string;
  requiresWP?: string;
  requiresPHP?: string;
}

export interface RawActionDecorator {
  hookName: string;
  priority?: number;
  acceptedArgs?: number;
  methodName: string;
  bodyNode: ts.Node;
}

export interface RawFilterDecorator {
  hookName: string;
  priority?: number;
  acceptedArgs?: number;
  methodName: string;
  parameters: { name: string; type: string; defaultValue?: string }[];
  bodyNode: ts.Node;
}

export interface RawSettingDecorator {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  default: unknown;
  label: string;
  description?: string;
  sanitize?: string;
  propertyName: string;
}

export interface RawAdminPageDecorator {
  pageTitle: string;
  menuTitle: string;
  capability: string;
  menuSlug: string;
  iconUrl?: string;
  position?: number;
  parentSlug?: string;
}

export interface RawShortcodeDecorator {
  tag: string;
  methodName: string;
  parameters: { name: string; type: string; defaultValue?: string }[];
  bodyNode: ts.Node;
}

export interface RawLifecycleDecorator {
  methodName: string;
  bodyNode: ts.Node;
}

export interface RawCustomPostTypeDecorator {
  slug: string;
  singularName: string;
  pluralName: string;
  description?: string;
  public?: boolean;
  showInRest?: boolean;
  hasArchive?: boolean;
  supports?: string[];
  menuIcon?: string;
  menuPosition?: number;
  rewriteSlug?: string;
  capabilityType?: string;
}

export interface RawCustomTaxonomyDecorator {
  slug: string;
  singularName: string;
  pluralName: string;
  postTypes: string[];
  description?: string;
  public?: boolean;
  showInRest?: boolean;
  hierarchical?: boolean;
  showAdminColumn?: boolean;
  rewriteSlug?: string;
}

export interface RawRestRouteDecorator {
  route: string;
  method: string;
  capability: string;
  methodName: string;
  bodyNode: ts.Node;
}

export interface RawAjaxHandlerDecorator {
  action: string;
  public: boolean;
  capability: string;
  nonce: boolean;
  methodName: string;
  bodyNode: ts.Node;
}
