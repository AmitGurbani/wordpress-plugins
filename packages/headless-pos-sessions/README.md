# Headless POS Sessions

POS register session storage with REST API for headless WordPress stores. Stores cash register open/close events, cash movements, and order history per terminal.

Built with [wpts](../wpts/) (TypeScript-to-WordPress-Plugin transpiler). Requires [WooCommerce](https://woocommerce.com/).

## Documentation

- **[Integration Guide](docs/integration-guide.md)** — REST API reference, request/response examples, TypeScript client
- **[Admin Guide](docs/admin-guide.md)** — Installation, settings, cron tasks, troubleshooting

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

The plugin is auto-mounted from `dist/headless-pos-sessions/`. Rebuild with `pnpm build` after code changes (or use `pnpm dev` in a separate terminal).

## Project Structure

```
src/
├── plugin.ts              # Entry — @Plugin, @CustomPostType, @AdminPage, 2 @Settings, cron scheduling
├── session-routes.ts      # POST/GET/PUT/DELETE /sessions endpoints
├── cron-tasks.ts          # Daily cleanup (retention) and auto-close (orphaned sessions)
└── admin/
    ├── index.tsx           # React root
    ├── SettingsPage.tsx    # Main settings page with TabPanel
    ├── types.ts            # Settings interface, defaults, tabs
    └── tabs/
        └── GeneralTab.tsx  # Retention days, max open sessions
```

Uses [wpts multi-file support](../wpts/README.md#multi-file-plugins) — `plugin.ts` is the entry file with `@Plugin`, other files contain decorated classes merged into the same plugin output.

## REST API Endpoints

All endpoints are under `/headless-pos-sessions/v1/`. Authentication required (WooCommerce capabilities).

| Endpoint | Method | Permission | Description |
|----------|--------|------------|-------------|
| `/sessions` | POST | `manage_shop_orders` | Create a session (409 on duplicate UUID) |
| `/sessions` | GET | `manage_shop_orders` | List sessions with pagination, filtering, sorting |
| `/sessions/:id` | GET | `manage_shop_orders` | Get a single session |
| `/sessions/:id` | PUT | `manage_shop_orders` | Partial update a session |
| `/sessions/:id` | DELETE | `manage_woocommerce` | Delete a session (admin-only) |
| `/settings` | GET | `manage_options` | Get plugin settings |
| `/settings` | POST | `manage_options` | Update plugin settings |

### Frontend Integration

```js
// Create a new POS session
const res = await fetch('/wp-json/headless-pos-sessions/v1/sessions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': nonce,
  },
  body: JSON.stringify({
    session_uuid: crypto.randomUUID(),
    terminal_id: 'register-01',
    opened_at: new Date().toISOString(),
    opening_balance: 200.00,
  }),
});
const session = await res.json();
```

## Settings

Configured via WordPress admin page (**POS Sessions** menu):

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `retention_days` | number | `90` | Auto-delete closed sessions older than N days (0 = disabled) |
| `max_open_sessions` | number | `10` | Maximum number of concurrently open POS sessions |

## Architecture

### Headless Design

```
POS Frontend (React, etc.)              WordPress
────────────────────────────            ──────────────────────────────
POST /sessions (open register) ───────→ Creates pos_session CPT + meta
GET  /sessions (shift history) ───────→ Paginated list with filters
PUT  /sessions/:id (close register) ──→ Updates meta (closing balance, etc.)
DELETE /sessions/:id (admin cleanup) ─→ Removes post + meta (admin-only)
```

### Data Model

Sessions are stored as a Custom Post Type (`pos_session`) with all fields in post meta. No custom database tables — uses standard WordPress APIs for portability and compatibility.

### Cron Tasks

Two daily scheduled tasks run automatically:

- **`hps_daily_cleanup`** — Deletes closed sessions older than the configured retention period
- **`hps_daily_auto_close`** — Auto-closes orphaned open sessions older than 24 hours

Both are unscheduled on plugin deactivation and all session data is removed on uninstall.

## License

GPL-2.0+
