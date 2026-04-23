# WordPress Plugins Monorepo

Turborepo monorepo with pnpm workspaces.

## Commands

- `pnpm install` — Install all dependencies
- `turbo run build` — Build all packages
- `turbo run test` — Run all tests
- `pnpm --filter <package> <script>` — Run script in specific package
- `pnpm lint` — Lint all packages (via turbo)
- `pnpm check` — Lint + format check all packages (via turbo, for CI)
- `pnpm format` — Auto-format entire monorepo
- `pnpm biome check --write .` — Fix all auto-fixable lint + format issues
- `pnpm test:e2e` — Run Playwright e2e tests (requires Docker for wp-env)
- `pnpm --filter e2e test:ui` — Run e2e tests with Playwright UI mode

## Conventions

- Package manager: pnpm (not npm or yarn)
- All packages live in `packages/`
- Use turbo for orchestrating build/test/lint across packages
- Pre-commit hook (simple-git-hooks + lint-staged) runs `biome check --write` on staged files automatically
- Plugin packages track generated output in `dist/` (via `!dist/` in their `.gitignore`), excluding only ZIP archives. Rebuild plugins after wpts or admin-ui changes and commit the updated dist so diffs are reviewable.

## Agents, Skills & Rules

Custom agents (`.claude/agents/`):
- `quick-search` — Haiku model, read-only. Cheap codebase search.
- `plugin-updater` — Sonnet model, worktree isolation. Parallel cross-plugin updates.
- `reviewer` — Sonnet model, background. Auto-invokes after code changes, has persistent project memory.

Skills (`.claude/skills/`):
- `/wp-plugin-review [plugin-name]` — Full review of generated PHP dist output
- `/commit` — Conventional commit with emoji prefix
- `/add-wp-function [category]` — Add WordPress function mappings to wpts transpiler
- `/check-website-sync [plugin-slug]` — Audit `packages/website` for drift against headless plugin sources (missing entries, endpoint/name mismatches, missing code examples)

Path-scoped rules (`.claude/rules/`):
- `headless-plugins.md` — Shared plugin authoring guardrails, loads for `packages/headless-*/src/**`
- `dist-output.md` — Guards against editing generated output, loads for `packages/*/dist/**`

## Releases

- `./scripts/bump-version.sh <plugin> <patch|minor|major>` — Bump version in package.json, src/plugin.ts, readme.txt
- Release workflow (`.github/workflows/release.yml`) — workflow_dispatch, bumps version, builds, generates changelog, tags (`<plugin>@<version>`), creates GitHub Release with ZIP
- Run `/wp-plugin-review` on dist/ output before releasing

## Commits

Format: `<type>(<scope>): <emoji> <subject>`

Types: feat ✨, fix 🐛, docs 📝, style 💄, refactor ♻️, perf ⚡, test ✅, chore 🔧, ci 👷, build 📦, revert ⏪
Scopes: wpts, admin-ui, e2e, monorepo, deps, config

**No attribution** — never add "Co-Authored-By: Claude", "Generated with Claude Code", or claude.com links to commits.
