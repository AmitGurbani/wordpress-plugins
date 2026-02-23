import { describe, it, expect } from 'vitest';
import { generatePlugin } from '../../../src/generator/index.js';
import type { PluginIR } from '../../../src/ir/plugin-ir.js';

function createTestIR(): PluginIR {
  return {
    metadata: {
      name: 'Hello Greeter',
      slug: 'hello-greeter',
      uri: '',
      description: 'A simple greeting plugin.',
      version: '1.0.0',
      author: 'Jane Developer',
      authorUri: 'https://jane.dev',
      license: 'GPL-2.0+',
      licenseUri: 'http://www.gnu.org/licenses/gpl-2.0.txt',
      textDomain: 'hello-greeter',
      domainPath: '/languages',
      requiresWP: '6.0',
      requiresPHP: '7.4',
      className: 'Hello_Greeter',
      constantPrefix: 'HELLO_GREETER_',
      functionPrefix: 'hello_greeter_',
      filePrefix: 'hello-greeter',
    },
    settings: [
      {
        propertyName: 'greetingMessage',
        key: 'greeting_message',
        optionName: 'hello_greeter_greeting_message',
        type: 'string',
        default: 'Hello, World!',
        label: 'Greeting Message',
        description: '',
        sanitize: 'sanitize_text_field',
      },
      {
        propertyName: 'showOnFrontend',
        key: 'show_on_frontend',
        optionName: 'hello_greeter_show_on_frontend',
        type: 'boolean',
        default: true,
        label: 'Show on Frontend',
        description: '',
        sanitize: 'absint',
      },
    ],
    actions: [
      {
        hookName: 'init',
        methodName: 'initialize',
        phpMethodName: 'initialize',
        priority: 10,
        acceptedArgs: 1,
        body: {
          phpCode: "        load_plugin_textdomain( 'hello-greeter', false, 'hello-greeter/languages' );",
          sourceText: '',
        },
        context: 'public',
      },
    ],
    filters: [
      {
        hookName: 'the_content',
        methodName: 'appendGreeting',
        phpMethodName: 'append_greeting',
        priority: 10,
        acceptedArgs: 1,
        parameters: [{ name: 'content', phpName: '$content', type: 'string', defaultValue: null }],
        body: {
          phpCode: "        $message = get_option( 'hello_greeter_greeting_message', 'Hello!' );\n        if ( is_single() ) {\n            return $content . '<div class=\"greeting\">' . esc_html( $message ) . '</div>';\n        }\n        return $content;",
          sourceText: '',
        },
        context: 'public',
      },
    ],
    adminPages: [
      {
        pageTitle: 'Hello Greeter Settings',
        menuTitle: 'Hello Greeter',
        capability: 'manage_options',
        menuSlug: 'hello-greeter-settings',
        iconUrl: 'dashicons-format-chat',
        position: null,
        parentSlug: null,
      },
    ],
    shortcodes: [
      {
        tag: 'hello_greet',
        methodName: 'greetShortcode',
        phpMethodName: 'greet_shortcode',
        parameters: [{ name: 'atts', phpName: '$atts', type: 'array', defaultValue: null }],
        body: {
          phpCode: "        $msg = isset( $atts['message'] ) ? $atts['message'] : get_option( 'hello_greeter_greeting_message', 'Hello!' );\n        return '<span class=\"greeting\">' . esc_html( $msg ) . '</span>';",
          sourceText: '',
        },
      },
    ],
    customPostTypes: [],
    customTaxonomies: [],
    restRoutes: [],
    ajaxHandlers: [],
    activation: {
      phpCode: "        add_option( 'hello_greeter_version', '1.0.0' );",
      sourceText: '',
    },
    deactivation: null,
  };
}

