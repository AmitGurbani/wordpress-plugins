import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

import { type GeneratedFile, generatePlugin } from '../generator/index.js';
import type { PluginIR, PluginMetadata, RawPluginData } from '../ir/plugin-ir.js';
import { transpileMethodBody, transpileParameters } from '../transpiler/function-transpiler.js';
import { cleanDir, ensureDir, pathExists, writeFile, zipDir } from '../utils/fs-utils.js';
import {
  toConstantPrefix,
  toFilePrefix,
  toFunctionPrefix,
  toSlugCase,
  toSnakeCase,
  toTextDomain,
  toWPClassName,
} from '../utils/naming.js';
import { extractDecoratorsFromFiles } from './decorator-extractor.js';
import { DiagnosticCollection } from './diagnostics.js';
import { getUserSourceFiles, type ParseResult, parseSourceFile } from './parser.js';

export interface BuildOptions {
  entry: string;
  outDir: string;
  clean?: boolean;
  adminSrcDir?: string;
  skipAdminBuild?: boolean;
  zip?: boolean;
}

export interface BuildResult {
  files: GeneratedFile[];
  diagnostics: DiagnosticCollection;
  success: boolean;
  zipPath?: string;
}

/**
 * Run the full build pipeline: Parse → Extract → Transpile → Generate → Write.
 */
export async function build(options: BuildOptions): Promise<BuildResult> {
  const diagnostics = new DiagnosticCollection();

  // Stage 1: Parse
  let parsed: ParseResult;
  try {
    parsed = parseSourceFile(options.entry);
  } catch (err: any) {
    diagnostics.error('WPTS100', `Failed to parse source file: ${err.message}`, {
      file: options.entry,
    });
    return { files: [], diagnostics, success: false };
  }

  // Check for TS compilation errors (warnings only — don't block generation)
  for (const diag of parsed.diagnostics) {
    if (diag.category === 0 /* Error */) {
      const message =
        typeof diag.messageText === 'string' ? diag.messageText : diag.messageText.messageText;
      diagnostics.warning('WPTS101', `TypeScript: ${message}`, { file: options.entry });
    }
  }

  // Stage 2: Extract decorators (from all user source files resolved by the program)
  const userFiles = getUserSourceFiles(parsed.program);
  const rawData = extractDecoratorsFromFiles(userFiles, parsed.typeChecker, diagnostics);

  if (diagnostics.hasErrors()) {
    return { files: [], diagnostics, success: false };
  }

  if (!rawData.plugin) {
    return { files: [], diagnostics, success: false };
  }

  // Stage 3: Build IR (transform raw data + transpile function bodies)
  const ir = buildIR(rawData, parsed, diagnostics);

  if (diagnostics.hasErrors()) {
    return { files: [], diagnostics, success: false };
  }

  // Stage 4: Generate files
  const files = generatePlugin(ir);

  // Stage 5: Write files to disk
  if (options.clean) {
    await cleanDir(options.outDir);
  }
  await ensureDir(options.outDir);

  for (const file of files) {
    const fullPath = path.join(options.outDir, file.relativePath);
    await writeFile(fullPath, file.content);
  }

  // Stage 6: Build admin React app if admin pages exist
  if (!options.skipAdminBuild && ir.adminPages.length > 0) {
    const adminSrcDir = options.adminSrcDir ?? path.join(path.dirname(options.entry), 'admin');
    const pluginDir = path.resolve(path.dirname(options.entry), '..');
    const outputDir = path.join(
      path.resolve(options.outDir),
      ir.metadata.filePrefix,
      'admin',
      'js',
      'build',
    );
    await buildAdminApp(pluginDir, adminSrcDir, outputDir);
  }

  // Stage 7: Generate zip for WordPress upload
  let zipPath: string | undefined;
  if (options.zip) {
    const pluginDir = path.join(options.outDir, ir.metadata.filePrefix);
    zipPath = path.join(options.outDir, `${ir.metadata.filePrefix}.zip`);
    await zipDir(pluginDir, zipPath, ir.metadata.filePrefix);
  }

  return { files, diagnostics, success: true, zipPath };
}

