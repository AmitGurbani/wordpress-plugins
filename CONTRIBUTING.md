# Contributing

Thanks for your interest in contributing! This guide will help you get started.

## Prerequisites

- **Node.js** >= 20
- **pnpm** (install via `corepack enable`)
- **Docker** (for e2e tests only)

## Setup

```bash
git clone https://github.com/AmitGurbani/wordpress-plugins.git
cd wordpress-plugins
pnpm install
turbo run build
```

## Project Structure

```
docs/                # Architecture guide
packages/
  admin-ui/          # Shared React admin UI components
  wpts/              # TypeScript-to-WordPress-Plugin transpiler (MIT)
  headless-*/        # WordPress plugins built with wpts
  website/           # Landing page (Astro 6 + Tailwind CSS 4)
  e2e/               # Playwright end-to-end tests
```

## Development Workflow

### Running Scripts

```bash
pnpm --filter <package> <script>   # Run in a specific package
turbo run build                     # Build all packages
turbo run test                      # Test all packages
```

### Linting & Formatting

This project uses [Biome](https://biomejs.dev/) for linting and formatting.

```bash
pnpm lint                           # Lint all packages
pnpm check                          # Lint + format check (CI)
pnpm format                         # Auto-format everything
pnpm biome check --write .          # Fix all auto-fixable issues
```

A pre-commit hook (via `simple-git-hooks` + `lint-staged`) automatically runs `biome check --write` on staged files, so formatting and lint fixes are applied before every commit.

### E2E Tests

Requires Docker for the [wp-env](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-env/) WordPress instance.

```bash
pnpm test:e2e                       # Run all e2e tests
pnpm --filter e2e test:ui           # Playwright UI mode
```

## Building Plugins

After changing plugin source (`packages/headless-*/src/`) or shared packages (`admin-ui`, `wpts`):

```bash
pnpm --filter <plugin-name> build
```

The `dist/` directory is tracked in git. Always commit updated `dist/` alongside your source changes so diffs are reviewable.

## Commit Conventions

Format: `<type>(<scope>): <emoji> <subject>`

| Type | Emoji | Use |
|------|-------|-----|
| feat | ✨ | New feature |
| fix | 🐛 | Bug fix |
| docs | 📝 | Documentation |
| style | 💄 | Formatting, no code change |
| refactor | ♻️ | Code change that neither fixes a bug nor adds a feature |
| perf | ⚡ | Performance improvement |
| test | ✅ | Adding or updating tests |
| chore | 🔧 | Maintenance, config |
| ci | 👷 | CI/CD changes |
| build | 📦 | Build system changes |

Scopes: `wpts`, `admin-ui`, `e2e`, `monorepo`, `deps`, `config`, or a specific plugin name.

Examples:
- `feat(wpts): ✨ add @Cron decorator support`
- `fix(headless-meta-pixel): 🐛 handle missing currency in order data`

## Releases & Versioning

Plugins use [semantic versioning](https://semver.org/) and are released independently via GitHub Releases.

**Version bump script** — updates `package.json`, `src/plugin.ts`, and `readme.txt`:

```bash
./scripts/bump-version.sh <plugin-name> <patch|minor|major>
```

**Release workflow** — triggered manually from GitHub Actions (**Actions > Release > Run workflow**). It bumps the version, builds the plugin, generates a changelog from commits, commits the changes, creates a git tag (`<plugin>@<version>`), and publishes a GitHub Release with the ZIP attached.

Only maintainers can trigger releases.

## Pull Requests

1. Fork the repository and create a branch from `main`
2. Make your changes and ensure all checks pass: `pnpm check && pnpm build && pnpm test`
3. Commit using the conventions above
4. Open a PR with a clear description of what and why

## Code Style

- TypeScript everywhere (source files)
- Biome handles formatting and linting — no manual style enforcement needed
- WordPress functions use camelCase in TypeScript, mapped to snake_case PHP by wpts

## License

By contributing, you agree that your contributions will be licensed under GPL-2.0-or-later (or MIT for the `wpts` package).
