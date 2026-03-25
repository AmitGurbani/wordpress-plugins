# Admin Guide

Setup and configuration guide for WordPress site administrators.

## Installation

1. Download the plugin zip file
2. Go to **Plugins > Add New > Upload Plugin** in WordPress admin
3. Upload the zip and click **Install Now**
4. Click **Activate**

**Recommended:** Go to **Settings > Permalinks** and select "Post name" (or any option other than "Plain"). This enables clean REST API URLs (`/wp-json/...`). The API also works with plain permalinks using the `?rest_route=/headless-umami/v1/...` format.

After activation, an **Umami Analytics** menu item appears in the WordPress admin sidebar.

## Getting Credentials

You need two values from your Umami instance:

### Umami URL

The base URL of your Umami installation:

- **Umami Cloud:** `https://cloud.umami.is`
- **Self-hosted:** Your server URL (e.g., `https://analytics.example.com`)

### Website ID

1. Log into your Umami dashboard
2. Go to **Settings** → **Websites**
3. Select your website (or add a new one)
4. Copy the **Website ID** (UUID format, e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

## Settings Reference

Access settings via the **Umami Analytics** menu in WordPress admin. Settings are organized into two tabs.

### General Tab

| Setting | Default | Description |
| ------- | ------- | ----------- |
| Umami URL | — | Your Umami instance URL. Required for the `/config` endpoint and server-side event sending |
| Website ID | — | Umami website ID (UUID). Required for both frontend script initialization and server-side events |
| Track Purchase | On | Automatically fire purchase events via WooCommerce order hooks (no frontend action required) |

### Diagnostics Tab

Tools for testing and debugging:

- **Test Connection** — Sends a test event to your Umami instance to verify the URL and Website ID are working
- **Fetch Last Error** — Shows the most recent error from a live event send

## WooCommerce Purchase Tracking

When WooCommerce is active and **Track Purchase** is enabled, the plugin automatically sends a `purchase` event to Umami when an order status changes to a "paid" state. No frontend action is required.

**Statuses that trigger tracking:**

| Status | Payment method |
| ------ | -------------- |
| `processing` | Online gateways (Stripe, PayPal), Cash on Delivery |
| `on-hold` | Bank transfer (BACS), manual review |
| `completed` | Any manually completed order |

The plugin sets a `_headless_umami_sent` meta flag on the order after successful delivery. This prevents duplicate sends if an order transitions through multiple statuses. The flag is only set on success, allowing automatic retry on the next status change if Umami was temporarily unreachable.

## Testing the Connection

Before going live, verify your Umami credentials are working:

1. In WordPress: **Umami Analytics** → **General** tab → enter your **Umami URL** and **Website ID** → Save
2. Go to the **Diagnostics** tab → click **Test Connection**
3. A success message means the connection is working
4. Open your Umami dashboard to confirm the test event appears

## Troubleshooting

### 404 on API endpoints

1. If using pretty permalinks: go to **Settings > Permalinks** and click **Save Changes** (this flushes rewrite rules)
2. If using plain permalinks: replace `/wp-json/headless-umami/v1/...` with `?rest_route=/headless-umami/v1/...`

### Events not appearing in Umami

1. Check that **Umami URL** and **Website ID** are both filled in — the plugin skips sending if either is missing
2. Go to the **Diagnostics** tab and click **Test Connection** — if it fails, the error message will describe the problem
3. Check **Last Error** on the Diagnostics tab for the most recent error
4. **User-Agent required:** Umami silently discards events without a valid User-Agent header. The plugin automatically sets `Mozilla/5.0 (compatible; HeadlessUmami/1.0; +wordpress)` for server-side events
5. **SSRF protection:** The plugin uses `wp_safe_remote_post` which blocks requests to private/loopback IP ranges (127.0.0.1, 10.x.x.x, etc.). If your Umami instance is on a private network, you may need to configure WordPress to allow it

### Purchase events not firing

1. Confirm WooCommerce is active and **Track Purchase** is enabled
2. Check that the order is reaching `processing`, `on-hold`, or `completed` status
3. Check for the `_headless_umami_sent` meta key on the order in the database — if it's already set from a prior attempt, the event won't resend

### WooCommerce notice in admin

If you see a "WooCommerce is recommended" notice, the plugin is active but WooCommerce is not installed. Purchase tracking requires WooCommerce. The `/config` endpoint still works without WooCommerce.
