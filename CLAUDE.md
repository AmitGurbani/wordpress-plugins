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
- Plugin packages track generated PHP output in `dist/` (via `!dist/` in their `.gitignore`). Rebuild plugins after wpts changes and commit the updated PHP so diffs are reviewable.

## Commits

Format: `<type>(<scope>): <emoji> <subject>`

Types: feat ✨, fix 🐛, docs 📝, style 💄, refactor ♻️, perf ⚡, test ✅, chore 🔧, ci 👷, build 📦, revert ⏪
Scopes: wpts, admin-ui, monorepo, deps, config

**No attribution** — never add "Co-Authored-By: Claude", "Generated with Claude Code", or claude.com links to commits.
