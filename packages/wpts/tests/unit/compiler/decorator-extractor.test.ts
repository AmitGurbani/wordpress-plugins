import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import {
  extractDecorators,
  extractDecoratorsFromFiles,
} from '../../../src/compiler/decorator-extractor.js';
import { DiagnosticCollection } from '../../../src/compiler/diagnostics.js';
import { parseSourceString } from '../../../src/compiler/parser.js';

function extract(source: string) {
  const parsed = parseSourceString(source);
  const diagnostics = new DiagnosticCollection();
  const result = extractDecorators(parsed.sourceFile, parsed.typeChecker, diagnostics);
  return { result, diagnostics };
}

// Helper to provide decorator definitions so TS doesn't error
const decoratorDefs = `
function Plugin(opts: any): ClassDecorator { return (t) => {}; }
function Action(hook: string, opts?: any): MethodDecorator { return (t, p, d) => {}; }
function Filter(hook: string, opts?: any): MethodDecorator { return (t, p, d) => {}; }
function Setting(opts: any): PropertyDecorator { return (t, p) => {}; }
function AdminPage(opts: any): any { return (t: any, p?: any, d?: any) => {}; }
function Shortcode(tag: string): MethodDecorator { return (t, p, d) => {}; }
function Activate(): MethodDecorator { return (t, p, d) => {}; }
function Deactivate(): MethodDecorator { return (t, p, d) => {}; }
function Uninstall(): MethodDecorator { return (t, p, d) => {}; }
`;