/**
 * Build the full PluginIR from raw extracted data.
 */
function buildIR(
  rawData: RawPluginData,
  parsed: ParseResult,
  diagnostics: DiagnosticCollection,
): PluginIR {
  const raw = rawData.plugin!;
  const slug = raw.slug ?? toSlugCase(raw.name);

  const metadata: PluginMetadata = {
    name: raw.name,
    slug,
    uri: raw.uri ?? '',
    description: raw.description,
    version: raw.version,
    author: raw.author,
    authorUri: raw.authorUri ?? '',
    license: raw.license,
    licenseUri: raw.licenseUri ?? 'http://www.gnu.org/licenses/gpl-2.0.txt',
    textDomain: raw.textDomain ?? toTextDomain(raw.name),
    domainPath: raw.domainPath ?? '/languages',
    requiresWP: raw.requiresWP ?? '6.7',
    requiresPHP: raw.requiresPHP ?? '8.2',
    className: toWPClassName(raw.name),
    constantPrefix: toConstantPrefix(raw.name),
    functionPrefix: toFunctionPrefix(raw.name),
    filePrefix: toFilePrefix(raw.name),
  };

  // Warn for array settings without explicit sanitize
  for (const s of rawData.settings) {
    if (s.type === 'array' && !s.sanitize) {
      diagnostics.warning(
        'WPTS043',
        `@Setting "${s.key}" has type "array" with no sanitize function. Consider adding a sanitize callback.`,
        { file: '' },
      );
    }
  }

  const ir: PluginIR = {
    metadata,
    settings: rawData.settings.map((s) => ({
      propertyName: s.propertyName,
      key: s.key,
      optionName: `${metadata.functionPrefix}${s.key}`,
      type: s.type,
      default: s.default,
      label: s.label,
      description: s.description ?? '',
      sanitize: s.sanitize ?? getDefaultSanitizer(s.type),
      sensitive: s.sensitive ?? false,
      exposeInConfig: s.exposeInConfig ?? false,
      wooCurrencyDefault: s.wooCurrencyDefault ?? false,
    })),
    actions: rawData.actions.map((a) => ({
      hookName: a.hookName,
      methodName: a.methodName,
      phpMethodName: toSnakeCase(a.methodName),
      priority: a.priority ?? 10,
      acceptedArgs: a.acceptedArgs ?? a.parameters.length,
      parameters: transpileParameters(a.parameters),
      body: transpileMethodBody(a.bodyNode, parsed.typeChecker),
      context: 'public' as const,
    })),
    filters: rawData.filters.map((f) => ({
      hookName: f.hookName,
      methodName: f.methodName,
      phpMethodName: toSnakeCase(f.methodName),
      priority: f.priority ?? 10,
      acceptedArgs: f.acceptedArgs ?? f.parameters.length,
      parameters: transpileParameters(f.parameters),
      body: transpileMethodBody(f.bodyNode, parsed.typeChecker),
      context: 'public' as const,
    })),
    adminPages: rawData.adminPages.map((p) => ({
      pageTitle: p.pageTitle,
      menuTitle: p.menuTitle,
      capability: p.capability,
      menuSlug: p.menuSlug,
      iconUrl: p.iconUrl ?? 'dashicons-admin-generic',
      position: p.position ?? null,
      parentSlug: p.parentSlug ?? null,
    })),
    shortcodes: rawData.shortcodes.map((s) => ({
      tag: s.tag,
      methodName: s.methodName,
      phpMethodName: toSnakeCase(s.methodName),
      parameters: transpileParameters(s.parameters),
      body: transpileMethodBody(s.bodyNode, parsed.typeChecker),
    })),
    customPostTypes: rawData.customPostTypes.map((cpt) => {
      // Auto-wire taxonomies that reference this CPT
      const associatedTaxonomies = rawData.customTaxonomies
        .filter((t) => t.postTypes.includes(cpt.slug))
        .map((t) => t.slug);
      return {
        slug: cpt.slug,
        singularName: cpt.singularName,
        pluralName: cpt.pluralName,
        description: cpt.description ?? '',
        public: cpt.public ?? true,
        showInRest: cpt.showInRest ?? true,
        hasArchive: cpt.hasArchive ?? true,
        supports: cpt.supports ?? ['title', 'editor', 'thumbnail'],
        menuIcon: cpt.menuIcon ?? 'dashicons-admin-post',
        menuPosition: cpt.menuPosition ?? null,
        rewriteSlug: cpt.rewriteSlug ?? null,
        capabilityType: cpt.capabilityType ?? 'post',
        taxonomies: associatedTaxonomies,
      };
    }),
    customTaxonomies: rawData.customTaxonomies.map((tax) => ({
      slug: tax.slug,
      singularName: tax.singularName,
      pluralName: tax.pluralName,
      postTypes: tax.postTypes,
      description: tax.description ?? '',
      public: tax.public ?? true,
      showInRest: tax.showInRest ?? true,
      hierarchical: tax.hierarchical ?? false,
      showAdminColumn: tax.showAdminColumn ?? true,
      rewriteSlug: tax.rewriteSlug ?? null,
    })),
    restRoutes: rawData.restRoutes.map((r) => ({
      route: r.route,
      method: r.method,
      capability: r.capability,
      public: r.public,
      methodName: r.methodName,
      phpMethodName: toSnakeCase(r.methodName),
      body: transpileMethodBody(r.bodyNode, parsed.typeChecker),
    })),
    ajaxHandlers: rawData.ajaxHandlers.map((a) => ({
      action: a.action,
      public: a.public,
      capability: a.capability,
      nonce: a.nonce,
      methodName: a.methodName,
      phpMethodName: `handle_ajax_${a.action}`,
      body: transpileMethodBody(a.bodyNode, parsed.typeChecker),
    })),
    helperMethods: rawData.helperMethods.map((m) => ({
      methodName: m.methodName,
      phpMethodName: toSnakeCase(m.methodName),
      parameters: transpileParameters(m.parameters),
      body: transpileMethodBody(m.bodyNode, parsed.typeChecker),
      context: (m.context === 'rest' ? 'rest' : 'public') as 'public' | 'rest',
    })),
    activation: rawData.activation
      ? transpileMethodBody(rawData.activation.bodyNode, parsed.typeChecker)
      : null,
    deactivation: rawData.deactivation
      ? transpileMethodBody(rawData.deactivation.bodyNode, parsed.typeChecker)
      : null,
  };

  // ── Synthesize auto-generated IR entries from decorator options ──────

  // @Plugin({ wooNotice }) → admin_notices action
  if (raw.wooNotice) {
    const noticeType = raw.wooNotice === 'required' ? 'notice-error' : 'notice-warning';
    const verb =
      raw.wooNotice === 'required'
        ? 'WooCommerce is required for this plugin to work.'
        : 'WooCommerce is recommended for automatic purchase event tracking.';
    const phpCode = [
      `\t\tif ( ! class_exists( 'WooCommerce' ) ) {`,
      `\t\t\techo '<div class="notice ${noticeType}"><p><strong>' . esc_html( '${metadata.name}' ) . ':</strong> ';`,
      `\t\t\techo esc_html__( '${verb}', '${metadata.textDomain}' );`,
      `\t\t\techo '</p></div>';`,
      `\t\t}`,
    ].join('\n');
    ir.actions.push({
      hookName: 'admin_notices',
      methodName: 'woo_notice',
      phpMethodName: 'woo_notice',
      priority: 10,
      acceptedArgs: 0,
      parameters: [],
      body: { phpCode, sourceText: '' },
      context: 'admin',
    });
  }

  // @Setting({ wooCurrencyDefault }) → default_option filter
  for (const s of ir.settings) {
    if (s.wooCurrencyDefault) {
      ir.filters.push({
        hookName: `default_option_${s.optionName}`,
        methodName: `filter_default_${s.key}`,
        phpMethodName: `filter_default_${s.key}`,
        priority: 11,
        acceptedArgs: 1,
        parameters: [
          { name: 'default_value', phpName: '$default_value', type: 'string', defaultValue: null },
        ],
        body: {
          phpCode: [
            `\t\tif ( class_exists( 'WooCommerce' ) ) {`,
            `\t\t\treturn get_option( 'woocommerce_currency', 'USD' );`,
            `\t\t}`,
            `\t\treturn $default_value;`,
          ].join('\n'),
          sourceText: '',
        },
        context: 'public',
      });
    }
  }

  // @Setting({ exposeInConfig }) → GET /config REST route
  const configSettings = ir.settings.filter((s) => s.exposeInConfig);
  const hasManualConfigRoute = ir.restRoutes.some((r) => r.route === '/config');
  if (configSettings.length > 0 && !hasManualConfigRoute) {
    const getOptionLines = configSettings
      .map(
        (s) => `\t\t$config['${s.key}'] = get_option( '${s.optionName}', ${formatPhpDefault(s)} );`,
      )
      .join('\n');
    ir.restRoutes.push({
      route: '/config',
      method: 'GET',
      capability: '',
      public: true,
      methodName: 'get_config',
      phpMethodName: 'get_config',
      body: {
        phpCode: `\t\t$config = array();\n${getOptionLines}\n\t\treturn rest_ensure_response( $config );`,
        sourceText: '',
      },
    });
  }

  // @DiagnosticsRoute() → GET /diagnostics/last-error REST route
  if (rawData.diagnosticsRoute) {
    const errorOptionName = `${metadata.functionPrefix}${rawData.diagnosticsRoute.errorOptionSuffix}`;
    ir.restRoutes.push({
      route: '/diagnostics/last-error',
      method: 'GET',
      capability: 'manage_options',
      public: false,
      methodName: 'get_last_error',
      phpMethodName: 'get_last_error',
      body: {
        phpCode: [
          `\t\treturn rest_ensure_response( array(`,
          `\t\t\t'last_error' => get_option( '${errorOptionName}', '' ),`,
          `\t\t) );`,
        ].join('\n'),
        sourceText: '',
      },
    });
  }

  return ir;
}

