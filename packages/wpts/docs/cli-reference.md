# CLI Reference

## `wpts init [directory]`

Scaffold a new project with example `plugin.ts`, `admin/index.tsx`, and `tsconfig.json`.

```bash
wpts init my-plugin --name "My Plugin" --slug my-plugin --author "Jane Dev"
```

| Option | Description |
|--------|-------------|
| `--name <name>` | Plugin name |
| `--slug <slug>` | Plugin slug |
| `--author <author>` | Author name |

## `wpts build [file]`

Transpile TypeScript to a complete WordPress plugin.

```bash
wpts build                              # Uses src/plugin.ts
wpts build src/plugin.ts -o ./build     # Custom entry and output
wpts build --clean                      # Clean output directory first
```

| Option | Description | Default |
|--------|-------------|---------|
| `-o, --outDir <dir>` | Output directory | `./dist` |
| `--clean` | Clean output before build | `false` |
| `--zip` | Generate a `.zip` file for WordPress upload | `false` |

Admin React builds cache `node_modules` in `.wpts-cache/` to avoid reinstalling dependencies on every build. The cache invalidates automatically when `package.json` dependencies change. Delete `.wpts-cache/` to force a fresh install.

## `wpts validate [file]`

Check source for errors without generating output.

```bash
wpts validate                  # Check src/plugin.ts
wpts validate --strict         # Fail on warnings too
```

## `wpts watch [file]`

Watch source files and rebuild on changes.

```bash
wpts watch                              # Watch src/plugin.ts
wpts watch src/plugin.ts -o ./build     # Custom entry and output
```

## Configuration

Create `wpts.config.json` (or `wpts.config.js`) in your project root. CLI flags override config values.

```json
{
  "entry": "src/plugin.ts",
  "outDir": "./dist",
  "clean": true,
  "adminSrcDir": "src/admin"
}
```

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `entry` | `string` | Entry TypeScript file | `src/plugin.ts` |
| `outDir` | `string` | Output directory | `./dist` |
| `clean` | `boolean` | Clean output before build | `false` |
| `adminSrcDir` | `string` | Admin React source directory | `src/admin` |
