# wpts

Write WordPress plugins in TypeScript. wpts transpiles your decorator-annotated TypeScript into a complete, installable WordPress plugin with PHP backend, React admin pages, auto-generated REST API, and full plugin boilerplate.

**Requires Node.js >= 20**

## Quick Start

```bash
# Scaffold a new plugin project
npx wpts init my-plugin --name "My Plugin" --slug my-plugin

# Build the plugin
cd my-plugin
npx wpts build

# Output is in dist/my-plugin/ — copy to wp-content/plugins/
```

The generated plugin includes:

```
my-plugin/
├── my-plugin.php              # Plugin entry with header
├── includes/
│   ├── class-my-plugin.php    # Main orchestrator
│   ├── class-my-plugin-loader.php
│   ├── class-my-plugin-activator.php
│   ├── class-my-plugin-deactivator.php
│   └── class-my-plugin-rest-api.php   # Auto-generated from @Setting / @RestRoute
├── admin/
│   ├── class-my-plugin-admin.php
│   └── js/                    # React admin UI
│       ├── src/               # Your admin/*.tsx files (copied)
│       └── package.json       # wp-scripts build config
├── public/
│   └── class-my-plugin-public.php
├── uninstall.php
└── readme.txt
```

The React admin UI is **auto-built** during `wpts build` when `@AdminPage` is used. For development mode with hot reload, run `pnpm run start` inside `admin/js/`.

## How It Works

You write two types of files:

1. **`src/plugin.ts`** — Plugin backend logic with decorators. Transpiled to PHP.
2. **`src/admin/index.tsx`** — Admin page UI in React. Bundled with `@wordpress/scripts`.

The `@Setting` decorators automatically generate a REST API endpoint (`/your-plugin/v1/settings`) so your React admin page can read and write settings without any manual REST API code.

## Documentation

- **[CLI Reference](docs/cli-reference.md)** — `init`, `build`, `validate`, `watch` commands and `wpts.config.json` configuration
- **[Decorator API](docs/decorator-api.md)** — All 14 decorators: @Plugin, @Setting, @Action, @Filter, @AdminPage, @CustomPostType, @CustomTaxonomy, @RestRoute, @AjaxHandler, @Shortcode, @Activate, @Deactivate, @DiagnosticsRoute, and helper methods
- **[Admin Pages](docs/admin-pages.md)** — React admin UI pattern, admin-ui components, development mode
- **[Transpilation](docs/transpilation.md)** — TypeScript to PHP rules, supported constructs, 680+ WordPress/WooCommerce/PHP functions, JavaScript method mappings

## Multi-File Plugins

Split large plugins across multiple TypeScript files. Use standard `import` statements — the transpiler resolves all imported files and merges decorators from every file into a single plugin.

```
src/
├── plugin.ts          # Entry file with @Plugin decorator
├── routes.ts          # REST routes (@RestRoute)
├── hooks.ts           # Actions and filters (@Action, @Filter)
└── admin/index.tsx    # React admin UI (not transpiled)
```

**Entry file** (`plugin.ts`): Must contain exactly one `@Plugin` decorator. Import other files:

```typescript
import './routes.js';
import './hooks.js';

@Plugin({ name: 'My Plugin', ... })
class MyPlugin {
  @Setting({ key: 'api_key', type: 'string', default: '', label: 'API Key' })
  apiKey: string = '';
}
```

**Other files** (`routes.ts`): Contain decorated classes — no `@Plugin` needed:

```typescript
@RestRoute('/items', { method: 'GET', capability: 'read' })
listItems(request: any): any {
  return getPosts({ post_type: 'item' });
}
```

All decorators (`@Action`, `@Filter`, `@Setting`, `@RestRoute`, `@AjaxHandler`, etc.) work in any file. The transpiler merges everything into the same generated plugin output.

> See [`headless-auth`](../headless-auth/) for a real-world example using multi-file structure.

## Examples

See the `examples/` directory:

- **`hello-world/`** — Simple plugin with one admin page, two settings, action, filter, and shortcode.
- **`settings-demo/`** — Advanced example with 5 setting types, multiple admin pages (main page + sub-page), tabbed React UI.

Build an example:

```bash
npx wpts build examples/hello-world/src/plugin.ts -o /tmp/hello-world --clean
```

## License

MIT
