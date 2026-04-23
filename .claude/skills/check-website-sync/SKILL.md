---
name: check-website-sync
description: Audit packages/website for drift against the headless plugin source of truth. Reports missing plugins, orphaned entries, endpoint mismatches, metadata drift, and missing code examples so the marketing site stays in sync as plugins evolve.
argument-hint: [plugin-slug]
---

Audit `packages/website` against the headless plugin packages for content drift.

## Why this skill exists

The marketing site at `packages/website` is a static Astro site with hardcoded plugin metadata in `src/data/plugins.ts` and `src/data/code-examples.ts`. Plugin source — decorators, readmes, package.json — evolves independently. Without a check, the website silently falls behind (new plugins never listed, removed endpoints still advertised, renamed plugins, outdated feature lists).

This skill is the reconciliation step. Run it:
- After adding a new headless plugin
- After changing `@RestRoute` paths, plugin names, or top-level descriptions
- Before cutting a website release
- As part of `/wp-plugin-review`-adjacent pre-release checks

## Input

`$ARGUMENTS` is optional:
- A plugin slug (e.g., `headless-auth`) — audit only that plugin's website coverage
- Empty — audit every `packages/headless-*` plugin against the website

## Sources of truth (plugin side)

For each `packages/headless-*/`:
- `package.json` — `name`, `version`
- `src/plugin.ts` — `@Plugin({ name, description, ... })` and `@Setting({ exposeInConfig: true })` markers
- `src/*-routes.ts` and `src/plugin.ts` — `@RestRoute('/path', { method, public?, capability? })` decorators (the actual API surface)
- `readme.txt` — `Stable tag`, top `== Description ==` blurb, feature bullets
- `CLAUDE.md` — plugin-specific context (namespace, WooCommerce dependency, category hints)

## Targets (website side)

- `packages/website/src/data/plugins.ts` — `plugins[]` with `slug`, `name`, `tagline`, `description`, `features[]`, `namespace`, `category`, `wooCommerce`, `endpoints[]`, `faqs[]`, `githubPath`
- `packages/website/src/data/code-examples.ts` — `codeExamples[]` with per-slug request/response snippets
- `packages/website/src/pages/plugins/[slug].astro` — dynamic route, driven by `plugins[]`, no per-plugin edit needed

## Non-plugin packages — ignore

These live in `packages/` but are NOT headless plugins and must be excluded from drift checks:
- `admin-ui`, `e2e`, `wpts`, `website`

Only audit directories matching `packages/headless-*/`.

## Workflow

1. **Enumerate plugin packages** — glob `packages/headless-*/package.json`. Build the authoritative list of `{slug, pkgName, version, path}`.
2. **Read website data** — read `packages/website/src/data/plugins.ts` and `packages/website/src/data/code-examples.ts`. Parse out the `slug` field from each entry (a simple regex on `slug: '...'` is sufficient; no JS evaluation needed).
3. **Run drift checks** (below) for each plugin in scope.
4. **Produce the report** in the exact format at the bottom of this file.

## Drift checks

### A. Missing website entry — [CRITICAL]
Plugin exists in `packages/headless-*/` but has no entry in `plugins.ts`.
- Report: plugin slug, suggested draft entry (pulled from `@Plugin()` name/description and `readme.txt` top features).

### B. Orphaned website entry — [CRITICAL]
`plugins.ts` lists a slug with no corresponding `packages/headless-*/` directory.
- Report: slug, recommend removal or package restoration.

### C. Endpoint drift — [WARNING]
Compare REST routes from `@RestRoute('/path', { method, ... })` decorators in `src/**/*.ts` against `endpoints[]` in `plugins.ts`.
- Report routes present in source but missing on website (new endpoints not advertised).
- Report routes present on website but missing in source (removed/renamed endpoints still advertised).
- Only compare `method` + `path`; the `description` field on the website is editorial and not checked.
- **Exclude admin-only routes from the comparison.** Routes declared with `capability: 'manage_options'` (e.g., `/otp/test-otp`, `/diagnostics/test-connection`) are internal diagnostics, not public API surface. They are intentionally hidden from the marketing site — do not flag them as missing.
- Consider public: routes with `public: true`, `capability: 'read'`, or any customer-facing capability. When in doubt, include the route; false-positives here are cheap to dismiss.
- Note: `@Setting({ exposeInConfig: true })` auto-generates a `GET /config` route. If a plugin has any `exposeInConfig` setting but no manual `@RestRoute('/config')`, treat `GET /config` as an expected endpoint.

### D. Name / description drift — [WARNING]
- `@Plugin({ name })` in `src/plugin.ts` vs `plugins[i].name` — must match exactly.
- `@Plugin({ description })` first sentence vs `plugins[i].description` first sentence — flag if the first sentence diverges materially (rewording is fine; flag only when facts differ, e.g., "required" vs "optional", different protocol/product names).
- Package `name` field in `package.json` (unscoped, e.g. `headless-auth`) vs website `slug` — they must match exactly.

### E. Missing code example — [WARNING]
Plugin exists and is listed in `plugins.ts` but has no matching `slug` in `code-examples.ts`. Not every plugin needs an example (some are passive config endpoints), so downgrade to INFO if the plugin has only a single `GET /config` endpoint.

