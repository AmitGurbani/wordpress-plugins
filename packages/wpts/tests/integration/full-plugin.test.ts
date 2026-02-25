import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { build } from '../../src/compiler/pipeline.js';
import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';

describe('Full plugin build (end-to-end)', () => {
  let tmpDir: string;
  let fixtureDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wpts-test-'));
    fixtureDir = path.join(tmpDir, 'fixture');
    await fs.ensureDir(fixtureDir);
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it('builds a complete plugin from TypeScript source', async () => {
    // Create a test plugin.ts
    const pluginTs = `
function Plugin(opts: any): ClassDecorator { return (t) => {}; }
function Action(hook: string, opts?: any): MethodDecorator { return (t, p, d) => {}; }
function Filter(hook: string, opts?: any): MethodDecorator { return (t, p, d) => {}; }
function Setting(opts: any): PropertyDecorator { return (t, p) => {}; }
function AdminPage(opts: any): any { return (t: any, p?: any, d?: any) => {}; }
function Shortcode(tag: string): MethodDecorator { return (t, p, d) => {}; }
function Activate(): MethodDecorator { return (t, p, d) => {}; }
function Deactivate(): MethodDecorator { return (t, p, d) => {}; }

declare function addOption(k: string, v: any): void;
declare function getOption(k: string, d?: any): any;
declare function loadPluginTextdomain(d: string, b: boolean, p: string): void;
declare function isSingle(): boolean;
declare function escHtml(s: string): string;

@Plugin({
  name: 'Test Plugin',
  description: 'A test plugin.',
  version: '1.0.0',
  author: 'Tester',
  license: 'GPL-2.0+',
  textDomain: 'test-plugin',
})
@AdminPage({
  pageTitle: 'Test Settings',
  menuTitle: 'Test Plugin',
  capability: 'manage_options',
  menuSlug: 'test-plugin-settings',
  iconUrl: 'dashicons-admin-generic',
})
class TestPlugin {
  @Setting({
    key: 'greeting',
    type: 'string',
    default: 'Hello!',
    label: 'Greeting',
    sanitize: 'sanitize_text_field',
  })
  greeting: string = 'Hello!';

  @Activate()
  onActivation(): void {
    addOption('test_plugin_version', '1.0.0');
  }

  @Action('init')
  initialize(): void {
    loadPluginTextdomain('test-plugin', false, 'test-plugin/languages');
  }

  @Filter('the_content')
  modifyContent(content: string): string {
    const msg: string = getOption('test_plugin_greeting', 'Hello!');
    if (isSingle()) {
      return content + '<p>' + escHtml(msg) + '</p>';
    }
    return content;
  }

  @Shortcode('test_hello')
  helloShortcode(atts: Record<string, string>): string {
    return '<span>Hello</span>';
  }
}
`;

    const inputFile = path.join(fixtureDir, 'plugin.ts');
    await fs.writeFile(inputFile, pluginTs);

    const outDir = path.join(tmpDir, 'dist');
    const result = await build({ entry: inputFile, outDir, clean: true, skipAdminBuild: true });

    // Build should succeed
    expect(result.success).toBe(true);
    expect(result.files.length).toBeGreaterThan(0);

    // Check files exist on disk
    const mainPlugin = path.join(outDir, 'test-plugin', 'test-plugin.php');
    expect(await fs.pathExists(mainPlugin)).toBe(true);

    const mainClass = path.join(outDir, 'test-plugin', 'includes', 'class-test-plugin.php');
    expect(await fs.pathExists(mainClass)).toBe(true);

    const adminClass = path.join(outDir, 'test-plugin', 'admin', 'class-test-plugin-admin.php');
    expect(await fs.pathExists(adminClass)).toBe(true);

    const publicClass = path.join(outDir, 'test-plugin', 'public', 'class-test-plugin-public.php');
    expect(await fs.pathExists(publicClass)).toBe(true);

    const restApi = path.join(outDir, 'test-plugin', 'includes', 'class-test-plugin-rest-api.php');
    expect(await fs.pathExists(restApi)).toBe(true);

    // Verify content of main plugin file
    const mainContent = await fs.readFile(mainPlugin, 'utf-8');
    expect(mainContent).toContain('Plugin Name:       Test Plugin');
    expect(mainContent).toContain("define( 'TEST_PLUGIN_VERSION', '1.0.0' )");
    expect(mainContent).toContain('register_activation_hook');

    // Verify public class has transpiled content
    const publicContent = await fs.readFile(publicClass, 'utf-8');
    expect(publicContent).toContain('function initialize()');
    expect(publicContent).toContain('load_plugin_textdomain');
    expect(publicContent).toContain('function modify_content');
    expect(publicContent).toContain('get_option');
    expect(publicContent).toContain('is_single');
    expect(publicContent).toContain('esc_html');

    // Verify admin class has React integration
    const adminContent = await fs.readFile(adminClass, 'utf-8');
    expect(adminContent).toContain('wpts-admin-app');
    expect(adminContent).toContain('index.asset.php');
    expect(adminContent).toContain('wp_enqueue_script');

    // Verify REST API class
    const restContent = await fs.readFile(restApi, 'utf-8');
    expect(restContent).toContain('register_rest_route');
    expect(restContent).toContain("'greeting'");
    expect(restContent).toContain('manage_options');

    // Verify uninstall
    const uninstall = path.join(outDir, 'test-plugin', 'uninstall.php');
    const uninstallContent = await fs.readFile(uninstall, 'utf-8');
    expect(uninstallContent).toContain('WP_UNINSTALL_PLUGIN');
    expect(uninstallContent).toContain("delete_option( 'test_plugin_greeting' )");
    expect(uninstallContent).toContain("delete_option( 'test_plugin_version' )");
    expect(uninstallContent).not.toContain('TODO');
  });

  it('builds a plugin with CPT, taxonomy, REST routes, and AJAX handlers', async () => {
    const pluginTs = `
function Plugin(opts: any): ClassDecorator { return (t) => {}; }
function Action(hook: string, opts?: any): MethodDecorator { return (t, p, d) => {}; }
function Setting(opts: any): PropertyDecorator { return (t, p) => {}; }
function AdminPage(opts: any): any { return (t: any, p?: any, d?: any) => {}; }
function CustomPostType(slug: string, opts: any): ClassDecorator { return (t) => {}; }
function CustomTaxonomy(slug: string, opts: any): ClassDecorator { return (t) => {}; }
function RestRoute(route: string, opts: any): MethodDecorator { return (t, p, d) => {}; }
function AjaxHandler(action: string, opts?: any): MethodDecorator { return (t, p, d) => {}; }

declare function getPosts(args?: Record<string, any>): any[];
declare function absint(value: any): number;
declare var $_POST: Record<string, any>;
declare function wpSendJsonSuccess(data?: any, statusCode?: number): never;
declare function wpSendJsonError(data?: any, statusCode?: number): never;

@Plugin({
  name: 'Portfolio Manager',
  description: 'Manage portfolio projects.',
  version: '1.0.0',
  author: 'Tester',
  license: 'GPL-2.0+',
  textDomain: 'portfolio-manager',
})
@AdminPage({
  pageTitle: 'Portfolio Settings',
  menuTitle: 'Portfolio',
  capability: 'manage_options',
  menuSlug: 'portfolio-settings',
  iconUrl: 'dashicons-portfolio',
})
@CustomPostType('project', {
  singularName: 'Project',
  pluralName: 'Projects',
  supports: ['title', 'editor', 'thumbnail'],
  hasArchive: true,
  menuIcon: 'dashicons-portfolio',
})
@CustomTaxonomy('project_type', {
  singularName: 'Project Type',
  pluralName: 'Project Types',
  postTypes: ['project'],
  hierarchical: true,
})
class PortfolioManager {
  @Setting({
    key: 'projects_per_page',
    type: 'number',
    default: 12,
    label: 'Projects Per Page',
  })
  projectsPerPage: number = 12;

  @RestRoute('/projects', { method: 'GET', capability: 'read' })
  listProjects(request: any): any {
    const posts = getPosts({ post_type: 'project' });
    return posts;
  }

  @RestRoute('/projects/public', { method: 'GET', public: true })
  listPublicProjects(request: any): any {
    const posts = getPosts({ post_type: 'project' });
    return posts;
  }

  @AjaxHandler('delete_project', { capability: 'delete_posts' })
  handleDeleteProject(): void {
    const id = absint($_POST['project_id']);
    wpSendJsonSuccess({ deleted: true });
  }

  @AjaxHandler('load_more_projects', { public: true, capability: 'read' })
  handleLoadMore(): void {
    const posts = getPosts({ post_type: 'project' });
    wpSendJsonSuccess({ posts: posts });
  }
}
`;

    const inputFile = path.join(fixtureDir, 'plugin.ts');
    await fs.writeFile(inputFile, pluginTs);

    const outDir = path.join(tmpDir, 'dist');
    const result = await build({ entry: inputFile, outDir, clean: true, skipAdminBuild: true });

    expect(result.success).toBe(true);
    expect(result.files.length).toBeGreaterThan(0);

    // Verify public class has CPT and taxonomy registration
    const publicClass = path.join(outDir, 'portfolio-manager', 'public', 'class-portfolio-manager-public.php');
    expect(await fs.pathExists(publicClass)).toBe(true);
    const publicContent = await fs.readFile(publicClass, 'utf-8');
    expect(publicContent).toContain("register_post_type( 'project'");
    expect(publicContent).toContain("'Projects'");
    expect(publicContent).toContain("'Project'");
    expect(publicContent).toContain("'dashicons-portfolio'");
    expect(publicContent).toContain("register_taxonomy( 'project_type'");
    expect(publicContent).toContain("'Project Types'");
    expect(publicContent).toContain("'hierarchical'      => true");
    // Taxonomy auto-wiring: CPT should list its taxonomies
    expect(publicContent).toContain("'taxonomies'");
    expect(publicContent).toContain("'project_type'");

    // Verify REST API class has custom routes
    const restApi = path.join(outDir, 'portfolio-manager', 'includes', 'class-portfolio-manager-rest-api.php');
    expect(await fs.pathExists(restApi)).toBe(true);
    const restContent = await fs.readFile(restApi, 'utf-8');
    expect(restContent).toContain("'/projects'");
    expect(restContent).toContain("'GET'");
    expect(restContent).toContain("current_user_can( 'read' )");
    expect(restContent).toContain('function list_projects');
    expect(restContent).toContain('get_posts');
    // Verify public route generates __return_true
    expect(restContent).toContain("'/projects/public'");
    expect(restContent).toContain("'__return_true'");
    expect(restContent).toContain('function list_public_projects');

    // Verify admin class has AJAX handlers
    const adminClass = path.join(outDir, 'portfolio-manager', 'admin', 'class-portfolio-manager-admin.php');
    expect(await fs.pathExists(adminClass)).toBe(true);
    const adminContent = await fs.readFile(adminClass, 'utf-8');
    expect(adminContent).toContain('function handle_ajax_delete_project');
    expect(adminContent).toContain('check_ajax_referer');
    expect(adminContent).toContain("current_user_can( 'delete_posts' )");
    expect(adminContent).toContain('absint');
    expect(adminContent).toContain('wp_send_json_success');
    expect(adminContent).toContain('function handle_ajax_load_more_projects');

    // Verify main class hooks
    const mainClass = path.join(outDir, 'portfolio-manager', 'includes', 'class-portfolio-manager.php');
    const mainContent = await fs.readFile(mainClass, 'utf-8');
    expect(mainContent).toContain("'init', $public, 'register_custom_post_types'");
    expect(mainContent).toContain("'init', $public, 'register_custom_taxonomies'");
    expect(mainContent).toContain("'wp_ajax_delete_project'");
    expect(mainContent).toContain("'wp_ajax_load_more_projects'");
    expect(mainContent).toContain("'wp_ajax_nopriv_load_more_projects'");
    expect(mainContent).not.toContain('wp_ajax_nopriv_delete_project');
    expect(mainContent).toContain('rest_api_init');
  });

  it('builds a multi-file plugin from entry + imported source files', async () => {
    // Entry file with @Plugin and settings
    const entryTs = `
function Plugin(opts: any): ClassDecorator { return (t) => {}; }
function Action(hook: string, opts?: any): MethodDecorator { return (t, p, d) => {}; }
function Setting(opts: any): PropertyDecorator { return (t, p) => {}; }
function AdminPage(opts: any): any { return (t: any, p?: any, d?: any) => {}; }

declare function loadPluginTextdomain(d: string, b: boolean, p: string): void;

import './routes.js';

@Plugin({
  name: 'Multi File Plugin',
  description: 'A plugin split across files.',
  version: '2.0.0',
  author: 'Tester',
  license: 'GPL-2.0+',
  textDomain: 'multi-file-plugin',
})
@AdminPage({
  pageTitle: 'Multi File Settings',
  menuTitle: 'Multi File',
  capability: 'manage_options',
  menuSlug: 'multi-file-settings',
})
class MultiFilePlugin {
  @Setting({
    key: 'api_key',
    type: 'string',
    default: '',
    label: 'API Key',
    sanitize: 'sanitize_text_field',
  })
  apiKey: string = '';

  @Action('init')
  initialize(): void {
    loadPluginTextdomain('multi-file-plugin', false, 'multi-file-plugin/languages');
  }
}
`;

    // Separate routes file with REST routes
    const routesTs = `
function RestRoute(route: string, opts: any): MethodDecorator { return (t, p, d) => {}; }

declare function getPosts(args?: Record<string, any>): any[];

class PluginRoutes {
  @RestRoute('/items', { method: 'GET', capability: 'read' })
  listItems(request: any): any {
    const posts = getPosts({ post_type: 'item' });
    return posts;
  }

  @RestRoute('/items', { method: 'POST', capability: 'edit_posts' })
  createItem(request: any): any {
    return { id: 1 };
  }
}
`;

    await fs.writeFile(path.join(fixtureDir, 'plugin.ts'), entryTs);
    await fs.writeFile(path.join(fixtureDir, 'routes.ts'), routesTs);

    const outDir = path.join(tmpDir, 'dist');
    const result = await build({
      entry: path.join(fixtureDir, 'plugin.ts'),
      outDir,
      clean: true,
      skipAdminBuild: true,
    });

    expect(result.success).toBe(true);

    // Verify plugin metadata from entry file
    const mainPlugin = path.join(outDir, 'multi-file-plugin', 'multi-file-plugin.php');
    const mainContent = await fs.readFile(mainPlugin, 'utf-8');
    expect(mainContent).toContain('Plugin Name:       Multi File Plugin');

    // Verify settings from entry file
    const restApi = path.join(outDir, 'multi-file-plugin', 'includes', 'class-multi-file-plugin-rest-api.php');
    const restContent = await fs.readFile(restApi, 'utf-8');
    expect(restContent).toContain("'api_key'");

    // Verify REST routes from routes.ts were included
    expect(restContent).toContain("'/items'");
    expect(restContent).toContain("'GET'");
    expect(restContent).toContain("'POST'");
    expect(restContent).toContain('function list_items');
    expect(restContent).toContain('function create_item');
    expect(restContent).toContain('get_posts');
  });

  it('reports error for missing @Plugin decorator', async () => {
    const inputFile = path.join(fixtureDir, 'bad.ts');
    await fs.writeFile(inputFile, 'class Foo {}');

    const outDir = path.join(tmpDir, 'dist');
    const result = await build({ entry: inputFile, outDir });

    expect(result.success).toBe(false);
    expect(result.diagnostics.hasErrors()).toBe(true);
    expect(result.diagnostics.getErrors()[0].code).toBe('WPTS001');
  });
});
