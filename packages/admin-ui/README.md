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

### `FormSection`

Consistent padding and optional max-width constraint for tab content. Replaces the common `<div style={{ padding: '16px 0', maxWidth: '600px' }}>` wrapper.

```tsx
<FormSection>            {/* narrow (600px max-width) by default */}
  <TextControl ... />
</FormSection>

<FormSection narrow={false}> {/* full width — for tables, analytics */}
  <table ... />
</FormSection>
```

### `AlertBox`

Colored alert banner with title. Supports `warning`, `info`, `success`, and `error` variants.

```tsx
<AlertBox variant="warning" title="Test Mode Active">
  <p>OTPs will not be delivered.</p>
</AlertBox>
```

### `InfoPopover`

Icon button that toggles a popover with arbitrary content. Manages its own open/close state.

```tsx
<InfoPopover label="Placeholder reference">
  <strong>Available Placeholders</strong>
  <table>...</table>
</InfoPopover>
```

### `SecretField`

Password input that auto-appends a localized "Never exposed to the browser." suffix to the help text.

```tsx
<SecretField
  label="API Secret"
  help="Measurement Protocol API secret from GA4."
  textDomain="my-plugin"
  value={settings.api_secret}
  onChange={(v) => update('api_secret', v)}
/>
```

### Types

`SettingsConfig`, `SettingsState`, `SettingsShellProps`, `TabDef`, `TabProps`, `DiagnosticsConfig`, `FormSectionProps`, `AlertBoxProps`, `AlertVariant`, `InfoPopoverProps`, `SecretFieldProps`

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