### F. WooCommerce flag drift — [INFO]
- `plugins[i].wooCommerce` is `'required'` / `'optional'` / `'none'`.
- If `src/plugin.ts` has `@Plugin({ wooNotice: 'required' })`, website must be `'required'`.
- If `wooNotice: 'recommended'`, website should be `'optional'`.
- If no `wooNotice` and no WooCommerce imports/hooks referenced in `src/`, website should be `'none'`.

### G. Namespace drift — [INFO]
`plugins[i].namespace` should be `<slug>/v1` matching the REST namespace in `src/plugin.ts` (usually derived from the plugin slug by the transpiler). Flag if they disagree.

## What NOT to flag

- **Tagline wording** — `plugins[i].tagline` is pure marketing copy. Never flag it.
- **Feature bullets** — `plugins[i].features[]` is hand-curated marketing copy. Only flag if an entire plugin's feature list is empty. Do not try to reconcile it against `readme.txt` bullets line-by-line.
- **FAQ drift** — FAQs are editorial. Out of scope.
- **Endpoint `description` text** — editorial; compare path + method only.
- **Category** — `plugins[i].category` is a marketing grouping with no source-of-truth equivalent. Do not flag.
- **`githubPath`** — a URL string. Only flag if the slug segment doesn't match the plugin's actual directory name.

## Output format

```markdown
## Website Sync Audit

### Summary
- **Plugins in scope:** N
- **Drift findings:** X critical, Y warnings, Z info
- **Overall:** IN SYNC | MINOR DRIFT | NEEDS UPDATE

### Critical

#### [CRITICAL] Missing website entry: <slug>
- **Plugin:** `packages/<slug>/`
- **Evidence:** `@Plugin({ name: '<name>' })` in `packages/<slug>/src/plugin.ts:<line>`
- **Fix:** add an entry to `packages/website/src/data/plugins.ts`. Suggested draft:
  ```ts
  {
    slug: '<slug>',
    name: '<name>',
    tagline: '<one-line from readme.txt>',
    description: '<first paragraph from readme.txt>',
    category: '<auth|analytics|ecommerce|search>',
    wooCommerce: '<required|optional|none>',
    namespace: '<slug>/v1',
    githubPath: `${REPO}/tree/main/packages/<slug>`,
    features: [ /* from readme.txt bullets */ ],
    endpoints: [ /* from public @RestRoute decorators — exclude capability:'manage_options' */ ],
    faqs: [],
  }
  ```
- **Category caveat:** the `Plugin.category` field is a union type (currently `'auth' | 'analytics' | 'ecommerce' | 'search'` at `packages/website/src/data/plugins.ts:19`). If the new plugin doesn't fit an existing category, the `Plugin` type AND the `categories` map (~line 375) must be extended together — flag this in the report so the user does both edits.

### Warnings

#### [WARNING] Endpoint drift: <slug>
- **Source has, website missing:** `POST /auth/refresh` (`packages/<slug>/src/<file>.ts:<line>`)
- **Website has, source missing:** `GET /legacy/foo` (`packages/website/src/data/plugins.ts:<line>`)
- **Fix:** update `endpoints[]` in `packages/website/src/data/plugins.ts` to match the decorators.

#### [WARNING] Name drift: <slug>
- **Source:** `'Headless POS Sessions'` (`packages/<slug>/src/plugin.ts:<line>`)
- **Website:** `'POS Sessions'` (`packages/website/src/data/plugins.ts:<line>`)
- **Fix:** align the website `name` field to the `@Plugin()` decorator.

### Informational

#### [INFO] Missing code example: <slug>
- Plugin has <N> endpoints; consider adding a `code-examples.ts` entry so visitors see a usable snippet.

### In-sync plugins
- [PASS] `<slug>` — endpoints, name, and metadata aligned.
- ...
```

**Severity rules:**
- **CRITICAL** — a plugin is completely missing from (or orphaned on) the website. The site is factually wrong.
- **WARNING** — endpoints, names, or descriptions mismatch; visitors would be misled.
- **INFO** — stylistic or soft-policy gaps (missing code example, wooCommerce flag nudge).

**Overall rating:**
- **IN SYNC** — 0 critical, 0-1 warnings.
- **MINOR DRIFT** — 0 critical, 2+ warnings, or informational only.
- **NEEDS UPDATE** — any critical finding.

## Operational notes

- The skill is **read-only**. Never edit `plugins.ts` or `code-examples.ts` from this skill — surface findings and let the user apply them.
- Prefer `Grep` over `Bash find/grep`; prefer `Glob` over `ls`.
- When parsing `plugins.ts`, don't attempt to execute the TS. Regex on `slug:`, `name:`, `namespace:`, `wooCommerce:`, and the `endpoints: [` array is sufficient — the file is machine-written by humans and has a stable shape. Line numbers come from reading the file, not from a JS parse.
- When counting `@RestRoute` decorators, glob `packages/<slug>/src/**/*.ts` and grep for `@RestRoute\(`. Exclude `dist/`.
