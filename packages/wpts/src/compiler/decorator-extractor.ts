import ts from 'typescript';
import type {
  RawActionDecorator,
  RawAdminPageDecorator,
  RawAjaxHandlerDecorator,
  RawCustomPostTypeDecorator,
  RawCustomTaxonomyDecorator,
  RawDiagnosticsRouteDecorator,
  RawFilterDecorator,
  RawPluginData,
  RawPluginDecorator,
  RawRestRouteDecorator,
  RawSettingDecorator,
  RawShortcodeDecorator,
} from '../ir/plugin-ir.js';
import type { DiagnosticCollection } from './diagnostics.js';

function createEmptyRawData(): RawPluginData {
  return {
    plugin: null,
    settings: [],
    actions: [],
    filters: [],
    adminPages: [],
    shortcodes: [],
    customPostTypes: [],
    customTaxonomies: [],
    restRoutes: [],
    ajaxHandlers: [],
    helperMethods: [],
    activation: null,
    deactivation: null,
    diagnosticsRoute: null,
  };
}

/**
 * Walk a single source file and accumulate decorator data into result.
 * Does NOT check for @Plugin presence — that's the caller's responsibility.
 */
function walkFileDecorators(
  sourceFile: ts.SourceFile,
  result: RawPluginData,
  typeChecker: ts.TypeChecker,
  diagnostics: DiagnosticCollection,
): void {
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isClassDeclaration(node)) {
      extractClassDecorators(node, result, typeChecker, diagnostics, sourceFile);
    }
  });
}

/**
 * Extract all decorator metadata from a parsed TypeScript source file.
 */
export function extractDecorators(
  sourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker,
  diagnostics: DiagnosticCollection,
): RawPluginData {
  const result = createEmptyRawData();

  walkFileDecorators(sourceFile, result, typeChecker, diagnostics);

  if (!result.plugin) {
    diagnostics.error(
      'WPTS001',
      'No @Plugin decorator found. One class must be decorated with @Plugin.',
      { file: sourceFile.fileName },
      'Add @Plugin({ name: "My Plugin", ... }) to your plugin class.',
    );
  }

  return result;
}

/**
 * Extract decorator metadata from multiple source files.
 * Merges all decorators into a single RawPluginData and validates
 * that exactly one @Plugin decorator exists across all files.
 */
export function extractDecoratorsFromFiles(
  sourceFiles: ts.SourceFile[],
  typeChecker: ts.TypeChecker,
  diagnostics: DiagnosticCollection,
): RawPluginData {
  const result = createEmptyRawData();

  for (const sf of sourceFiles) {
    walkFileDecorators(sf, result, typeChecker, diagnostics);
  }

  if (!result.plugin) {
    const fileNames = sourceFiles.map((sf) => sf.fileName).join(', ');
    diagnostics.error(
      'WPTS001',
      'No @Plugin decorator found. One class must be decorated with @Plugin.',
      { file: fileNames },
      'Add @Plugin({ name: "My Plugin", ... }) to your plugin class.',
    );
  }

  return result;
}