describe('extractDecorators', () => {
  describe('@Plugin', () => {
    it('extracts plugin metadata', () => {
      const { result, diagnostics } = extract(`
        ${decoratorDefs}
        @Plugin({
          name: 'Hello Greeter',
          description: 'A greeting plugin.',
          version: '1.0.0',
          author: 'Jane',
          license: 'GPL-2.0+',
          textDomain: 'hello-greeter',
          requiresWP: '6.0',
          requiresPHP: '7.4',
        })
        class HelloGreeter {}
      `);

      expect(diagnostics.hasErrors()).toBe(false);
      expect(result.plugin).not.toBeNull();
      expect(result.plugin!.name).toBe('Hello Greeter');
      expect(result.plugin!.description).toBe('A greeting plugin.');
      expect(result.plugin!.version).toBe('1.0.0');
      expect(result.plugin!.author).toBe('Jane');
      expect(result.plugin!.license).toBe('GPL-2.0+');
      expect(result.plugin!.textDomain).toBe('hello-greeter');
      expect(result.plugin!.requiresWP).toBe('6.0');
      expect(result.plugin!.requiresPHP).toBe('7.4');
    });

    it('reports error when no @Plugin found', () => {
      const { diagnostics } = extract(`class Foo {}`);

      expect(diagnostics.hasErrors()).toBe(true);
      expect(diagnostics.getErrors()[0].code).toBe('WPTS001');
    });

    it('reports error for missing name', () => {
      const { diagnostics } = extract(`
        ${decoratorDefs}
        @Plugin({ description: 'test', version: '1.0.0', author: 'me', license: 'GPL' })
        class Foo {}
      `);

      expect(diagnostics.hasErrors()).toBe(true);
      expect(diagnostics.getErrors()[0].code).toBe('WPTS012');
    });

    describe('auto-update (githubRepo / updateUri)', () => {
      const base = `name: 'Test', description: '', version: '1.0.0', author: '', license: 'GPL'`;

      it('extracts githubRepo when valid', () => {
        const { result, diagnostics } = extract(`
          ${decoratorDefs}
          @Plugin({ ${base}, githubRepo: 'AmitGurbani/wordpress-plugins' })
          class TestPlugin {}
        `);
        expect(diagnostics.hasErrors()).toBe(false);
        expect(result.plugin!.githubRepo).toBe('AmitGurbani/wordpress-plugins');
        expect(result.plugin!.updateUri).toBeUndefined();
      });

      it('extracts both githubRepo and updateUri', () => {
        const { result, diagnostics } = extract(`
          ${decoratorDefs}
          @Plugin({
            ${base},
            githubRepo: 'AmitGurbani/wordpress-plugins',
            updateUri: 'https://updates.example.com/my-plugin'
          })
          class TestPlugin {}
        `);
        expect(diagnostics.hasErrors()).toBe(false);
        expect(result.plugin!.githubRepo).toBe('AmitGurbani/wordpress-plugins');
        expect(result.plugin!.updateUri).toBe('https://updates.example.com/my-plugin');
      });

      it('emits WPTS013 for malformed githubRepo', () => {
        const { diagnostics } = extract(`
          ${decoratorDefs}
          @Plugin({ ${base}, githubRepo: 'just-a-name' })
          class TestPlugin {}
        `);
        expect(diagnostics.hasErrors()).toBe(true);
        expect(diagnostics.getErrors()[0].code).toBe('WPTS013');
      });

      it('emits WPTS015 when updateUri is set without githubRepo', () => {
        const { diagnostics } = extract(`
          ${decoratorDefs}
          @Plugin({ ${base}, updateUri: 'https://example.com/x' })
          class TestPlugin {}
        `);
        expect(diagnostics.hasErrors()).toBe(true);
        expect(diagnostics.getErrors()[0].code).toBe('WPTS015');
      });

      it('emits WPTS014 when updateUri hostname is wordpress.org', () => {
        const { diagnostics } = extract(`
          ${decoratorDefs}
          @Plugin({
            ${base},
            githubRepo: 'foo/bar',
            updateUri: 'https://wordpress.org/plugins/my-plugin/'
          })
          class TestPlugin {}
        `);
        expect(diagnostics.hasErrors()).toBe(true);
        expect(diagnostics.getErrors()[0].code).toBe('WPTS014');
      });

      it('emits WPTS014 when updateUri is not a valid URL', () => {
        const { diagnostics } = extract(`
          ${decoratorDefs}
          @Plugin({
            ${base},
            githubRepo: 'foo/bar',
            updateUri: 'not a url'
          })
          class TestPlugin {}
        `);
        expect(diagnostics.hasErrors()).toBe(true);
        expect(diagnostics.getErrors()[0].code).toBe('WPTS014');
      });

      it('does not flag plugins that omit both options', () => {
        const { result, diagnostics } = extract(`
          ${decoratorDefs}
          @Plugin({ ${base} })
          class TestPlugin {}
        `);
        expect(diagnostics.hasErrors()).toBe(false);
        expect(result.plugin!.githubRepo).toBeUndefined();
        expect(result.plugin!.updateUri).toBeUndefined();
      });
    });
  });

  describe('@Action', () => {
    it('extracts action hook', () => {
      const { result } = extract(`
        ${decoratorDefs}
        @Plugin({ name: 'Test', description: '', version: '1.0.0', author: '', license: 'GPL' })
        class TestPlugin {
          @Action('init')
          onInit(): void {}
        }
      `);

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].hookName).toBe('init');
      expect(result.actions[0].methodName).toBe('onInit');
      expect(result.actions[0].priority).toBe(10);
    });

    it('extracts action with priority', () => {
      const { result } = extract(`
        ${decoratorDefs}
        @Plugin({ name: 'Test', description: '', version: '1.0.0', author: '', license: 'GPL' })
        class TestPlugin {
          @Action('init', { priority: 20 })
          lateInit(): void {}
        }
      `);

      expect(result.actions[0].priority).toBe(20);
    });

    it('extracts multiple actions', () => {
      const { result } = extract(`
        ${decoratorDefs}
        @Plugin({ name: 'Test', description: '', version: '1.0.0', author: '', license: 'GPL' })
        class TestPlugin {
          @Action('init')
          onInit(): void {}

          @Action('wp_enqueue_scripts')
          enqueueAssets(): void {}
        }
      `);

      expect(result.actions).toHaveLength(2);
      expect(result.actions[0].hookName).toBe('init');
      expect(result.actions[1].hookName).toBe('wp_enqueue_scripts');
    });
  });

  describe('@Filter', () => {
    it('extracts filter hook with parameters', () => {
      const { result } = extract(`
        ${decoratorDefs}
        @Plugin({ name: 'Test', description: '', version: '1.0.0', author: '', license: 'GPL' })
        class TestPlugin {
          @Filter('the_content')
          modifyContent(content: string): string {
            return content;
          }
        }
      `);

      expect(result.filters).toHaveLength(1);
      expect(result.filters[0].hookName).toBe('the_content');
      expect(result.filters[0].methodName).toBe('modifyContent');
      expect(result.filters[0].parameters).toHaveLength(1);
      expect(result.filters[0].parameters[0].name).toBe('content');
      expect(result.filters[0].parameters[0].type).toBe('string');
    });

    it('extracts filter with priority', () => {
      const { result } = extract(`
        ${decoratorDefs}
        @Plugin({ name: 'Test', description: '', version: '1.0.0', author: '', license: 'GPL' })
        class TestPlugin {
          @Filter('the_title', { priority: 5 })
          modifyTitle(title: string): string {
            return title;
          }
        }
      `);

      expect(result.filters[0].priority).toBe(5);
    });
  });

  describe('@Setting', () => {
    it('extracts setting metadata', () => {
      const { result } = extract(`
        ${decoratorDefs}
        @Plugin({ name: 'Test', description: '', version: '1.0.0', author: '', license: 'GPL' })
        class TestPlugin {
          @Setting({
            key: 'greeting_message',
            type: 'string',
            default: 'Hello!',
            label: 'Greeting Message',
            sanitize: 'sanitize_text_field',
          })
          greetingMessage: string = 'Hello!';
        }
      `);

      expect(result.settings).toHaveLength(1);
      expect(result.settings[0].key).toBe('greeting_message');
      expect(result.settings[0].type).toBe('string');
      expect(result.settings[0].default).toBe('Hello!');
      expect(result.settings[0].label).toBe('Greeting Message');
      expect(result.settings[0].sanitize).toBe('sanitize_text_field');
      expect(result.settings[0].propertyName).toBe('greetingMessage');
    });

    it('extracts boolean setting', () => {
      const { result } = extract(`
        ${decoratorDefs}
        @Plugin({ name: 'Test', description: '', version: '1.0.0', author: '', license: 'GPL' })
        class TestPlugin {
          @Setting({
            key: 'show_on_frontend',
            type: 'boolean',
            default: true,
            label: 'Show on Frontend',
          })
          showOnFrontend: boolean = true;
        }
      `);

      expect(result.settings[0].type).toBe('boolean');
      expect(result.settings[0].default).toBe(true);
    });

    it('extracts multiple settings', () => {
      const { result } = extract(`
        ${decoratorDefs}
        @Plugin({ name: 'Test', description: '', version: '1.0.0', author: '', license: 'GPL' })
        class TestPlugin {
          @Setting({ key: 'name', type: 'string', default: '', label: 'Name' })
          name: string = '';

          @Setting({ key: 'count', type: 'number', default: 0, label: 'Count' })
          count: number = 0;
        }
      `);

      expect(result.settings).toHaveLength(2);
    });
  });

  describe('@AdminPage', () => {
    it('extracts admin page on class', () => {
      const { result } = extract(`
        ${decoratorDefs}
        @Plugin({ name: 'Test', description: '', version: '1.0.0', author: '', license: 'GPL' })
        @AdminPage({
          pageTitle: 'Test Settings',
          menuTitle: 'Test',
          capability: 'manage_options',
          menuSlug: 'test-settings',
          iconUrl: 'dashicons-admin-generic',
        })
        class TestPlugin {}
      `);

      expect(result.adminPages).toHaveLength(1);
      expect(result.adminPages[0].pageTitle).toBe('Test Settings');
      expect(result.adminPages[0].menuTitle).toBe('Test');
      expect(result.adminPages[0].capability).toBe('manage_options');
      expect(result.adminPages[0].menuSlug).toBe('test-settings');
      expect(result.adminPages[0].iconUrl).toBe('dashicons-admin-generic');
      expect(result.adminPages[0].parentSlug).toBeUndefined();
    });

    it('extracts admin sub-page with parentSlug', () => {
      const { result } = extract(`
        ${decoratorDefs}
        @Plugin({ name: 'Test', description: '', version: '1.0.0', author: '', license: 'GPL' })
        @AdminPage({
          pageTitle: 'Main Settings',
          menuTitle: 'Test Plugin',
          capability: 'manage_options',
          menuSlug: 'test-settings',
        })
        @AdminPage({
          pageTitle: 'Advanced Settings',
          menuTitle: 'Advanced',
          capability: 'manage_options',
          menuSlug: 'test-advanced',
          parentSlug: 'test-settings',
        })
        class TestPlugin {}
      `);

      expect(result.adminPages).toHaveLength(2);
      expect(result.adminPages[0].parentSlug).toBeUndefined();
      expect(result.adminPages[1].parentSlug).toBe('test-settings');
      expect(result.adminPages[1].menuSlug).toBe('test-advanced');
    });
  });

  describe('@Shortcode', () => {
    it('extracts shortcode with parameters', () => {
      const { result } = extract(`
        ${decoratorDefs}
        @Plugin({ name: 'Test', description: '', version: '1.0.0', author: '', license: 'GPL' })
        class TestPlugin {
          @Shortcode('my_greeting')
          renderGreeting(atts: Record<string, string>): string {
            return '<p>Hello</p>';
          }
        }
      `);

      expect(result.shortcodes).toHaveLength(1);
      expect(result.shortcodes[0].tag).toBe('my_greeting');
      expect(result.shortcodes[0].methodName).toBe('renderGreeting');
    });
  });

  describe('@Activate / @Deactivate', () => {
    it('extracts activation hook', () => {
      const { result } = extract(`
        ${decoratorDefs}
        @Plugin({ name: 'Test', description: '', version: '1.0.0', author: '', license: 'GPL' })
        class TestPlugin {
          @Activate()
          onActivation(): void {}
        }
      `);

      expect(result.activation).not.toBeNull();
      expect(result.activation!.methodName).toBe('onActivation');
    });

    it('extracts deactivation hook', () => {
      const { result } = extract(`
        ${decoratorDefs}
        @Plugin({ name: 'Test', description: '', version: '1.0.0', author: '', license: 'GPL' })
        class TestPlugin {
          @Deactivate()
          onDeactivation(): void {}
        }
      `);

      expect(result.deactivation).not.toBeNull();
      expect(result.deactivation!.methodName).toBe('onDeactivation');
    });

    it('extracts uninstall hook', () => {
      const { result } = extract(`
        ${decoratorDefs}
        @Plugin({ name: 'Test', description: '', version: '1.0.0', author: '', license: 'GPL' })
        class TestPlugin {
          @Uninstall()
          onUninstall(): void {}
        }
      `);

      expect(result.uninstall).not.toBeNull();
      expect(result.uninstall!.methodName).toBe('onUninstall');
    });
  });

  describe('@CustomPostType', () => {
    it('extracts custom post type with all options', () => {
      const { result, diagnostics } = extract(`
        ${decoratorDefs}
        function CustomPostType(slug: string, opts: any): ClassDecorator { return (t) => {}; }

        @Plugin({ name: 'Test', description: '', version: '1.0.0', author: '', license: 'GPL' })
        @CustomPostType('project', {
          singularName: 'Project',
          pluralName: 'Projects',
          description: 'A project post type',
          public: true,
          showInRest: true,
          hasArchive: true,
          supports: ['title', 'editor', 'thumbnail'],
          menuIcon: 'dashicons-portfolio',
          menuPosition: 5,
          rewriteSlug: 'projects',
          capabilityType: 'post',
        })
        class TestPlugin {}
      `);

      expect(diagnostics.hasErrors()).toBe(false);
      expect(result.customPostTypes).toHaveLength(1);
      const cpt = result.customPostTypes[0];
      expect(cpt.slug).toBe('project');
      expect(cpt.singularName).toBe('Project');
      expect(cpt.pluralName).toBe('Projects');
      expect(cpt.description).toBe('A project post type');
      expect(cpt.public).toBe(true);
      expect(cpt.showInRest).toBe(true);
      expect(cpt.hasArchive).toBe(true);
      expect(cpt.supports).toEqual(['title', 'editor', 'thumbnail']);
      expect(cpt.menuIcon).toBe('dashicons-portfolio');
      expect(cpt.menuPosition).toBe(5);
      expect(cpt.rewriteSlug).toBe('projects');
      expect(cpt.capabilityType).toBe('post');
    });

    it('extracts CPT with minimal options', () => {
      const { result, diagnostics } = extract(`
        ${decoratorDefs}
        function CustomPostType(slug: string, opts: any): ClassDecorator { return (t) => {}; }

        @Plugin({ name: 'Test', description: '', version: '1.0.0', author: '', license: 'GPL' })
        @CustomPostType('book', { singularName: 'Book', pluralName: 'Books' })
        class TestPlugin {}
      `);

      expect(diagnostics.hasErrors()).toBe(false);
      expect(result.customPostTypes).toHaveLength(1);
      expect(result.customPostTypes[0].slug).toBe('book');
      expect(result.customPostTypes[0].singularName).toBe('Book');
      expect(result.customPostTypes[0].pluralName).toBe('Books');
    });

    it('reports error for missing singularName', () => {
      const { diagnostics } = extract(`
        ${decoratorDefs}
        function CustomPostType(slug: string, opts: any): ClassDecorator { return (t) => {}; }

        @Plugin({ name: 'Test', description: '', version: '1.0.0', author: '', license: 'GPL' })
        @CustomPostType('book', { pluralName: 'Books' })
        class TestPlugin {}
      `);

      expect(diagnostics.hasErrors()).toBe(true);
      expect(diagnostics.getErrors().some((e) => e.code === 'WPTS073')).toBe(true);
    });

    it('reports error for missing arguments', () => {
      const { diagnostics } = extract(`
        ${decoratorDefs}
        function CustomPostType(slug: string, opts: any): ClassDecorator { return (t) => {}; }

        @Plugin({ name: 'Test', description: '', version: '1.0.0', author: '', license: 'GPL' })
        @CustomPostType('book')
        class TestPlugin {}
      `);

      expect(diagnostics.hasErrors()).toBe(true);
      expect(diagnostics.getErrors().some((e) => e.code === 'WPTS070')).toBe(true);
    });
  });

  describe('@CustomTaxonomy', () => {
    it('extracts custom taxonomy with all options', () => {
      const { result, diagnostics } = extract(`
        ${decoratorDefs}
        function CustomTaxonomy(slug: string, opts: any): ClassDecorator { return (t) => {}; }

        @Plugin({ name: 'Test', description: '', version: '1.0.0', author: '', license: 'GPL' })
        @CustomTaxonomy('genre', {
          singularName: 'Genre',
          pluralName: 'Genres',
          postTypes: ['book', 'movie'],
          hierarchical: true,
          showAdminColumn: true,
          showInRest: true,
          rewriteSlug: 'genres',
        })
        class TestPlugin {}
      `);

      expect(diagnostics.hasErrors()).toBe(false);
      expect(result.customTaxonomies).toHaveLength(1);
      const tax = result.customTaxonomies[0];
      expect(tax.slug).toBe('genre');
      expect(tax.singularName).toBe('Genre');
      expect(tax.pluralName).toBe('Genres');
      expect(tax.postTypes).toEqual(['book', 'movie']);
      expect(tax.hierarchical).toBe(true);
      expect(tax.showAdminColumn).toBe(true);
      expect(tax.showInRest).toBe(true);
      expect(tax.rewriteSlug).toBe('genres');
    });

    it('extracts taxonomy with single postType string', () => {
      const { result, diagnostics } = extract(`
        ${decoratorDefs}
        function CustomTaxonomy(slug: string, opts: any): ClassDecorator { return (t) => {}; }

        @Plugin({ name: 'Test', description: '', version: '1.0.0', author: '', license: 'GPL' })
        @CustomTaxonomy('genre', {
          singularName: 'Genre',
          pluralName: 'Genres',
          postTypes: 'book',
        })
        class TestPlugin {}
      `);

      expect(diagnostics.hasErrors()).toBe(false);
      expect(result.customTaxonomies[0].postTypes).toEqual(['book']);
    });

    it('reports error for missing postTypes', () => {
      const { diagnostics } = extract(`
        ${decoratorDefs}
        function CustomTaxonomy(slug: string, opts: any): ClassDecorator { return (t) => {}; }

        @Plugin({ name: 'Test', description: '', version: '1.0.0', author: '', license: 'GPL' })
        @CustomTaxonomy('genre', {
          singularName: 'Genre',
          pluralName: 'Genres',
        })
        class TestPlugin {}
      `);

      expect(diagnostics.hasErrors()).toBe(true);
      expect(diagnostics.getErrors().some((e) => e.code === 'WPTS085')).toBe(true);
    });
  });

  describe('@RestRoute', () => {
    it('extracts REST route', () => {
      const { result, diagnostics } = extract(`
        ${decoratorDefs}
        function RestRoute(route: string, opts: any): MethodDecorator { return (t, p, d) => {}; }

        @Plugin({ name: 'Test', description: '', version: '1.0.0', author: '', license: 'GPL' })
        class TestPlugin {
          @RestRoute('/products', { method: 'GET', capability: 'read' })
          listProducts(request: any): any {
            return [];
          }
        }
      `);

      expect(diagnostics.hasErrors()).toBe(false);
      expect(result.restRoutes).toHaveLength(1);
      expect(result.restRoutes[0].route).toBe('/products');
      expect(result.restRoutes[0].method).toBe('GET');
      expect(result.restRoutes[0].capability).toBe('read');
      expect(result.restRoutes[0].methodName).toBe('listProducts');
    });

    it('defaults capability to manage_options', () => {
      const { result } = extract(`
        ${decoratorDefs}
        function RestRoute(route: string, opts: any): MethodDecorator { return (t, p, d) => {}; }

        @Plugin({ name: 'Test', description: '', version: '1.0.0', author: '', license: 'GPL' })
        class TestPlugin {
          @RestRoute('/admin-data', { method: 'POST' })
          saveData(request: any): any {}
        }
      `);

      expect(result.restRoutes[0].capability).toBe('manage_options');
    });

    it('reports error for missing method', () => {
      const { diagnostics } = extract(`
        ${decoratorDefs}
        function RestRoute(route: string, opts: any): MethodDecorator { return (t, p, d) => {}; }

        @Plugin({ name: 'Test', description: '', version: '1.0.0', author: '', license: 'GPL' })
        class TestPlugin {
          @RestRoute('/products', { capability: 'read' })
          listProducts(request: any): any { return []; }
        }
      `);

      expect(diagnostics.hasErrors()).toBe(true);
      expect(diagnostics.getErrors().some((e) => e.code === 'WPTS093')).toBe(true);
    });
  });

  describe('@AjaxHandler', () => {
    it('extracts AJAX handler with defaults', () => {
      const { result, diagnostics } = extract(`
        ${decoratorDefs}
        function AjaxHandler(action: string, opts?: any): MethodDecorator { return (t, p, d) => {}; }

        @Plugin({ name: 'Test', description: '', version: '1.0.0', author: '', license: 'GPL' })
        class TestPlugin {
          @AjaxHandler('delete_item')
          handleDelete(): void {}
        }
      `);

      expect(diagnostics.hasErrors()).toBe(false);
      expect(result.ajaxHandlers).toHaveLength(1);
      expect(result.ajaxHandlers[0].action).toBe('delete_item');
      expect(result.ajaxHandlers[0].public).toBe(false);
      expect(result.ajaxHandlers[0].capability).toBe('manage_options');
      expect(result.ajaxHandlers[0].nonce).toBe(true);
      expect(result.ajaxHandlers[0].methodName).toBe('handleDelete');
    });

    it('extracts AJAX handler with custom options', () => {
      const { result } = extract(`
        ${decoratorDefs}
        function AjaxHandler(action: string, opts?: any): MethodDecorator { return (t, p, d) => {}; }

        @Plugin({ name: 'Test', description: '', version: '1.0.0', author: '', license: 'GPL' })
        class TestPlugin {
          @AjaxHandler('load_more', { public: true, capability: 'read', nonce: false })
          loadMore(): void {}
        }
      `);

      expect(result.ajaxHandlers[0].public).toBe(true);
      expect(result.ajaxHandlers[0].capability).toBe('read');
      expect(result.ajaxHandlers[0].nonce).toBe(false);
    });

    it('reports error for missing action name', () => {
      const { diagnostics } = extract(`
        ${decoratorDefs}
        function AjaxHandler(action: string, opts?: any): MethodDecorator { return (t, p, d) => {}; }

        @Plugin({ name: 'Test', description: '', version: '1.0.0', author: '', license: 'GPL' })
        class TestPlugin {
          @AjaxHandler()
          handleDelete(): void {}
        }
      `);

      expect(diagnostics.hasErrors()).toBe(true);
      expect(diagnostics.getErrors().some((e) => e.code === 'WPTS095')).toBe(true);
    });
  });

  describe('extractDecoratorsFromFiles (multi-file)', () => {
    function parseMultipleFiles(files: Record<string, string>) {
      const compilerOptions: ts.CompilerOptions = {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
        strict: true,
        esModuleInterop: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        skipLibCheck: true,
        noEmit: true,
      };

      const fileNames = Object.keys(files);
      const host = ts.createCompilerHost(compilerOptions);
      const originalGetSourceFile = host.getSourceFile.bind(host);

      host.getSourceFile = (name, languageVersion, onError, shouldCreate) => {
        if (files[name]) {
          return ts.createSourceFile(name, files[name], languageVersion, true);
        }
        return originalGetSourceFile(name, languageVersion, onError, shouldCreate);
      };

      host.fileExists = (name) => {
        if (files[name]) return true;
        return ts.sys.fileExists(name);
      };

      host.readFile = (name) => {
        if (files[name]) return files[name];
        return ts.sys.readFile(name);
      };

      const program = ts.createProgram(fileNames, compilerOptions, host);
      const sourceFiles = fileNames.map((name) => program.getSourceFile(name)!);
      return { sourceFiles, typeChecker: program.getTypeChecker() };
    }

    it('merges decorators from multiple files', () => {
      const { sourceFiles, typeChecker } = parseMultipleFiles({
        'entry.ts': `
          ${decoratorDefs}
          function RestRoute(route: string, opts: any): MethodDecorator { return (t, p, d) => {}; }

          @Plugin({ name: 'Multi File', description: '', version: '1.0.0', author: '', license: 'GPL' })
          class MyPlugin {
            @Setting({ key: 'greeting', type: 'string', default: 'Hi', label: 'Greeting' })
            greeting: string = 'Hi';

            @Action('init')
            onInit(): void {}
          }
        `,
        'routes.ts': `
          ${decoratorDefs}
          function RestRoute(route: string, opts: any): MethodDecorator { return (t, p, d) => {}; }

          class Routes {
            @RestRoute('/items', { method: 'GET', capability: 'read' })
            listItems(request: any): any { return []; }
          }
        `,
      });

      const diagnostics = new DiagnosticCollection();
      const result = extractDecoratorsFromFiles(sourceFiles, typeChecker, diagnostics);

      expect(diagnostics.hasErrors()).toBe(false);
      expect(result.plugin).not.toBeNull();
      expect(result.plugin!.name).toBe('Multi File');
      expect(result.settings).toHaveLength(1);
      expect(result.actions).toHaveLength(1);
      expect(result.restRoutes).toHaveLength(1);
      expect(result.restRoutes[0].route).toBe('/items');
    });

    it('reports WPTS002 for duplicate @Plugin across files', () => {
      const { sourceFiles, typeChecker } = parseMultipleFiles({
        'entry.ts': `
          ${decoratorDefs}
          @Plugin({ name: 'Plugin A', description: '', version: '1.0.0', author: '', license: 'GPL' })
          class PluginA {}
        `,
        'other.ts': `
          ${decoratorDefs}
          @Plugin({ name: 'Plugin B', description: '', version: '1.0.0', author: '', license: 'GPL' })
          class PluginB {}
        `,
      });

      const diagnostics = new DiagnosticCollection();
      extractDecoratorsFromFiles(sourceFiles, typeChecker, diagnostics);

      expect(diagnostics.hasErrors()).toBe(true);
      expect(diagnostics.getErrors().some((e) => e.code === 'WPTS002')).toBe(true);
    });

    it('reports WPTS001 when no file has @Plugin', () => {
      const { sourceFiles, typeChecker } = parseMultipleFiles({
        'a.ts': `
          ${decoratorDefs}
          class Foo {
            @Action('init')
            onInit(): void {}
          }
        `,
        'b.ts': `
          ${decoratorDefs}
          class Bar {}
        `,
      });

      const diagnostics = new DiagnosticCollection();
      extractDecoratorsFromFiles(sourceFiles, typeChecker, diagnostics);

      expect(diagnostics.hasErrors()).toBe(true);
      expect(diagnostics.getErrors().some((e) => e.code === 'WPTS001')).toBe(true);
    });
  });

  describe('full plugin', () => {
    it('extracts all decorators from a complete plugin', () => {
      const { result, diagnostics } = extract(`
        ${decoratorDefs}
        @Plugin({
          name: 'Hello Greeter',
          description: 'A greeting plugin.',
          version: '1.0.0',
          author: 'Jane',
          license: 'GPL-2.0+',
          textDomain: 'hello-greeter',
        })
        class HelloGreeter {
          @Setting({ key: 'greeting_message', type: 'string', default: 'Hello!', label: 'Greeting' })
          greetingMessage: string = 'Hello!';

          @Activate()
          onActivation(): void {}

          @Deactivate()
          onDeactivation(): void {}

          @Uninstall()
          onUninstall(): void {}

          @Action('init')
          initialize(): void {}

          @Filter('the_content')
          appendGreeting(content: string): string { return content; }

          @Shortcode('hello_greet')
          greetShortcode(atts: Record<string, string>): string { return ''; }
        }
      `);

      expect(diagnostics.hasErrors()).toBe(false);
      expect(result.plugin!.name).toBe('Hello Greeter');
      expect(result.settings).toHaveLength(1);
      expect(result.actions).toHaveLength(1);
      expect(result.filters).toHaveLength(1);
      expect(result.shortcodes).toHaveLength(1);
      expect(result.activation).not.toBeNull();
      expect(result.deactivation).not.toBeNull();
      expect(result.uninstall).not.toBeNull();
    });
  });
});
