# Headless Clarity

Microsoft Clarity session recordings and heatmaps for headless WordPress stores. The frontend handles all browser-side tracking via the Clarity JS script; this plugin serves the Project ID and optional user identity data via a REST endpoint.

Built with [wpts](../wpts/) (TypeScript-to-WordPress-Plugin transpiler).

## Development

```bash
pnpm build         # Build plugin to dist/
pnpm dev           # Watch mode — rebuild on file changes
```

### Local Testing with wp-env

Requires [Docker](https://www.docker.com/products/docker-desktop/).

```bash
pnpm build                # Build first
pnpm wp-env:start         # Start WordPress at http://localhost:8888
pnpm wp-env:stop          # Stop the environment
pnpm wp-env:clean         # Reset everything (database, uploads, etc.)
```

Default credentials: `admin` / `password`

The plugin is auto-mounted from `dist/headless-clarity/`. Rebuild with `pnpm build` after code changes (or use `pnpm dev` in a separate terminal).

## Project Structure

```
src/
├── plugin.ts              # Entry — @Plugin, @AdminPage, 2 @Settings, @Activate
├── config-routes.ts       # GET /config — project_id + optional user identity
├── diagnostics-routes.ts  # GET /diagnostics/last-error
└── admin/
    ├── index.tsx           # React root
    ├── SettingsPage.tsx    # Main settings page with TabPanel
    ├── types.ts            # Settings interface, defaults, tabs
    └── tabs/
        ├── GeneralTab.tsx      # Project ID, Enable Identify toggle
        └── DiagnosticsTab.tsx  # View last error
```

Uses [wpts multi-file support](../wpts/README.md#multi-file-plugins) — `plugin.ts` is the entry file with `@Plugin`, other files contain decorated classes merged into the same plugin output.

## REST API Endpoints

All endpoints are under `/headless-clarity/v1/`.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/config` | GET | Public | Returns `project_id` and optional `user` identity for frontend Clarity initialization |
| `/settings` | GET | Admin | Get all plugin settings |
| `/settings` | POST | Admin | Update plugin settings |
| `/diagnostics/last-error` | GET | Admin | Get the last error message |

### Frontend Integration

Fetch the Project ID and load the Clarity script:

```js
// 1. Get config from WordPress
const res = await fetch('/wp-json/headless-clarity/v1/config');
const config = await res.json();
if (!config.project_id) return; // Not configured

// 2. Load Clarity script
(function(c, l, a, r, i, t, y) {
  c[a] = c[a] || function() { (c[a].q = c[a].q || []).push(arguments) };
  t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
  y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
})(window, document, "clarity", "script", config.project_id);

// 3. Identify user if available
if (config.user) {
  window.clarity("identify", config.user.id, null, null, config.user.display_name);
}
```

## Settings

Configured via WordPress admin page (Microsoft Clarity menu):

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `project_id` | string | `''` | Clarity Project ID (10-character alphanumeric from Settings > Overview) |
| `enable_identify` | boolean | `true` | Expose logged-in user info via `/config` for Clarity `identify()` API |

## Architecture

### Headless Design

```
Frontend (Next.js etc.)              WordPress
────────────────────────             ──────────────────────────
GET /config  ──────────────────────→ Returns project_id + user?
Load Clarity script
clarity("identify", user.id, ...)    (direct to Clarity, browser-side)
clarity("set", "key", "value")       (direct to Clarity, browser-side)
clarity("event", "purchase")         (direct to Clarity, browser-side)
```

### No Server-Side Tracking

Unlike the GA4, Meta Pixel, and Umami plugins, Clarity has **no server-side event API** — no Measurement Protocol, no CAPI, no server beacon. It is a purely client-side tool for session recordings and heatmaps. WordPress only provides configuration; all tracking happens in the browser.

Purchase tracking must be done client-side on the order confirmation page using `clarity("event", "purchase")` and `clarity("set", ...)` tags.

## License

GPL-2.0+
