import Handlebars from 'handlebars';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { PluginIR, SettingIR, HookContext } from '../ir/plugin-ir.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, '..', 'templates');

/**
 * Generated file with its path and content.
 */
export interface GeneratedFile {
  relativePath: string;
  content: string;
}

/**
 * Load and compile a Handlebars template.
 */
function loadTemplate(name: string): HandlebarsTemplateDelegate {
  const templatePath = path.join(TEMPLATES_DIR, `${name}.hbs`);
  const source = readFileSync(templatePath, 'utf-8');
  return Handlebars.compile(source, { noEscape: true });
}

/**
 * Classify a hook into admin or public context.
 */
function classifyHook(hookName: string): HookContext {
  const adminHooks = [
    'admin_init', 'admin_menu', 'admin_enqueue_scripts',
    'admin_notices', 'admin_footer', 'admin_head',
    'admin_bar_menu', 'admin_post_',
  ];

  for (const prefix of adminHooks) {
    if (hookName.startsWith(prefix)) return 'admin';
  }

  const publicHooks = [
    'wp_enqueue_scripts', 'wp_head', 'wp_footer',
    'the_content', 'the_title', 'the_excerpt',
    'wp_body_open', 'template_redirect',
  ];

  for (const hook of publicHooks) {
    if (hookName === hook) return 'public';
  }

  // init, plugins_loaded, etc. default to public for simplicity
  return 'public';
}

/**
 * Format a PHP default value for a setting.
 */
function formatPhpDefault(setting: SettingIR): string {
  if (setting.default === null || setting.default === undefined) return 'null';
  if (setting.type === 'string') return `'${String(setting.default).replace(/'/g, "\\'")}'`;
  if (setting.type === 'boolean') return setting.default ? 'true' : 'false';
  if (setting.type === 'number') return String(setting.default);
  if (setting.type === 'array') return 'array()';
  return `'${String(setting.default)}'`;
}

/**
 * Generate all PHP files for a WordPress plugin from the IR.
 */
export function generatePlugin(ir: PluginIR): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const { metadata } = ir;
  const fp = metadata.filePrefix;

  // Classify actions and filters
  const adminActions = ir.actions.filter(a => classifyHook(a.hookName) === 'admin');
  const publicActions = ir.actions.filter(a => classifyHook(a.hookName) !== 'admin');
  const publicFilters = ir.filters; // Filters are almost always public in MVP
  const hasSettings = ir.settings.length > 0;
  const hasShortcodes = ir.shortcodes.length > 0;
  const hasCustomPostTypes = ir.customPostTypes.length > 0;
  const hasCustomTaxonomies = ir.customTaxonomies.length > 0;
  const hasRestRoutes = ir.restRoutes.length > 0;
  const hasAjaxHandlers = ir.ajaxHandlers.length > 0;
  const hasCustomRestApi = hasSettings || hasRestRoutes;

  // Prepare settings with PHP defaults
  const settingsWithDefaults = ir.settings.map(s => ({
    ...s,
    phpDefault: formatPhpDefault(s),
  }));

  // Common template data
  const data = {
    ...metadata,
    adminPages: ir.adminPages,
    adminActions,
    publicActions,
    publicFilters,
    settings: settingsWithDefaults,
    shortcodes: ir.shortcodes,
    hasSettings,
    hasShortcodes,
    hasAdminPages: ir.adminPages.length > 0,
    customPostTypes: ir.customPostTypes,
    customTaxonomies: ir.customTaxonomies,
    restRoutes: ir.restRoutes,
    ajaxHandlers: ir.ajaxHandlers,
    hasCustomPostTypes,
    hasCustomTaxonomies,
    hasRestRoutes,
    hasAjaxHandlers,
    hasCustomRestApi,
    activationCode: ir.activation?.phpCode ?? null,
    deactivationCode: ir.deactivation?.phpCode ?? null,
  };

  // Main plugin file
  files.push({
    relativePath: `${fp}/${fp}.php`,
    content: loadTemplate('plugin-header')(data),
  });

  // Main class
  files.push({
    relativePath: `${fp}/includes/class-${fp}.php`,
    content: loadTemplate('class-main')(data),
  });

  // Loader class
  files.push({
    relativePath: `${fp}/includes/class-${fp}-loader.php`,
    content: loadTemplate('class-loader')(data),
  });

  // Admin class
  files.push({
    relativePath: `${fp}/admin/class-${fp}-admin.php`,
    content: loadTemplate('class-admin')(data),
  });

  // Public class
  files.push({
    relativePath: `${fp}/public/class-${fp}-public.php`,
    content: loadTemplate('class-public')(data),
  });

  // Activator
  files.push({
    relativePath: `${fp}/includes/class-${fp}-activator.php`,
    content: loadTemplate('class-activator')(data),
  });

  // Deactivator
  files.push({
    relativePath: `${fp}/includes/class-${fp}-deactivator.php`,
    content: loadTemplate('class-deactivator')(data),
  });

  // REST API (settings or custom REST routes)
  if (hasCustomRestApi) {
    files.push({
      relativePath: `${fp}/includes/class-${fp}-rest-api.php`,
      content: loadTemplate('class-rest-api')(data),
    });
  }

  // Uninstall
  files.push({
    relativePath: `${fp}/uninstall.php`,
    content: loadTemplate('uninstall')(data),
  });

  // Readme
  files.push({
    relativePath: `${fp}/readme.txt`,
    content: loadTemplate('readme')(data),
  });

  // Admin JS package.json (for wp-scripts)
  if (ir.adminPages.length > 0) {
    files.push({
      relativePath: `${fp}/admin/js/package.json`,
      content: loadTemplate('admin-package')(data),
    });
  }

  // Index guard files
  const guardContent = '<?php\n// Silence is golden.\n';
  for (const dir of ['includes', 'admin', 'public', 'languages']) {
    files.push({
      relativePath: `${fp}/${dir}/index.php`,
      content: guardContent,
    });
  }

  return files;
}
