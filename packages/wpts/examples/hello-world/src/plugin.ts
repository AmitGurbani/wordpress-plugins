/**
 * Hello World — wpts Example Plugin
 *
 * Demonstrates all wpts decorators: @Plugin, @Setting, @Action, @Filter,
 * @AdminPage, @Shortcode, @Activate, and @Deactivate.
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
declare function deleteOption(k: string): void;
declare function loadPluginTextdomain(d: string, b: boolean, p: string): void;
declare function isSingle(): boolean;
declare function escHtml(s: string): string;
declare function escAttr(s: string): string;

@Plugin({
  name: 'Hello World',
  description: 'A simple greeting plugin built with wpts.',
  version: '1.0.0',
  author: 'wpts',
  license: 'GPL-2.0+',
  textDomain: 'hello-world',
})
@AdminPage({
  pageTitle: 'Hello World Settings',
  menuTitle: 'Hello World',
  capability: 'manage_options',
  menuSlug: 'hello-world-settings',
  iconUrl: 'dashicons-format-chat',
})
class HelloWorld {

  @Setting({
    key: 'greeting',
    type: 'string',
    default: 'Hello, World!',
    label: 'Greeting Message',
    description: 'The message displayed on single posts.',
    sanitize: 'sanitize_text_field',
  })
  greeting: string = 'Hello, World!';

  @Setting({
    key: 'color',
    type: 'string',
    default: '#333333',
    label: 'Text Color',
    description: 'CSS color for the greeting.',
    sanitize: 'sanitize_hex_color',
  })
  color: string = '#333333';

  @Activate()
  onActivation(): void {
    addOption('hello_world_version', '1.0.0');
  }

  @Deactivate()
  onDeactivation(): void {
    // Clean up transients if needed
  }

  @Action('init')
  initialize(): void {
    loadPluginTextdomain('hello-world', false, 'hello-world/languages');
  }

  @Filter('the_content')
  appendGreeting(content: string): string {
    const message: string = getOption('hello_world_greeting', 'Hello, World!');
    const color: string = getOption('hello_world_color', '#333333');
    if (isSingle()) {
      return content + '<p style="color: ' + escAttr(color) + ';">' + escHtml(message) + '</p>';
    }
    return content;
  }

  @Shortcode('hello')
  helloShortcode(atts: Record<string, string>): string {
    const message: string = getOption('hello_world_greeting', 'Hello, World!');
    return '<span class="hello-greeting">' + escHtml(message) + '</span>';
  }
}