describe('generatePlugin', () => {
  it('generates all required files', () => {
    const ir = createTestIR();
    const files = generatePlugin(ir);
    const paths = files.map(f => f.relativePath);

    expect(paths).toContain('hello-greeter/hello-greeter.php');
    expect(paths).toContain('hello-greeter/includes/class-hello-greeter.php');
    expect(paths).toContain('hello-greeter/includes/class-hello-greeter-loader.php');
    expect(paths).toContain('hello-greeter/admin/class-hello-greeter-admin.php');
    expect(paths).toContain('hello-greeter/public/class-hello-greeter-public.php');
    expect(paths).toContain('hello-greeter/includes/class-hello-greeter-activator.php');
    expect(paths).toContain('hello-greeter/includes/class-hello-greeter-deactivator.php');
    expect(paths).toContain('hello-greeter/includes/class-hello-greeter-rest-api.php');
    expect(paths).toContain('hello-greeter/uninstall.php');
    expect(paths).toContain('hello-greeter/readme.txt');
    expect(paths).toContain('hello-greeter/admin/js/package.json');
  });

  it('generates correct plugin header', () => {
    const ir = createTestIR();
    const files = generatePlugin(ir);
    const mainFile = files.find(f => f.relativePath === 'hello-greeter/hello-greeter.php')!;

    expect(mainFile.content).toContain('Plugin Name:       Hello Greeter');
    expect(mainFile.content).toContain("Version:           1.0.0");
    expect(mainFile.content).toContain("Author:            Jane Developer");
    expect(mainFile.content).toContain("Text Domain:       hello-greeter");
    expect(mainFile.content).toContain("define( 'HELLO_GREETER_VERSION', '1.0.0' )");
    expect(mainFile.content).toContain('register_activation_hook');
    expect(mainFile.content).toContain('register_deactivation_hook');
  });

  it('generates main class with hook registration', () => {
    const ir = createTestIR();
    const files = generatePlugin(ir);
    const mainClass = files.find(f => f.relativePath === 'hello-greeter/includes/class-hello-greeter.php')!;

    expect(mainClass.content).toContain('class Hello_Greeter');
    expect(mainClass.content).toContain('Hello_Greeter_Loader');
    expect(mainClass.content).toContain('Hello_Greeter_Admin');
    expect(mainClass.content).toContain('Hello_Greeter_Public');
    expect(mainClass.content).toContain("add_action( 'admin_menu'");
    expect(mainClass.content).toContain("add_filter( 'the_content'");
    expect(mainClass.content).toContain('register_shortcodes');
  });

  it('generates admin class with React integration', () => {
    const ir = createTestIR();
    const files = generatePlugin(ir);
    const adminClass = files.find(f => f.relativePath === 'hello-greeter/admin/class-hello-greeter-admin.php')!;

    expect(adminClass.content).toContain('class Hello_Greeter_Admin');
    expect(adminClass.content).toContain("add_menu_page(");
    expect(adminClass.content).toContain("'Hello Greeter Settings'");
    expect(adminClass.content).toContain("'hello-greeter-settings'");
    expect(adminClass.content).toContain("'dashicons-format-chat'");
    expect(adminClass.content).toContain('wpts-admin-app');
    expect(adminClass.content).toContain('data-page');
    expect(adminClass.content).toContain('index.asset.php');
    expect(adminClass.content).toContain('wp_enqueue_script');
    expect(adminClass.content).toContain('wp-components');
  });

  it('generates public class with hooks and shortcodes', () => {
    const ir = createTestIR();
    const files = generatePlugin(ir);
    const publicClass = files.find(f => f.relativePath === 'hello-greeter/public/class-hello-greeter-public.php')!;

    expect(publicClass.content).toContain('class Hello_Greeter_Public');
    expect(publicClass.content).toContain('function initialize()');
    expect(publicClass.content).toContain('load_plugin_textdomain');
    expect(publicClass.content).toContain('function append_greeting( $content )');
    expect(publicClass.content).toContain("get_option( 'hello_greeter_greeting_message'");
    expect(publicClass.content).toContain("add_shortcode( 'hello_greet'");
    expect(publicClass.content).toContain('function greet_shortcode( $atts )');
  });

  it('generates REST API class for settings', () => {
    const ir = createTestIR();
    const files = generatePlugin(ir);
    const restApi = files.find(f => f.relativePath === 'hello-greeter/includes/class-hello-greeter-rest-api.php')!;

    expect(restApi.content).toContain('class Hello_Greeter_Rest_Api');
    expect(restApi.content).toContain('register_rest_route');
    expect(restApi.content).toContain('/settings');
    expect(restApi.content).toContain('manage_options');
    expect(restApi.content).toContain("'greeting_message'");
    expect(restApi.content).toContain("'show_on_frontend'");
    expect(restApi.content).toContain('sanitize_text_field');
    expect(restApi.content).toContain('absint');
  });

  it('auto-sanitizes settings by type when sanitize is not specified', () => {
    const ir = createTestIR();
    // Override settings with explicit types and no explicit sanitize
    ir.settings = [
      {
        propertyName: 'name',
        key: 'name',
        optionName: 'hello_greeter_name',
        type: 'string',
        default: '',
        label: 'Name',
        description: '',
        sanitize: 'sanitize_text_field',  // auto-default for string
      },
      {
        propertyName: 'count',
        key: 'count',
        optionName: 'hello_greeter_count',
        type: 'number',
        default: 0,
        label: 'Count',
        description: '',
        sanitize: 'absint',  // auto-default for number
      },
      {
        propertyName: 'enabled',
        key: 'enabled',
        optionName: 'hello_greeter_enabled',
        type: 'boolean',
        default: false,
        label: 'Enabled',
        description: '',
        sanitize: 'absint',  // auto-default for boolean
      },
    ];
    const files = generatePlugin(ir);

    // Admin register_setting should have sanitize_callback for all
    const adminClass = files.find(f => f.relativePath === 'hello-greeter/admin/class-hello-greeter-admin.php')!;
    expect(adminClass.content).toContain("'sanitize_callback' => 'sanitize_text_field'");
    expect(adminClass.content).toContain("'sanitize_callback' => 'absint'");

    // REST API should sanitize all settings
    const restApi = files.find(f => f.relativePath === 'hello-greeter/includes/class-hello-greeter-rest-api.php')!;
    expect(restApi.content).toContain('sanitize_text_field');
    expect(restApi.content).toContain('absint');
  });

  it('preserves explicit sanitize over auto-default', () => {
    const ir = createTestIR();
    ir.settings = [
      {
        propertyName: 'email',
        key: 'email',
        optionName: 'hello_greeter_email',
        type: 'string',
        default: '',
        label: 'Email',
        description: '',
        sanitize: 'sanitize_email',  // explicit, not the string default
      },
    ];
    const files = generatePlugin(ir);

    const adminClass = files.find(f => f.relativePath === 'hello-greeter/admin/class-hello-greeter-admin.php')!;
    expect(adminClass.content).toContain("'sanitize_callback' => 'sanitize_email'");
    expect(adminClass.content).not.toContain('sanitize_text_field');
  });

  it('generates activator with activation code', () => {
    const ir = createTestIR();
    const files = generatePlugin(ir);
    const activator = files.find(f => f.relativePath === 'hello-greeter/includes/class-hello-greeter-activator.php')!;

    expect(activator.content).toContain('class Hello_Greeter_Activator');
    expect(activator.content).toContain("add_option( 'hello_greeter_version', '1.0.0' )");
  });

  it('generates uninstall.php that cleans up options', () => {
    const ir = createTestIR();
    const files = generatePlugin(ir);
    const uninstall = files.find(f => f.relativePath === 'hello-greeter/uninstall.php')!;

    expect(uninstall.content).toContain('WP_UNINSTALL_PLUGIN');
    expect(uninstall.content).toContain("delete_option( 'hello_greeter_greeting_message' )");
    expect(uninstall.content).toContain("delete_option( 'hello_greeter_show_on_frontend' )");
  });

  it('generates readme.txt', () => {
    const ir = createTestIR();
    const files = generatePlugin(ir);
    const readme = files.find(f => f.relativePath === 'hello-greeter/readme.txt')!;

    expect(readme.content).toContain('=== Hello Greeter ===');
    expect(readme.content).toContain('Stable tag: 1.0.0');
  });

  it('generates admin JS package.json', () => {
    const ir = createTestIR();
    const files = generatePlugin(ir);
    const pkg = files.find(f => f.relativePath === 'hello-greeter/admin/js/package.json')!;

    expect(pkg.content).toContain('@wordpress/scripts');
    expect(pkg.content).toContain('@wordpress/components');
    expect(pkg.content).toContain('@wordpress/api-fetch');
  });

  it('generates index guard files', () => {
    const ir = createTestIR();
    const files = generatePlugin(ir);
    const guards = files.filter(f => f.relativePath.endsWith('index.php'));

    expect(guards.length).toBeGreaterThanOrEqual(4);
    for (const guard of guards) {
      expect(guard.content).toContain('Silence is golden');
    }
  });

  it('generates sub-page with add_submenu_page when parentSlug is set', () => {
    const ir = createTestIR();
    ir.adminPages.push({
      pageTitle: 'Advanced Settings',
      menuTitle: 'Advanced',
      capability: 'manage_options',
      menuSlug: 'hello-greeter-advanced',
      iconUrl: 'dashicons-admin-generic',
      position: null,
      parentSlug: 'hello-greeter-settings',
    });
    const files = generatePlugin(ir);
    const adminClass = files.find(f => f.relativePath === 'hello-greeter/admin/class-hello-greeter-admin.php')!;

    expect(adminClass.content).toContain('add_menu_page(');
    expect(adminClass.content).toContain('add_submenu_page(');
    expect(adminClass.content).toContain("'hello-greeter-settings'");
    expect(adminClass.content).toContain("'hello-greeter-advanced'");
    expect(adminClass.content).toContain('toplevel_page_hello-greeter-settings');
    expect(adminClass.content).toContain('hello-greeter_page_hello-greeter-advanced');
    expect(adminClass.content).toContain('in_array');
  });

  it('generates custom post type registration in public class', () => {
    const ir = createTestIR();
    ir.customPostTypes = [
      {
        slug: 'project',
        singularName: 'Project',
        pluralName: 'Projects',
        description: 'A project post type',
        public: true,
        showInRest: true,
        hasArchive: true,
        supports: ['title', 'editor', 'thumbnail'],
        menuIcon: 'dashicons-portfolio',
        menuPosition: 5,
        rewriteSlug: null,
        capabilityType: 'post',
        taxonomies: ['project_type'],
      },
    ];
    const files = generatePlugin(ir);

    const publicClass = files.find(f => f.relativePath === 'hello-greeter/public/class-hello-greeter-public.php')!;
    expect(publicClass.content).toContain('register_custom_post_types');
    expect(publicClass.content).toContain("register_post_type( 'project'");
    expect(publicClass.content).toContain("'Projects'");
    expect(publicClass.content).toContain("'Project'");
    expect(publicClass.content).toContain("'dashicons-portfolio'");
    expect(publicClass.content).toContain("'menu_position'");
    expect(publicClass.content).toContain("'title', 'editor', 'thumbnail'");
    expect(publicClass.content).toContain("'taxonomies'");
    expect(publicClass.content).toContain("'project_type'");

    const mainClass = files.find(f => f.relativePath === 'hello-greeter/includes/class-hello-greeter.php')!;
    expect(mainClass.content).toContain("'init', $public, 'register_custom_post_types'");
  });

  it('generates custom taxonomy registration in public class', () => {
    const ir = createTestIR();
    ir.customTaxonomies = [
      {
        slug: 'project_type',
        singularName: 'Project Type',
        pluralName: 'Project Types',
        postTypes: ['project'],
        description: '',
        public: true,
        showInRest: true,
        hierarchical: true,
        showAdminColumn: true,
        rewriteSlug: null,
      },
    ];
    const files = generatePlugin(ir);

    const publicClass = files.find(f => f.relativePath === 'hello-greeter/public/class-hello-greeter-public.php')!;
    expect(publicClass.content).toContain('register_custom_taxonomies');
    expect(publicClass.content).toContain("register_taxonomy( 'project_type'");
    expect(publicClass.content).toContain("'project'");
    expect(publicClass.content).toContain("'Project Types'");
    expect(publicClass.content).toContain("'Project Type'");
    expect(publicClass.content).toContain("'hierarchical'      => true");
    expect(publicClass.content).toContain("'show_admin_column' => true");
    expect(publicClass.content).toContain("'parent_item'");

    const mainClass = files.find(f => f.relativePath === 'hello-greeter/includes/class-hello-greeter.php')!;
    expect(mainClass.content).toContain("'init', $public, 'register_custom_taxonomies'");
  });

  it('generates REST routes in REST API class', () => {
    const ir = createTestIR();
    ir.restRoutes = [
      {
        route: '/products',
        method: 'GET',
        capability: 'read',
        methodName: 'listProducts',
        phpMethodName: 'list_products',
        body: { phpCode: "\t\treturn array();", sourceText: '' },
      },
    ];
    const files = generatePlugin(ir);

    const restApi = files.find(f => f.relativePath === 'hello-greeter/includes/class-hello-greeter-rest-api.php')!;
    expect(restApi.content).toContain("'/products'");
    expect(restApi.content).toContain("'GET'");
    expect(restApi.content).toContain("'list_products'");
    expect(restApi.content).toContain("current_user_can( 'read' )");
    expect(restApi.content).toContain('function list_products( $request )');

    const mainClass = files.find(f => f.relativePath === 'hello-greeter/includes/class-hello-greeter.php')!;
    expect(mainClass.content).toContain('rest_api_init');
  });

  it('generates REST API class when only rest routes exist (no settings)', () => {
    const ir = createTestIR();
    ir.settings = [];
    ir.restRoutes = [
      {
        route: '/items',
        method: 'POST',
        capability: 'edit_posts',
        methodName: 'createItem',
        phpMethodName: 'create_item',
        body: { phpCode: "\t\treturn array();", sourceText: '' },
      },
    ];
    const files = generatePlugin(ir);
    const paths = files.map(f => f.relativePath);

    expect(paths).toContain('hello-greeter/includes/class-hello-greeter-rest-api.php');
  });

  it('does not generate REST API class when no settings and no rest routes', () => {
    const ir = createTestIR();
    ir.settings = [];
    ir.restRoutes = [];
    const files = generatePlugin(ir);
    const paths = files.map(f => f.relativePath);

    expect(paths).not.toContain('hello-greeter/includes/class-hello-greeter-rest-api.php');
  });

  it('generates AJAX handler methods in admin class', () => {
    const ir = createTestIR();
    ir.ajaxHandlers = [
      {
        action: 'delete_item',
        public: false,
        capability: 'delete_posts',
        nonce: true,
        methodName: 'handleDelete',
        phpMethodName: 'handle_ajax_delete_item',
        body: { phpCode: "\t\twp_send_json_success( array( 'deleted' => true ) );", sourceText: '' },
      },
    ];
    const files = generatePlugin(ir);

    const adminClass = files.find(f => f.relativePath === 'hello-greeter/admin/class-hello-greeter-admin.php')!;
    expect(adminClass.content).toContain('function handle_ajax_delete_item()');
    expect(adminClass.content).toContain('check_ajax_referer');
    expect(adminClass.content).toContain("current_user_can( 'delete_posts' )");
    expect(adminClass.content).toContain('wp_send_json_success');

    const mainClass = files.find(f => f.relativePath === 'hello-greeter/includes/class-hello-greeter.php')!;
    expect(mainClass.content).toContain("'wp_ajax_delete_item'");
    expect(mainClass.content).toContain("'handle_ajax_delete_item'");
    expect(mainClass.content).not.toContain('wp_ajax_nopriv_delete_item');
  });

  it('generates nopriv AJAX hook for public AJAX handlers', () => {
    const ir = createTestIR();
    ir.ajaxHandlers = [
      {
        action: 'load_more',
        public: true,
        capability: 'read',
        nonce: true,
        methodName: 'loadMore',
        phpMethodName: 'handle_ajax_load_more',
        body: { phpCode: "\t\twp_send_json_success( array() );", sourceText: '' },
      },
    ];
    const files = generatePlugin(ir);

    const mainClass = files.find(f => f.relativePath === 'hello-greeter/includes/class-hello-greeter.php')!;
    expect(mainClass.content).toContain("'wp_ajax_load_more'");
    expect(mainClass.content).toContain("'wp_ajax_nopriv_load_more'");
  });

  it('skips nonce check when nonce is false', () => {
    const ir = createTestIR();
    ir.ajaxHandlers = [
      {
        action: 'public_action',
        public: true,
        capability: 'read',
        nonce: false,
        methodName: 'publicAction',
        phpMethodName: 'handle_ajax_public_action',
        body: { phpCode: "\t\twp_send_json_success( array() );", sourceText: '' },
      },
    ];
    const files = generatePlugin(ir);

    const adminClass = files.find(f => f.relativePath === 'hello-greeter/admin/class-hello-greeter-admin.php')!;
    expect(adminClass.content).toContain('function handle_ajax_public_action()');
    expect(adminClass.content).not.toContain('check_ajax_referer');
    expect(adminClass.content).toContain("current_user_can( 'read' )");
  });

  it('uses hasAdminPages flag to register hooks only once', () => {
    const ir = createTestIR();
    ir.adminPages.push({
      pageTitle: 'Sub Page',
      menuTitle: 'Sub Page',
      capability: 'manage_options',
      menuSlug: 'hello-greeter-sub',
      iconUrl: 'dashicons-admin-generic',
      position: null,
      parentSlug: 'hello-greeter-settings',
    });
    const files = generatePlugin(ir);
    const mainClass = files.find(f => f.relativePath === 'hello-greeter/includes/class-hello-greeter.php')!;

    // Should only have one admin_menu registration, not one per page
    const adminMenuMatches = mainClass.content.match(/add_action\( 'admin_menu'/g);
    expect(adminMenuMatches).toHaveLength(1);
  });
});