function extractClassDecorators(
  classNode: ts.ClassDeclaration,
  result: RawPluginData,
  typeChecker: ts.TypeChecker,
  diagnostics: DiagnosticCollection,
  sourceFile: ts.SourceFile,
): void {
  const decorators = getDecorators(classNode);

  for (const decorator of decorators) {
    const name = getDecoratorName(decorator);

    if (name === 'Plugin') {
      if (result.plugin) {
        diagnostics.error(
          'WPTS002',
          'Multiple @Plugin decorators found. Only one is allowed.',
          getLocation(decorator, sourceFile),
        );
        continue;
      }
      result.plugin = extractPluginDecorator(decorator, diagnostics, sourceFile);
    } else if (name === 'AdminPage') {
      const adminPage = extractAdminPageDecorator(decorator, diagnostics, sourceFile);
      if (adminPage) result.adminPages.push(adminPage);
    } else if (name === 'CustomPostType') {
      const cpt = extractCustomPostTypeDecorator(decorator, diagnostics, sourceFile);
      if (cpt) result.customPostTypes.push(cpt);
    } else if (name === 'CustomTaxonomy') {
      const tax = extractCustomTaxonomyDecorator(decorator, diagnostics, sourceFile);
      if (tax) result.customTaxonomies.push(tax);
    } else if (name === 'DiagnosticsRoute') {
      result.diagnosticsRoute = extractDiagnosticsRouteDecorator(decorator);
    }
  }

  // Track helper methods count before this class, to tag them with context after
  const helperCountBefore = result.helperMethods.length;
  let hasRestRoutes = false;

  // Walk class members
  for (const member of classNode.members) {
    if (ts.isMethodDeclaration(member)) {
      // Check if this method has @RestRoute to determine class context
      const memberDecorators = getDecorators(member);
      for (const d of memberDecorators) {
        if (getDecoratorName(d) === 'RestRoute') {
          hasRestRoutes = true;
        }
      }
      extractMethodDecorators(member, result, typeChecker, diagnostics, sourceFile);
    } else if (ts.isPropertyDeclaration(member)) {
      extractPropertyDecorators(member, result, diagnostics, sourceFile);
    }
  }

  // Tag newly added helper methods with the correct context
  // If the class has @RestRoute methods, helpers belong to the REST API class
  const context = hasRestRoutes ? 'rest' : 'public';
  for (let i = helperCountBefore; i < result.helperMethods.length; i++) {
    (result.helperMethods[i] as any).context = context;
  }
}

function extractMethodDecorators(
  method: ts.MethodDeclaration,
  result: RawPluginData,
  typeChecker: ts.TypeChecker,
  diagnostics: DiagnosticCollection,
  sourceFile: ts.SourceFile,
): void {
  const decorators = getDecorators(method);
  const methodName = method.name && ts.isIdentifier(method.name) ? method.name.text : '';

  // If method has no decorators, capture it as a helper method
  if (decorators.length === 0) {
    if (methodName && method.body) {
      const parameters = extractParameters(method, typeChecker);
      result.helperMethods.push({
        methodName,
        parameters,
        bodyNode: method.body ?? method,
      });
    }
    return;
  }

  for (const decorator of decorators) {
    const name = getDecoratorName(decorator);

    switch (name) {
      case 'Action': {
        const action = extractActionDecorator(
          decorator,
          methodName,
          method,
          typeChecker,
          diagnostics,
          sourceFile,
        );
        if (action) result.actions.push(action);
        break;
      }
      case 'Filter': {
        const filter = extractFilterDecorator(
          decorator,
          methodName,
          method,
          typeChecker,
          diagnostics,
          sourceFile,
        );
        if (filter) result.filters.push(filter);
        break;
      }
      case 'AdminPage': {
        const adminPage = extractAdminPageDecorator(decorator, diagnostics, sourceFile);
        if (adminPage) result.adminPages.push(adminPage);
        break;
      }
      case 'Shortcode': {
        const shortcode = extractShortcodeDecorator(
          decorator,
          methodName,
          method,
          typeChecker,
          diagnostics,
          sourceFile,
        );
        if (shortcode) result.shortcodes.push(shortcode);
        break;
      }
      case 'RestRoute': {
        const route = extractRestRouteDecorator(
          decorator,
          methodName,
          method,
          diagnostics,
          sourceFile,
        );
        if (route) result.restRoutes.push(route);
        break;
      }
      case 'AjaxHandler': {
        const ajax = extractAjaxHandlerDecorator(
          decorator,
          methodName,
          method,
          diagnostics,
          sourceFile,
        );
        if (ajax) result.ajaxHandlers.push(ajax);
        break;
      }
      case 'Activate': {
        if (result.activation) {
          diagnostics.warning(
            'WPTS003',
            'Multiple @Activate decorators found. Only the last one will be used.',
            getLocation(decorator, sourceFile),
          );
        }
        result.activation = { methodName, bodyNode: method.body ?? method };
        break;
      }
      case 'Deactivate': {
        if (result.deactivation) {
          diagnostics.warning(
            'WPTS004',
            'Multiple @Deactivate decorators found. Only the last one will be used.',
            getLocation(decorator, sourceFile),
          );
        }
        result.deactivation = { methodName, bodyNode: method.body ?? method };
        break;
      }
    }
  }
}

