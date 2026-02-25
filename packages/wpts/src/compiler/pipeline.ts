import path from 'node:path';
import { createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';

const execFileAsync = promisify(execFile);
import type { PluginIR, PluginMetadata, RawPluginData } from '../ir/plugin-ir.js';
import { parseSourceFile, parseSourceString, getUserSourceFiles, type ParseResult } from './parser.js';
import { extractDecoratorsFromFiles } from './decorator-extractor.js';
import { DiagnosticCollection } from './diagnostics.js';
import { transpileMethodBody, transpileParameters } from '../transpiler/function-transpiler.js';
import { generatePlugin, type GeneratedFile } from '../generator/index.js';
import { writeFile, readFile, cleanDir, ensureDir, pathExists, copyPath, movePath, zipDir } from '../utils/fs-utils.js';
import {
  toSlugCase, toWPClassName, toConstantPrefix,
  toFunctionPrefix, toFilePrefix, toTextDomain, toSnakeCase,
} from '../utils/naming.js';

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
    diagnostics.error('WPTS100', `Failed to parse source file: ${err.message}`, { file: options.entry });
    return { files: [], diagnostics, success: false };
  }

  // Check for TS compilation errors (warnings only — don't block generation)
  for (const diag of parsed.diagnostics) {
    if (diag.category === 0 /* Error */) {
      const message = typeof diag.messageText === 'string' ? diag.messageText : diag.messageText.messageText;
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

  // Copy admin React source if it exists
  const adminSrcDir = options.adminSrcDir ?? path.join(path.dirname(options.entry), 'admin');
  if (await pathExists(adminSrcDir)) {
    const destAdminSrc = path.join(options.outDir, ir.metadata.filePrefix, 'admin', 'js', 'src');
    await copyPath(adminSrcDir, destAdminSrc);
  }

  // Stage 6: Build admin React app if admin pages exist
  if (!options.skipAdminBuild) {
    const adminJsDir = path.join(options.outDir, ir.metadata.filePrefix, 'admin', 'js');
    if (ir.adminPages.length > 0 && await pathExists(path.join(adminJsDir, 'package.json'))) {
      const cacheDir = path.join(options.outDir, '..', '.wpts-cache');
      await buildAdminApp(adminJsDir, cacheDir);
    }
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
    settings: rawData.settings.map(s => ({
      propertyName: s.propertyName,
      key: s.key,
      optionName: `${metadata.functionPrefix}${s.key}`,
      type: s.type,
      default: s.default,
      label: s.label,
      description: s.description ?? '',
      sanitize: s.sanitize ?? getDefaultSanitizer(s.type),
    })),
    actions: rawData.actions.map(a => ({
      hookName: a.hookName,
      methodName: a.methodName,
      phpMethodName: toSnakeCase(a.methodName),
      priority: a.priority ?? 10,
      acceptedArgs: a.acceptedArgs ?? 1,
      body: transpileMethodBody(a.bodyNode, parsed.typeChecker),
      context: 'public' as const,
    })),
    filters: rawData.filters.map(f => ({
      hookName: f.hookName,
      methodName: f.methodName,
      phpMethodName: toSnakeCase(f.methodName),
      priority: f.priority ?? 10,
      acceptedArgs: f.acceptedArgs ?? f.parameters.length,
      parameters: transpileParameters(f.parameters),
      body: transpileMethodBody(f.bodyNode, parsed.typeChecker),
      context: 'public' as const,
    })),
    adminPages: rawData.adminPages.map(p => ({
      pageTitle: p.pageTitle,
      menuTitle: p.menuTitle,
      capability: p.capability,
      menuSlug: p.menuSlug,
      iconUrl: p.iconUrl ?? 'dashicons-admin-generic',
      position: p.position ?? null,
      parentSlug: p.parentSlug ?? null,
    })),
    shortcodes: rawData.shortcodes.map(s => ({
      tag: s.tag,
      methodName: s.methodName,
      phpMethodName: toSnakeCase(s.methodName),
      parameters: transpileParameters(s.parameters),
      body: transpileMethodBody(s.bodyNode, parsed.typeChecker),
    })),
    customPostTypes: rawData.customPostTypes.map(cpt => {
      // Auto-wire taxonomies that reference this CPT
      const associatedTaxonomies = rawData.customTaxonomies
        .filter(t => t.postTypes.includes(cpt.slug))
        .map(t => t.slug);
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
    customTaxonomies: rawData.customTaxonomies.map(tax => ({
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
    restRoutes: rawData.restRoutes.map(r => ({
      route: r.route,
      method: r.method,
      capability: r.capability,
      public: r.public,
      methodName: r.methodName,
      phpMethodName: toSnakeCase(r.methodName),
      body: transpileMethodBody(r.bodyNode, parsed.typeChecker),
    })),
    ajaxHandlers: rawData.ajaxHandlers.map(a => ({
      action: a.action,
      public: a.public,
      capability: a.capability,
      nonce: a.nonce,
      methodName: a.methodName,
      phpMethodName: 'handle_ajax_' + a.action,
      body: transpileMethodBody(a.bodyNode, parsed.typeChecker),
    })),
    activation: rawData.activation
      ? transpileMethodBody(rawData.activation.bodyNode, parsed.typeChecker)
      : null,
    deactivation: rawData.deactivation
      ? transpileMethodBody(rawData.deactivation.bodyNode, parsed.typeChecker)
      : null,
  };

  return ir;
}

/**
 * Return a sensible default PHP sanitizer for the given setting type.
 */
function getDefaultSanitizer(type: string): string | null {
  switch (type) {
    case 'string':  return 'sanitize_text_field';
    case 'number':  return 'absint';
    case 'boolean': return 'rest_sanitize_boolean';
    default:        return null;
  }
}

/**
 * Install dependencies and build the admin React app using pnpm + wp-scripts.
 * Caches node_modules in a .wpts-cache/ directory to skip install on subsequent builds.
 */
async function buildAdminApp(adminJsDir: string, cacheDir: string): Promise<void> {
  console.log('\nBuilding admin React app...');
  const nodeModulesDir = path.join(adminJsDir, 'node_modules');

  try {
    // Hash dependencies to detect changes
    const packageJsonContent = await readFile(path.join(adminJsDir, 'package.json'));
    const parsed = JSON.parse(packageJsonContent);
    const depsFingerprint = JSON.stringify({
      dependencies: parsed.dependencies ?? {},
      devDependencies: parsed.devDependencies ?? {},
    });
    const currentHash = createHash('sha256').update(depsFingerprint).digest('hex');

    const cachedModulesDir = path.join(cacheDir, 'admin-node-modules');
    const cachedHashFile = path.join(cacheDir, 'admin-deps-hash');

    let needsInstall = true;

    if (await pathExists(cachedModulesDir) && await pathExists(cachedHashFile)) {
      const cachedHash = (await readFile(cachedHashFile)).trim();
      if (cachedHash === currentHash) {
        console.log('  Using cached node_modules (dependencies unchanged).');
        await movePath(cachedModulesDir, nodeModulesDir);
        needsInstall = false;
      }
    }

    if (needsInstall) {
      console.log('  Installing dependencies...');
      await execFileAsync('pnpm', ['--ignore-workspace', 'install'], { cwd: adminJsDir });
    }

    await execFileAsync('pnpm', ['--ignore-workspace', 'run', 'build'], { cwd: adminJsDir });

    // Cache node_modules for next build
    await ensureDir(cacheDir);
    if (await pathExists(cachedModulesDir)) {
      await cleanDir(cachedModulesDir);
    }
    await movePath(nodeModulesDir, cachedModulesDir);
    await writeFile(cachedHashFile, currentHash);

    // Clean up remaining build artifacts (only build/ is needed in dist)
    await cleanDir(path.join(adminJsDir, 'src'));
    const fsExtra = await import('fs-extra');
    for (const file of ['pnpm-lock.yaml', 'package.json']) {
      const filePath = path.join(adminJsDir, file);
      if (await pathExists(filePath)) {
        await fsExtra.remove(filePath);
      }
    }
    console.log('Admin React app built successfully.');
  } catch {
    // Ensure node_modules doesn't linger in dist on failure
    if (await pathExists(nodeModulesDir)) {
      await cleanDir(nodeModulesDir);
    }
    console.warn('Warning: Failed to build admin React app. Run manually: cd admin/js && pnpm install && pnpm run build');
  }
}
