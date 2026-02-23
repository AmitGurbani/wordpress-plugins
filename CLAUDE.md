# WordPress Plugins Monorepo

Turborepo monorepo with pnpm workspaces.

## Commands

- `pnpm install` — Install all dependencies
- `turbo run build` — Build all packages
- `turbo run test` — Run all tests
- `pnpm --filter <package> <script>` — Run script in specific package

## Conventions

- Package manager: pnpm (not npm or yarn)
- All packages live in `packages/`
- Use turbo for orchestrating build/test/lint across packages

## Commits

Format: `<type>(<scope>): <emoji> <subject>`

Types: feat ✨, fix 🐛, docs 📝, style 💄, refactor ♻️, perf ⚡, test ✅, chore 🔧, ci 👷, build 📦, revert ⏪
Scopes: wpts, monorepo, deps, config

**No attribution** — never add "Co-Authored-By: Claude", "Generated with Claude Code", or claude.com links to commits.
