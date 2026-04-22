# Admin Pages (React)

## Overview

Admin page UI is written as React using `@wordpress/components`. It stays as TypeScript/JSX and is bundled by `@wordpress/scripts` — it is **not** transpiled to PHP.

The React admin UI is **auto-built** during `wpts build` when `@AdminPage` is used. No manual build step is needed.

## Creating an Admin Page

Create `src/admin/index.tsx`:

```tsx
import { createRoot, useState, useEffect } from '@wordpress/element';
import { Panel, PanelBody, TextControl, Button, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

function SettingsPage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // REST endpoint auto-generated from @Setting decorators
    apiFetch({ path: '/my-plugin/v1/settings' }).then((data: any) => {
      setMessage(data.message);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    await apiFetch({
      path: '/my-plugin/v1/settings',
      method: 'POST',
      data: { message },
    });
    setSaving(false);
  };

  if (loading) return <Spinner />;

  return (
    <div className="wrap">
      <h1>{__('My Plugin Settings', 'my-plugin')}</h1>
      <Panel>
        <PanelBody title={__('General', 'my-plugin')}>
          <TextControl
            label={__('Message', 'my-plugin')}
            value={message}
            onChange={setMessage}
          />
        </PanelBody>
      </Panel>
      <Button variant="primary" onClick={save} isBusy={saving}>
        {__('Save', 'my-plugin')}
      </Button>
    </div>
  );
}

const rootElement = document.getElementById('my-plugin-admin-app');
if (rootElement) {
  createRoot(rootElement).render(<SettingsPage />);
}
```

## What the Generated PHP Does

The generated PHP admin class automatically:
- Registers the page with a `<div id="my-plugin-admin-app">` container
- Enqueues the React bundle from `admin/js/build/index.js`
- Loads `wp-components` styles

## Using admin-ui Components

For plugins in this monorepo, the shared [`admin-ui`](../../admin-ui/) package provides higher-level components that reduce boilerplate:

- **`useSettings<S>()`** — Hook for reading/saving settings via the auto-generated REST API
- **`SettingsShell`** — Tabbed settings page layout with save button
- **`DiagnosticsPanel`** — Error display and test connection UI
- **`FormSection`** — Grouped form layout
- **`AlertBox`** — Warning/error/success banners
- **`SecretField`** — Input field with show/hide toggle for sensitive values
- **`InfoPopover`** — Tooltip popover for setting descriptions

Example using admin-ui:

```tsx
import { SettingsShell, useSettings } from 'admin-ui';

function SettingsPage() {
  const settings = useSettings({
    slug: 'my-plugin',
    fields: ['api_key', 'enabled'],
  });

  return <SettingsShell title="My Plugin" tabs={tabs} {...settings} />;
}
```

See the [admin-ui README](../../admin-ui/README.md) for full component documentation.

## Development Mode

For hot reload during development, run the `wp-scripts` dev server inside the generated admin directory:

```bash
cd dist/my-plugin/admin/js
pnpm run start
```

This starts a webpack dev server with live reload. Changes to `src/admin/*.tsx` files are reflected immediately without rebuilding the full plugin.

For the monorepo plugins, use:

```bash
pnpm --filter <plugin-name> dev    # Watch mode for TypeScript → PHP
```

Note: `pnpm dev` watches TypeScript source changes and rebuilds PHP output. For admin UI changes during development, the full rebuild is fast since admin builds are cached in `.wpts-cache/`.
