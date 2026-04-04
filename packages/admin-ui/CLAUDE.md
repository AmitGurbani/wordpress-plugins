# admin-ui — Shared WordPress Admin Components

Reusable React components and hooks for WordPress plugin admin pages, consumed by all headless plugin `src/admin/` directories.

## Commands

- `pnpm build` — Compile TypeScript (`tsc -p tsconfig.build.json`)
- `pnpm dev` — Watch mode compilation
- `pnpm lint` — Lint with Biome
- `pnpm check` — Lint + format check

## Exports

Components: `SettingsShell`, `DiagnosticsPanel`, `FormSection`, `AlertBox`, `InfoPopover`, `SecretField`
Hooks: `useSettings`
Types: `SettingsConfig`, `SettingsState`, `TabDef`, `TabProps`, `SettingsShellProps`, `DiagnosticsConfig`, `FormSectionProps`, `AlertBoxProps`, `AlertVariant`, `InfoPopoverProps`, `SecretFieldProps`

All public types live in `types.ts` and are re-exported from `index.ts`.

## Conventions

- Breaking changes affect all 7 headless plugin admin UIs — test across plugins after changes
- WordPress peer dependencies only: `@wordpress/components`, `@wordpress/element`, `@wordpress/i18n`, `@wordpress/api-fetch` — never import from `react` directly
- `useSettings<S>` is generic over the settings shape; handles load/save/error via `apiFetch` to `/{slug}/v1/settings`
- `SettingsShell` provides standard layout: title, TabPanel, Save button with loading/saved/error states — plugins compose with this, not build custom layouts
- `DiagnosticsPanel` is self-contained with its own fetch logic
- Build is plain `tsc` to `dist/` (not wp-scripts) — consumed as a library at build time by wp-scripts in each plugin
