# admin-ui

Shared React components and hooks for WordPress plugin admin pages. Used by all `headless-*` plugin packages in this monorepo.

Built on `@wordpress/components` and `@wordpress/api-fetch`.

## Exports

### `useSettings<S>(config)`

Hook that manages loading, saving, and updating plugin settings via the auto-generated wpts REST API (`/{slug}/v1/settings`).

```tsx
const { settings, loading, saving, saved, error, update, save } = useSettings({
  slug: 'my-plugin',
  textDomain: 'my-plugin',
  defaults: { api_key: '', enabled: true },
});
```

### `SettingsShell<S>`

Tabbed settings page layout with save button, loading spinner, and save/error feedback.

```tsx
<SettingsShell title="My Plugin" textDomain="my-plugin" tabs={tabs} settingsState={state}>
  {(tab, { settings, update }) => {
    if (tab.name === 'general') return <GeneralTab settings={settings} update={update} />;
  }}
</SettingsShell>
```

### `DiagnosticsPanel`

Panel for testing external service connections and viewing the last logged error.

```tsx
<DiagnosticsPanel
  slug="my-plugin"
  textDomain="my-plugin"
  testAction={{
    path: '/my-plugin/v1/diagnostics/test',
    buttonLabel: 'Test Connection',
    title: 'Connection Test',
    description: 'Send a test request to verify connectivity.',
  }}
/>
```

### Types

`SettingsConfig`, `SettingsState`, `SettingsShellProps`, `TabDef`, `TabProps`, `DiagnosticsConfig`

## Peer Dependencies

- `@wordpress/api-fetch`
- `@wordpress/components`
- `@wordpress/element`
- `@wordpress/i18n`

These are provided by the WordPress admin environment at runtime.

## Development

```bash
pnpm build    # Compile TypeScript to dist/
pnpm dev      # Watch mode
```