/**
 * Format a PHP default value for a setting (used in synthesized routes).
 */
function formatPhpDefault(setting: { type: string; default: unknown }): string {
  if (setting.default === null || setting.default === undefined) return "''";
  if (setting.type === 'string') return `'${String(setting.default).replace(/'/g, "\\'")}'`;
  if (setting.type === 'boolean') return setting.default ? "'1'" : "''";
  if (setting.type === 'number') return String(setting.default);
  return "''";
}

/**
 * Return a sensible default PHP sanitizer for the given setting type.
 */
function getDefaultSanitizer(type: string): string | null {
  switch (type) {
    case 'string':
      return 'sanitize_text_field';
    case 'number':
      return 'absint';
    case 'boolean':
      return 'rest_sanitize_boolean';
    default:
      return null;
  }
}

/**
 * Build the admin React app using wp-scripts from the workspace.
 * Runs wp-scripts directly from the plugin directory — no isolated install needed.
 */
async function buildAdminApp(
  pluginDir: string,
  adminSrcDir: string,
  outputDir: string,
): Promise<void> {
  console.log('\nBuilding admin React app...');
  const entry = path.join(adminSrcDir, 'index.tsx');
  if (!(await pathExists(entry))) {
    console.warn(`  Warning: No admin entry point found at ${entry}`);
    return;
  }
  try {
    await execFileAsync(
      'pnpm',
      [
        'exec',
        'wp-scripts',
        'build',
        `index=${path.relative(pluginDir, entry)}`,
        `--output-path=${path.relative(pluginDir, outputDir)}`,
      ],
      { cwd: pluginDir },
    );
    console.log('Admin React app built successfully.');
  } catch (err: any) {
    const stderr = err?.stderr || err?.message || String(err);
    console.warn(`Warning: Failed to build admin React app.\n  Error: ${stderr}`);
  }
}
