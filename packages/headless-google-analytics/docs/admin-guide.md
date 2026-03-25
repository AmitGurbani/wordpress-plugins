# Admin Guide

Setup and configuration guide for WordPress site administrators.

## Installation

1. Download the plugin zip file
2. Go to **Plugins > Add New > Upload Plugin** in WordPress admin
3. Upload the zip and click **Install Now**
4. Click **Activate**

**Recommended:** Go to **Settings > Permalinks** and select "Post name" (or any option other than "Plain"). This enables clean REST API URLs (`/wp-json/...`). The API also works with plain permalinks using the `?rest_route=/headless-google-analytics/v1/...` format.

After activation, a **Google Analytics** menu item appears in the WordPress admin sidebar.

## Getting Credentials

You need two values from Google Analytics:

### Measurement ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Navigate to **Admin** (gear icon) → **Data Streams**
3. Select your web stream (or create one)
4. Copy the **Measurement ID** (starts with `G-`)

### API Secret

1. In the same Data Stream page, scroll to **Measurement Protocol API secrets**
2. Click **Create** to generate a new secret
3. Copy the **Secret value**

Keep the API secret secure — it is stored server-side only and is never sent to the browser.

## Settings Reference

Access settings via the **Google Analytics** menu in WordPress admin. Settings are organized into three tabs.

### General Tab

| Setting | Default | Description |
| ------- | ------- | ----------- |
| Measurement ID | — | GA4 Measurement ID (G-XXXXXXXX). Required for the `/config` endpoint and Measurement Protocol calls |
| API Secret | — | Measurement Protocol API secret. Never exposed to the browser |
| Currency | `USD` | Default currency for ecommerce events (ISO 4217). Auto-set to your WooCommerce store currency when WooCommerce is active |

### Events Tab

Controls which event types are accepted via the `/track` endpoint or fired automatically.

| Setting | Default | Description |
| ------- | ------- | ----------- |
| view_item | On | Accept `view_item` events from the frontend via `/track` |
| add_to_cart | On | Accept `add_to_cart` events from the frontend via `/track` |
| begin_checkout | On | Accept `begin_checkout` events from the frontend via `/track` |
| purchase | On | Automatically fire `purchase` events via WooCommerce order hooks (no frontend action required) |
| search | On | Accept `search` events from the frontend via `/track` |

### Diagnostics Tab

Tools for testing and debugging:

- **Test Measurement Protocol** — Sends a test `page_view` event to the GA4 debug endpoint, which validates payload structure and returns any errors
- **Fetch Last Error** — Shows the most recent error from a live event send

## WooCommerce Purchase Tracking

When WooCommerce is active and **purchase** is enabled, the plugin automatically fires a `purchase` event via the Measurement Protocol when an order status changes to a "paid" state. No frontend action is required.

**Statuses that trigger tracking:**

| Status | Payment method |
| ------ | -------------- |
| `processing` | Online gateways (Stripe, PayPal), Cash on Delivery |
| `on-hold` | Bank transfer (BACS), manual review |
| `completed` | Any manually completed order |

The plugin sets a `_headless_ga_sent` meta flag on the order after sending. This prevents duplicate sends if an order transitions through multiple statuses (e.g., `pending` → `on-hold` → `completed`). The flag is only set on successful delivery, allowing automatic retry on the next status change if GA4 was temporarily unreachable.

## Testing the Connection

Before going live, verify your credentials are working:

1. In WordPress: **Google Analytics** → **General** tab → enter your **Measurement ID** and **API Secret** → Save
2. Go to the **Diagnostics** tab → click **Test Measurement Protocol**
3. A success message means your payload structure is valid

**Important:** The GA4 debug endpoint validates the payload structure but does **not** validate the Measurement ID or API Secret themselves. To confirm events are actually arriving, open [GA4 Realtime](https://analytics.google.com/) → **Reports** → **Realtime** and check for your test events.

## Troubleshooting

### 404 on API endpoints

1. If using pretty permalinks: go to **Settings > Permalinks** and click **Save Changes** (this flushes rewrite rules)
2. If using plain permalinks: replace `/wp-json/headless-google-analytics/v1/...` with `?rest_route=/headless-google-analytics/v1/...`

### Events not appearing in GA4

1. Check that **Measurement ID** and **API Secret** are both filled in — the plugin skips sending if either is missing
2. Go to the **Diagnostics** tab and click **Test Measurement Protocol** — if it fails, the error message will describe the problem
3. Check **Last Error** on the Diagnostics tab for the most recent error from a live event
4. Remember: the GA4 production endpoint always returns 2xx even for invalid credentials. Use GA4 Realtime to confirm events arrive

### Purchase events not firing

1. Confirm WooCommerce is active and the **purchase** toggle is enabled
2. Check that the order is reaching `processing`, `on-hold`, or `completed` status
3. Check for the `_headless_ga_sent` meta key on the order in the database — if it's already set from a prior attempt, the event won't resend

### $0 revenue in GA4 reports

The plugin sends `value` and `price` as numeric types (using `floatval()`). If you see $0 revenue, check that the WooCommerce products have prices set and that orders have a non-zero total.

### WooCommerce notice in admin

If you see a "WooCommerce is recommended" notice, the plugin is active but WooCommerce is not installed. Purchase auto-tracking requires WooCommerce. The `/config` and `/track` endpoints still work without WooCommerce.