function extractPropertyDecorators(
  property: ts.PropertyDeclaration,
  result: RawPluginData,
  diagnostics: DiagnosticCollection,
  sourceFile: ts.SourceFile,
): void {
  const decorators = getDecorators(property);
  const propertyName = property.name && ts.isIdentifier(property.name) ? property.name.text : '';

  for (const decorator of decorators) {
    const name = getDecoratorName(decorator);

    if (name === 'Setting') {
      const setting = extractSettingDecorator(decorator, propertyName, diagnostics, sourceFile);
      if (setting) result.settings.push(setting);
    }
  }
}

// --- Individual decorator extractors ---

function extractPluginDecorator(
  decorator: ts.Decorator,
  diagnostics: DiagnosticCollection,
  sourceFile: ts.SourceFile,
): RawPluginDecorator | null {
  const args = getDecoratorArgs(decorator);
  if (!args || args.length === 0) {
    diagnostics.error(
      'WPTS010',
      '@Plugin requires an options object argument.',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  const obj = extractObjectLiteral(args[0]);
  if (!obj) {
    diagnostics.error(
      'WPTS011',
      '@Plugin argument must be an object literal.',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  const name = getStringProp(obj, 'name');
  if (!name) {
    diagnostics.error(
      'WPTS012',
      '@Plugin requires a "name" property.',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  const wooNotice = getStringProp(obj, 'wooNotice') as 'recommended' | 'required' | undefined;

  const githubRepo = getStringProp(obj, 'githubRepo');
  const updateUri = getStringProp(obj, 'updateUri');

  if (githubRepo && !/^[^/\s]+\/[^/\s]+$/.test(githubRepo)) {
    diagnostics.error(
      'WPTS013',
      `@Plugin "githubRepo" must be "<owner>/<repo>", got "${githubRepo}".`,
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  if (updateUri) {
    if (!githubRepo) {
      diagnostics.error(
        'WPTS015',
        '@Plugin "updateUri" requires "githubRepo" to be set.',
        getLocation(decorator, sourceFile),
      );
      return null;
    }
    let host: string;
    try {
      host = new URL(updateUri).hostname;
    } catch {
      diagnostics.error(
        'WPTS014',
        `@Plugin "updateUri" must be a valid URL, got "${updateUri}".`,
        getLocation(decorator, sourceFile),
      );
      return null;
    }
    if (host === 'wordpress.org' || host === 'w.org' || host.endsWith('.wordpress.org')) {
      diagnostics.error(
        'WPTS014',
        '@Plugin "updateUri" hostname must not be wordpress.org (WP core short-circuits to its own update path).',
        getLocation(decorator, sourceFile),
      );
      return null;
    }
  }

  return {
    name,
    slug: getStringProp(obj, 'slug'),
    uri: getStringProp(obj, 'uri'),
    description: getStringProp(obj, 'description') ?? '',
    version: getStringProp(obj, 'version') ?? '1.0.0',
    author: getStringProp(obj, 'author') ?? '',
    authorUri: getStringProp(obj, 'authorUri'),
    license: getStringProp(obj, 'license') ?? 'GPL-2.0+',
    licenseUri: getStringProp(obj, 'licenseUri'),
    textDomain: getStringProp(obj, 'textDomain'),
    domainPath: getStringProp(obj, 'domainPath'),
    requiresWP: getStringProp(obj, 'requiresWP'),
    requiresPHP: getStringProp(obj, 'requiresPHP'),
    wooNotice,
    githubRepo,
    updateUri,
  };
}

function extractActionDecorator(
  decorator: ts.Decorator,
  methodName: string,
  method: ts.MethodDeclaration,
  typeChecker: ts.TypeChecker,
  diagnostics: DiagnosticCollection,
  sourceFile: ts.SourceFile,
): RawActionDecorator | null {
  const args = getDecoratorArgs(decorator);
  if (!args || args.length === 0) {
    diagnostics.error(
      'WPTS020',
      '@Action requires a hook name argument.',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  const hookName = getStringValue(args[0]);
  if (!hookName) {
    diagnostics.error(
      'WPTS021',
      '@Action first argument must be a string literal (hook name).',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  let priority = 10;
  let acceptedArgs: number | undefined;

  if (args.length > 1) {
    const opts = extractObjectLiteral(args[1]);
    if (opts) {
      priority = getNumberProp(opts, 'priority') ?? 10;
      acceptedArgs = getNumberProp(opts, 'acceptedArgs') ?? undefined;
    }
  }

  const parameters = extractParameters(method, typeChecker);

  return {
    hookName,
    priority,
    acceptedArgs: acceptedArgs ?? parameters.length,
    methodName,
    parameters,
    bodyNode: method.body ?? method,
  };
}

function extractFilterDecorator(
  decorator: ts.Decorator,
  methodName: string,
  method: ts.MethodDeclaration,
  typeChecker: ts.TypeChecker,
  diagnostics: DiagnosticCollection,
  sourceFile: ts.SourceFile,
): RawFilterDecorator | null {
  const args = getDecoratorArgs(decorator);
  if (!args || args.length === 0) {
    diagnostics.error(
      'WPTS030',
      '@Filter requires a hook name argument.',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  const hookName = getStringValue(args[0]);
  if (!hookName) {
    diagnostics.error(
      'WPTS031',
      '@Filter first argument must be a string literal (hook name).',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  let priority = 10;
  let acceptedArgs: number | undefined;

  if (args.length > 1) {
    const opts = extractObjectLiteral(args[1]);
    if (opts) {
      priority = getNumberProp(opts, 'priority') ?? 10;
      acceptedArgs = getNumberProp(opts, 'acceptedArgs') ?? undefined;
    }
  }

  const parameters = extractParameters(method, typeChecker);

  return {
    hookName,
    priority,
    acceptedArgs: acceptedArgs ?? parameters.length,
    methodName,
    parameters,
    bodyNode: method.body ?? method,
  };
}

function extractSettingDecorator(
  decorator: ts.Decorator,
  propertyName: string,
  diagnostics: DiagnosticCollection,
  sourceFile: ts.SourceFile,
): RawSettingDecorator | null {
  const args = getDecoratorArgs(decorator);
  if (!args || args.length === 0) {
    diagnostics.error(
      'WPTS040',
      '@Setting requires an options object argument.',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  const obj = extractObjectLiteral(args[0]);
  if (!obj) {
    diagnostics.error(
      'WPTS041',
      '@Setting argument must be an object literal.',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  const key = getStringProp(obj, 'key');
  if (!key) {
    diagnostics.error(
      'WPTS042',
      '@Setting requires a "key" property.',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  const typeVal = getStringProp(obj, 'type') as
    | 'string'
    | 'number'
    | 'boolean'
    | 'array'
    | 'url'
    | null;

  return {
    key,
    type: typeVal ?? 'string',
    default: getLiteralProp(obj, 'default'),
    label: getStringProp(obj, 'label') ?? key,
    description: getStringProp(obj, 'description'),
    sanitize: getStringProp(obj, 'sanitize'),
    sensitive: getBooleanProp(obj, 'sensitive') ?? false,
    exposeInConfig: getBooleanProp(obj, 'exposeInConfig') ?? false,
    wooCurrencyDefault: getBooleanProp(obj, 'wooCurrencyDefault') ?? false,
    propertyName,
  };
}

function extractAdminPageDecorator(
  decorator: ts.Decorator,
  diagnostics: DiagnosticCollection,
  sourceFile: ts.SourceFile,
): RawAdminPageDecorator | null {
  const args = getDecoratorArgs(decorator);
  if (!args || args.length === 0) {
    diagnostics.error(
      'WPTS050',
      '@AdminPage requires an options object argument.',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  const obj = extractObjectLiteral(args[0]);
  if (!obj) {
    diagnostics.error(
      'WPTS051',
      '@AdminPage argument must be an object literal.',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  return {
    pageTitle: getStringProp(obj, 'pageTitle') ?? '',
    menuTitle: getStringProp(obj, 'menuTitle') ?? '',
    capability: getStringProp(obj, 'capability') ?? 'manage_options',
    menuSlug: getStringProp(obj, 'menuSlug') ?? '',
    iconUrl: getStringProp(obj, 'iconUrl'),
    position: getNumberProp(obj, 'position'),
    parentSlug: getStringProp(obj, 'parentSlug'),
  };
}

function extractShortcodeDecorator(
  decorator: ts.Decorator,
  methodName: string,
  method: ts.MethodDeclaration,
  typeChecker: ts.TypeChecker,
  diagnostics: DiagnosticCollection,
  sourceFile: ts.SourceFile,
): RawShortcodeDecorator | null {
  const args = getDecoratorArgs(decorator);
  if (!args || args.length === 0) {
    diagnostics.error(
      'WPTS060',
      '@Shortcode requires a tag name argument.',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  const tag = getStringValue(args[0]);
  if (!tag) {
    diagnostics.error(
      'WPTS061',
      '@Shortcode first argument must be a string literal (tag name).',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  const parameters = extractParameters(method, typeChecker);

  return {
    tag,
    methodName,
    parameters,
    bodyNode: method.body ?? method,
  };
}

function extractCustomPostTypeDecorator(
  decorator: ts.Decorator,
  diagnostics: DiagnosticCollection,
  sourceFile: ts.SourceFile,
): RawCustomPostTypeDecorator | null {
  const args = getDecoratorArgs(decorator);
  if (!args || args.length < 2) {
    diagnostics.error(
      'WPTS070',
      '@CustomPostType requires a slug and an options object.',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  const slug = getStringValue(args[0]);
  if (!slug) {
    diagnostics.error(
      'WPTS071',
      '@CustomPostType first argument must be a string literal (slug).',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  const obj = extractObjectLiteral(args[1]);
  if (!obj) {
    diagnostics.error(
      'WPTS072',
      '@CustomPostType second argument must be an object literal.',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  const singularName = getStringProp(obj, 'singularName');
  if (!singularName) {
    diagnostics.error(
      'WPTS073',
      '@CustomPostType requires a "singularName" property.',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  const pluralName = getStringProp(obj, 'pluralName');
  if (!pluralName) {
    diagnostics.error(
      'WPTS074',
      '@CustomPostType requires a "pluralName" property.',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  return {
    slug,
    singularName,
    pluralName,
    description: getStringProp(obj, 'description'),
    public: getBooleanProp(obj, 'public'),
    showInRest: getBooleanProp(obj, 'showInRest'),
    hasArchive: getBooleanProp(obj, 'hasArchive'),
    supports: getStringArrayProp(obj, 'supports'),
    menuIcon: getStringProp(obj, 'menuIcon'),
    menuPosition: getNumberProp(obj, 'menuPosition'),
    rewriteSlug: getStringProp(obj, 'rewriteSlug'),
    capabilityType: getStringProp(obj, 'capabilityType'),
  };
}

function extractCustomTaxonomyDecorator(
  decorator: ts.Decorator,
  diagnostics: DiagnosticCollection,
  sourceFile: ts.SourceFile,
): RawCustomTaxonomyDecorator | null {
  const args = getDecoratorArgs(decorator);
  if (!args || args.length < 2) {
    diagnostics.error(
      'WPTS080',
      '@CustomTaxonomy requires a slug and an options object.',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  const slug = getStringValue(args[0]);
  if (!slug) {
    diagnostics.error(
      'WPTS081',
      '@CustomTaxonomy first argument must be a string literal (slug).',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  const obj = extractObjectLiteral(args[1]);
  if (!obj) {
    diagnostics.error(
      'WPTS082',
      '@CustomTaxonomy second argument must be an object literal.',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  const singularName = getStringProp(obj, 'singularName');
  if (!singularName) {
    diagnostics.error(
      'WPTS083',
      '@CustomTaxonomy requires a "singularName" property.',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  const pluralName = getStringProp(obj, 'pluralName');
  if (!pluralName) {
    diagnostics.error(
      'WPTS084',
      '@CustomTaxonomy requires a "pluralName" property.',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  const postTypes = getStringArrayProp(obj, 'postTypes');
  if (!postTypes || postTypes.length === 0) {
    diagnostics.error(
      'WPTS085',
      '@CustomTaxonomy requires a "postTypes" property.',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  return {
    slug,
    singularName,
    pluralName,
    postTypes,
    description: getStringProp(obj, 'description'),
    public: getBooleanProp(obj, 'public'),
    showInRest: getBooleanProp(obj, 'showInRest'),
    hierarchical: getBooleanProp(obj, 'hierarchical'),
    showAdminColumn: getBooleanProp(obj, 'showAdminColumn'),
    rewriteSlug: getStringProp(obj, 'rewriteSlug'),
  };
}

function extractRestRouteDecorator(
  decorator: ts.Decorator,
  methodName: string,
  method: ts.MethodDeclaration,
  diagnostics: DiagnosticCollection,
  sourceFile: ts.SourceFile,
): RawRestRouteDecorator | null {
  const args = getDecoratorArgs(decorator);
  if (!args || args.length < 2) {
    diagnostics.error(
      'WPTS090',
      '@RestRoute requires a route path and an options object.',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  const route = getStringValue(args[0]);
  if (!route) {
    diagnostics.error(
      'WPTS091',
      '@RestRoute first argument must be a string literal (route path).',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  const obj = extractObjectLiteral(args[1]);
  if (!obj) {
    diagnostics.error(
      'WPTS092',
      '@RestRoute second argument must be an object literal.',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  const httpMethod = getStringProp(obj, 'method');
  if (!httpMethod) {
    diagnostics.error(
      'WPTS093',
      '@RestRoute requires a "method" property (GET, POST, PUT, DELETE).',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  return {
    route,
    method: httpMethod,
    capability: getStringProp(obj, 'capability') ?? 'manage_options',
    public: getBooleanProp(obj, 'public') ?? false,
    methodName,
    bodyNode: method.body ?? method,
  };
}

function extractAjaxHandlerDecorator(
  decorator: ts.Decorator,
  methodName: string,
  method: ts.MethodDeclaration,
  diagnostics: DiagnosticCollection,
  sourceFile: ts.SourceFile,
): RawAjaxHandlerDecorator | null {
  const args = getDecoratorArgs(decorator);
  if (!args || args.length === 0) {
    diagnostics.error(
      'WPTS095',
      '@AjaxHandler requires an action name argument.',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  const action = getStringValue(args[0]);
  if (!action) {
    diagnostics.error(
      'WPTS096',
      '@AjaxHandler first argument must be a string literal (action name).',
      getLocation(decorator, sourceFile),
    );
    return null;
  }

  let isPublic = false;
  let capability = 'manage_options';
  let nonce = true;

  if (args.length > 1) {
    const opts = extractObjectLiteral(args[1]);
    if (opts) {
      isPublic = getBooleanProp(opts, 'public') ?? false;
      capability = getStringProp(opts, 'capability') ?? 'manage_options';
      nonce = getBooleanProp(opts, 'nonce') ?? true;
    }
  }

  return {
    action,
    public: isPublic,
    capability,
    nonce,
    methodName,
    bodyNode: method.body ?? method,
  };
}

function extractDiagnosticsRouteDecorator(decorator: ts.Decorator): RawDiagnosticsRouteDecorator {
  const args = getDecoratorArgs(decorator);
  let errorOptionSuffix = 'last_error';

  if (args && args.length > 0) {
    const obj = extractObjectLiteral(args[0]);
    if (obj) {
      errorOptionSuffix = getStringProp(obj, 'errorOptionSuffix') ?? 'last_error';
    }
  }

  return { errorOptionSuffix };
}

// --- AST utility helpers ---

function getDecorators(node: ts.Node): ts.Decorator[] {
  // TypeScript 5.x uses ts.getDecorators() or node.modifiers
  if (ts.canHaveDecorators(node)) {
    return (ts.getDecorators(node) ?? []) as ts.Decorator[];
  }
  return [];
}

function getDecoratorName(decorator: ts.Decorator): string | null {
  const expr = decorator.expression;

  // @Plugin — identifier
  if (ts.isIdentifier(expr)) {
    return expr.text;
  }

  // @Plugin({...}) — call expression
  if (ts.isCallExpression(expr) && ts.isIdentifier(expr.expression)) {
    return expr.expression.text;
  }

  return null;
}

function getDecoratorArgs(decorator: ts.Decorator): readonly ts.Expression[] | null {
  const expr = decorator.expression;

  if (ts.isCallExpression(expr)) {
    return expr.arguments;
  }

  return null;
}

function extractObjectLiteral(expr: ts.Expression): ts.ObjectLiteralExpression | null {
  if (ts.isObjectLiteralExpression(expr)) {
    return expr;
  }
  return null;
}

function getStringProp(obj: ts.ObjectLiteralExpression, name: string): string | undefined {
  for (const prop of obj.properties) {
    if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === name) {
      return getStringValue(prop.initializer) ?? undefined;
    }
  }
  return undefined;
}

function getNumberProp(obj: ts.ObjectLiteralExpression, name: string): number | undefined {
  for (const prop of obj.properties) {
    if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === name) {
      if (ts.isNumericLiteral(prop.initializer)) {
        return parseFloat(prop.initializer.text);
      }
    }
  }
  return undefined;
}

function getLiteralProp(obj: ts.ObjectLiteralExpression, name: string): unknown {
  for (const prop of obj.properties) {
    if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === name) {
      return getLiteralValue(prop.initializer);
    }
  }
  return undefined;
}

function getStringValue(expr: ts.Expression): string | null {
  if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
    return expr.text;
  }
  return null;
}

function getLiteralValue(expr: ts.Expression): unknown {
  if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
    return expr.text;
  }
  if (ts.isNumericLiteral(expr)) {
    return parseFloat(expr.text);
  }
  if (expr.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }
  if (expr.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }
  if (expr.kind === ts.SyntaxKind.NullKeyword) {
    return null;
  }
  return undefined;
}

function getBooleanProp(obj: ts.ObjectLiteralExpression, name: string): boolean | undefined {
  for (const prop of obj.properties) {
    if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === name) {
      if (prop.initializer.kind === ts.SyntaxKind.TrueKeyword) return true;
      if (prop.initializer.kind === ts.SyntaxKind.FalseKeyword) return false;
    }
  }
  return undefined;
}

function getStringArrayProp(obj: ts.ObjectLiteralExpression, name: string): string[] | undefined {
  for (const prop of obj.properties) {
    if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === name) {
      if (ts.isArrayLiteralExpression(prop.initializer)) {
        return prop.initializer.elements
          .map((el) => getStringValue(el))
          .filter((v): v is string => v !== null);
      }
      const single = getStringValue(prop.initializer);
      if (single) return [single];
    }
  }
  return undefined;
}

function extractParameters(
  method: ts.MethodDeclaration,
  typeChecker: ts.TypeChecker,
): { name: string; type: string; defaultValue?: string }[] {
  return method.parameters.map((param) => {
    const name = ts.isIdentifier(param.name) ? param.name.text : 'param';
    let type = 'any';

    if (param.type) {
      type = param.type.getText();
    } else {
      // Try to infer from type checker
      const symbol = typeChecker.getSymbolAtLocation(param.name);
      if (symbol) {
        const inferredType = typeChecker.getTypeOfSymbolAtLocation(symbol, param);
        type = typeChecker.typeToString(inferredType);
      }
    }

    let defaultValue: string | undefined;
    if (param.initializer) {
      defaultValue = param.initializer.getText();
    }

    return { name, type, defaultValue };
  });
}

function getLocation(
  node: ts.Node,
  sourceFile: ts.SourceFile,
): { file: string; line: number; column: number } {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return {
    file: sourceFile.fileName,
    line: line + 1,
    column: character + 1,
  };
}
