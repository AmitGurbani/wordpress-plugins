# Admin Guide

Setup and configuration guide for WordPress site administrators.

## Installation

1. Download the plugin zip file
2. Go to **Plugins > Add New > Upload Plugin** in WordPress admin
3. Upload the zip and click **Install Now**
4. Click **Activate**

**Required:** [WooCommerce](https://woocommerce.com/) must be installed and active. The plugin checks for WooCommerce on activation and displays a notice if it is missing.

**Recommended:** Go to **Settings > Permalinks** and select "Post name" (or any option other than "Plain"). This enables clean REST API URLs (`/wp-json/...`). The API also works with plain permalinks using the `?rest_route=/headless-pos-sessions/v1/...` format.

After activation, a **POS Sessions** menu item appears in the WordPress admin sidebar with a store icon.

## Settings Reference

Access settings via the **POS Sessions** menu in WordPress admin.

### General Tab

| Setting | Default | Description |
|---------|---------|-------------|
| Retention Days | 90 | Automatically delete closed sessions older than this many days. Set to `0` to disable automatic cleanup — sessions are kept indefinitely |
| Max Open Sessions | 10 | Maximum number of concurrently open POS sessions. The API returns 409 if a new open session would exceed this limit |

## Cron Tasks

The plugin schedules two daily WordPress cron tasks that run automatically:

### Retention Cleanup (`headless_pos_sessions_daily_cleanup`)

Deletes closed sessions older than the configured **Retention Days** value. Processes up to 100 sessions per run. Disabled when Retention Days is set to `0`.

### Orphan Auto-Close (`headless_pos_sessions_daily_auto_close`)

Automatically closes open sessions that have been open for more than 24 hours. This catches forgotten/abandoned register sessions. Auto-closed sessions receive the note "Auto-closed: orphaned session".

Both cron tasks are unscheduled when the plugin is deactivated. All session data (posts + meta) is removed on plugin uninstall.

## Data Storage

Sessions are stored as a private Custom Post Type (`hpss_pos_session`) with metadata in the standard `wp_postmeta` table. No custom database tables are created. This means:

- Sessions appear in standard WordPress backup tools
- No database migration needed on updates
- Compatible with WordPress multisite

Session data is not visible in the Posts admin screen (the CPT is non-public and hidden from the admin menu).

## Verifying the Setup

After installing and activating the plugin:

1. In WordPress admin: **POS Sessions** > **General** tab > adjust settings if needed > **Save**
2. Test the API with curl:

```bash
# List sessions (should return empty list)
curl -u "admin:YOUR_APP_PASSWORD" \
  https://your-site.com/wp-json/headless-pos-sessions/v1/sessions
```

Expected response:

```json
{
  "data": [],
  "meta": { "total": 0, "total_pages": 1, "page": 1, "per_page": 20 }
}
```

3. Create a test session:

```bash
curl -X POST -u "admin:YOUR_APP_PASSWORD" \
  -H "Content-Type: application/json" \
  https://your-site.com/wp-json/headless-pos-sessions/v1/sessions \
  -d '{"session_uuid": "test-001", "terminal_id": "register-01", "opened_at": "2026-04-01T09:00:00.000Z", "opening_balance": 100}'
```

## Troubleshooting

### 404 on API endpoints

1. If using pretty permalinks: go to **Settings > Permalinks** and click **Save Changes** (this flushes rewrite rules)
2. If using plain permalinks: replace `/wp-json/headless-pos-sessions/v1/...` with `?rest_route=/headless-pos-sessions/v1/...`
3. Confirm the plugin is activated in **Plugins** list

### "WooCommerce is required" notice

The plugin requires WooCommerce for its permission capabilities (`manage_shop_orders`, `manage_woocommerce`). Install and activate WooCommerce, then reactivate this plugin.

### 401 Unauthorized on all requests

All session endpoints require authentication with a user that has WooCommerce capabilities:

- **CRUD operations**: User needs `manage_shop_orders` (Shop Manager or Administrator role)
- **Delete**: User needs `manage_woocommerce` (Administrator role only)

Verify your authentication method:
- **Cookie + Nonce**: Ensure the `X-WP-Nonce` header contains a valid, non-expired nonce
- **Application Passwords**: Go to **Users > Your Profile > Application Passwords** and generate one

### 409 "Maximum number of open sessions reached"

The **Max Open Sessions** setting limits concurrent open sessions. Either:
- Close existing open sessions via `PUT /sessions/:id` with `status: "closed"`
- Increase the limit in **POS Sessions** > **General** > **Max Open Sessions**

### Sessions not being cleaned up automatically

WordPress cron depends on site visits to trigger scheduled tasks. On low-traffic sites, cron may not run reliably. Consider setting up a real cron job:

```bash
# Add to server crontab (runs every 15 minutes)
*/15 * * * * curl -s https://your-site.com/wp-cron.php > /dev/null 2>&1
```

Then disable WordPress's built-in cron in `wp-config.php`:

```php
define( 'DISABLE_WP_CRON', true );
```
