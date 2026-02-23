/**
 * Settings Demo — wpts Example Plugin
 *
 * Demonstrates multiple setting types (string, boolean, number, array),
 * multiple admin pages (main page + sub-page with parentSlug),
 * and various WordPress hooks.
 *
 * Build:  npx wpts build src/plugin.ts -o dist --clean
 */

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
declare function updateOption(k: string, v: any): void;
declare function deleteOption(k: string): void;
declare function loadPluginTextdomain(d: string, b: boolean, p: string): void;
declare function isSingle(): boolean;
declare function isPage(): boolean;
declare function escHtml(s: string): string;
declare function escAttr(s: string): string;
declare function absint(v: any): number;
declare function wpEnqueueStyle(h: string, s?: string, d?: string[], v?: string): void;

@Plugin({
  name: 'Settings Demo',
  description: 'Demonstrates multiple setting types and multi-page admin.',
  version: '1.0.0',
  author: 'wpts',
  license: 'GPL-2.0+',
  textDomain: 'settings-demo',
  requiresWP: '6.7',
  requiresPHP: '8.2',
})
// Main admin page
@AdminPage({
  pageTitle: 'Settings Demo',
  menuTitle: 'Settings Demo',
  capability: 'manage_options',
  menuSlug: 'settings-demo',
  iconUrl: 'dashicons-admin-settings',
})
// Sub-page for advanced settings
@AdminPage({
  pageTitle: 'Advanced Settings',
  menuTitle: 'Advanced',
  capability: 'manage_options',
  menuSlug: 'settings-demo-advanced',
  parentSlug: 'settings-demo',
})
class SettingsDemo {

  // --- String setting ---
  @Setting({
    key: 'site_title',
    type: 'string',
    default: 'My Awesome Site',
    label: 'Site Title Override',
    description: 'Custom title displayed in the plugin output.',
    sanitize: 'sanitize_text_field',
  })
  siteTitle: string = 'My Awesome Site';

  // --- Boolean setting ---
  @Setting({
    key: 'enabled',
    type: 'boolean',
    default: true,
    label: 'Enable Plugin Output',
    description: 'Toggle the plugin greeting on the frontend.',
  })
  enabled: boolean = true;

  // --- Number setting ---
  @Setting({
    key: 'max_items',
    type: 'number',
    default: 5,
    label: 'Maximum Items',
    description: 'Maximum number of items to display.',
    sanitize: 'absint',
  })
  maxItems: number = 5;

  // --- String setting (used as a CSS color) ---
  @Setting({
    key: 'accent_color',
    type: 'string',
    default: '#0073aa',
    label: 'Accent Color',
    description: 'Primary accent color used for styling.',
    sanitize: 'sanitize_hex_color',
  })
  accentColor: string = '#0073aa';

  // --- String setting (textarea-style) ---
  @Setting({
    key: 'custom_css',
    type: 'string',
    default: '',
    label: 'Custom CSS',
    description: 'Additional CSS injected into the frontend.',
    sanitize: 'wp_strip_all_tags',
  })
  customCss: string = '';

  @Activate()
  onActivation(): void {
    addOption('settings_demo_version', '1.0.0');
    addOption('settings_demo_installed_at', Date.now());
  }

  @Deactivate()
  onDeactivation(): void {
    deleteOption('settings_demo_installed_at');
  }

  @Action('init')
  initialize(): void {
    loadPluginTextdomain('settings-demo', false, 'settings-demo/languages');
  }

  @Action('wp_enqueue_scripts')
  enqueueStyles(): void {
    const customCss: string = getOption('settings_demo_custom_css', '');
    if (customCss) {
      wpEnqueueStyle('settings-demo-custom');
    }
  }

  @Filter('the_content')
  appendGreeting(content: string): string {
    const enabled: boolean = getOption('settings_demo_enabled', true);
    const title: string = getOption('settings_demo_site_title', 'My Awesome Site');
    const color: string = getOption('settings_demo_accent_color', '#0073aa');
    const maxItems: number = getOption('settings_demo_max_items', 5);

    if (enabled && isSingle()) {
      const greeting: string = '<div class="settings-demo" style="border-left: 3px solid '
        + escAttr(color) + '; padding: 10px;">'
        + '<strong>' + escHtml(title) + '</strong>'
        + '<p>Max items: ' + escHtml(String(maxItems)) + '</p>'
        + '</div>';
      return content + greeting;
    }
    return content;
  }

  @Shortcode('settings_info')
  infoShortcode(atts: Record<string, string>): string {
    const title: string = getOption('settings_demo_site_title', 'My Awesome Site');
    const enabled: boolean = getOption('settings_demo_enabled', true);

    if (!enabled) {
      return '';
    }
    return '<span class="settings-info">' + escHtml(title) + '</span>';
  }
}
