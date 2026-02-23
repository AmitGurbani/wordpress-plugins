---
name: commit
description: Create a conventional commit with emoji prefix
disable-model-invocation: true
---

Create a git commit following the project's conventional commit format with emoji prefixes.

## Commit Message Format

```
<type>(<scope>): <emoji> <subject>

[optional body]

[optional footer]
```

## Types and Emojis

- `feat`: ✨ New feature
- `fix`: 🐛 Bug fix
- `docs`: 📝 Documentation changes
- `style`: 💄 Code style/formatting (no logic changes)
- `refactor`: ♻️ Code refactoring
- `perf`: ⚡ Performance improvements
- `test`: ✅ Adding or updating tests
- `chore`: 🔧 Maintenance tasks, dependencies
- `ci`: 👷 CI/CD changes
- `build`: 📦 Build system changes
- `revert`: ⏪ Revert previous commit

## Scopes

Common scopes in this project:
- `wpts` - TypeScript-to-WordPress-Plugin transpiler
- `monorepo` - Turborepo/workspace changes
- `deps` - Dependency updates
- `config` - Configuration files (tsconfig, turbo, etc.)

## CRITICAL: No Attribution in Commits

**DO NOT add any Claude Code attribution to commit messages.**

Commit messages must be clean and end after the optional body/footer. Never include:
- "Generated with Claude Code"
- "Co-Authored-By: Claude"
- Links to claude.com
- Any other attribution lines

The commit message should contain ONLY:
- Type, scope, emoji, and subject line
- Optional body explaining "why"
- Optional footer (issue references, breaking changes)

## Instructions

1. Run `git status` to see what files are staged/modified
2. Run `git diff --staged` to review staged changes
3. Run `git log --oneline -10` to see recent commit style
4. Analyze the changes and determine:
   - Type (feat, fix, docs, etc.)
   - Scope (which package/area affected)
   - Clear, concise subject line (50 chars max)
   - Body if needed to explain "why" not "what"
5. Stage any unstaged files that should be included: `git add <files>`
6. Create the commit with proper format (NO ATTRIBUTION!)
7. Run `git status` after committing to confirm

## Examples

```bash
# New feature in wpts
git commit -m "feat(wpts): ✨ add post management functions"

# Bug fix with body
git commit -m "fix(wpts): 🐛 resolve decorator extraction for nested classes

The extractor was skipping inner class declarations when
multiple decorators were applied to the same method."

# Documentation update
git commit -m "docs(wpts): 📝 update README with HTTP API functions"

# Test addition
git commit -m "test(wpts): ✅ add integration tests for settings sanitization"

# Dependency upgrade
git commit -m "chore(deps): ⬆️ upgrade vitest to v4.1.0"

# Monorepo change
git commit -m "build(monorepo): 📦 add turbo pipeline for lint task"

# Config update
git commit -m "chore(config): 🔧 update tsconfig to NodeNext"
```

## Important Notes

- Keep subject line under 50 characters
- Use imperative mood ("add" not "added" or "adds")
- Don't end subject line with period
- Reference issue numbers in body/footer: "Fixes #123"
- Use body to explain "why" the change was needed

## What Not to Commit

- Files with secrets (`.env`, `credentials.json`)
- Large binary files
- Generated files (`dist/`, `node_modules/`)
- Editor-specific files (`.vscode/`, `.idea/`)
- Local settings (`.claude/settings.local.json`)
