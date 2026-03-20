# Admin Guide

Setup and configuration guide for WordPress site administrators.

## Installation

1. Download the plugin zip file
2. Go to **Plugins > Add New > Upload Plugin** in WordPress admin
3. Upload the zip and click **Install Now**
4. Click **Activate**

**Recommended:** Go to **Settings > Permalinks** and select "Post name" (or any option other than "Plain"). This enables clean REST API URLs (`/wp-json/...`). The API also works with plain permalinks using the `?rest_route=/headless-meta-pixel/v1/...` format.

After activation, a **Meta Pixel** menu item appears in the WordPress admin sidebar.

## Getting Credentials

You need two values from Meta Events Manager:

### Pixel ID

1. Go to [Meta Events Manager](https://business.facebook.com/events_manager2)
2. Select your pixel (or create one if you don't have one)
3. The Pixel ID is the number displayed next to your pixel's name — copy it

### Conversions API Access Token

1. In Events Manager, select your pixel
2. Go to **Settings** → **Conversions API** → **Generate access token**
3. Copy the generated token

Keep the access token secure — it is stored server-side only and is never sent to the browser.

## Settings Reference

Access settings via the **Meta Pixel** menu in WordPress admin. Settings are organized into three tabs.

### General Tab

| Setting | Default | Description |
| ------- | ------- | ----------- |
| Meta Pixel ID | — | Your Pixel ID from Meta Events Manager. Required for the `/config` endpoint and CAPI calls |
| Conversions API Access Token | — | Server-side access token for CAPI. Never exposed to the browser |
| Test Event Code | — | Test event code from Meta Events Manager. For development only — **remove before going to production** |
| Currency | `USD` | Default currency for ecommerce events (ISO 4217). Auto-set to your WooCommerce store currency when WooCommerce is active |

### Events Tab

Controls which event types are accepted via the `/track` endpoint or fired automatically.

| Setting | Default | Description |
| ------- | ------- | ----------- |
| Track ViewContent | On | Accept `ViewContent` events from the frontend via `/track` |
| Track AddToCart | On | Accept `AddToCart` events from the frontend via `/track` |
| Track InitiateCheckout | On | Accept `InitiateCheckout` events from the frontend via `/track` |
| Track Purchase | On | Automatically fire `Purchase` events via WooCommerce order hooks (no frontend action required) |
| Track Search | On | Accept `Search` events from the frontend via `/track` |

### CAPI Tab (General Tab)

| Setting | Default | Description |
| ------- | ------- | ----------- |
| Enable Conversions API | On | Master toggle. Turn off to stop all CAPI sending without changing other settings |

## WooCommerce Purchase Tracking

When WooCommerce is active and **Track Purchase** is enabled, the plugin automatically fires a `Purchase` CAPI event when an order status changes to a "paid" state. No frontend action is required.

**Statuses that trigger tracking:**

| Status | Payment method |
| ------ | -------------- |
| `processing` | Online gateways (Stripe, PayPal), Cash on Delivery |
| `on-hold` | Bank transfer (BACS), manual review |
| `completed` | Any manually completed order |

The plugin sets a `_headless_meta_pixel_capi_sent` meta flag on the order after sending. This prevents duplicate sends if an order transitions through multiple statuses (e.g., `pending` → `on-hold` → `completed`).

## Testing CAPI Connection

Before going live, verify your CAPI credentials are working:

1. Go to [Meta Events Manager](https://business.facebook.com/events_manager2) → your pixel → **Test Events**
2. Copy the **Test Event Code** shown on that page (e.g., `TEST12345`)
3. In WordPress: **Meta Pixel** → **General** tab → paste the code into **Test Event Code** → Save
4. In WordPress: **Meta Pixel** → **Diagnostics** tab → click **Send Test Event**
5. Check the response — a success message means the connection is working
6. Back in Meta Events Manager, the **Test Events** page should show a `PageView` event arrive within a few seconds

**Important:** Remove the test event code from settings before going live. Test events are only visible in the Test Events tool — they do not count in your real conversion data.

## Troubleshooting

### 404 on API endpoints

1. If using pretty permalinks: go to **Settings > Permalinks** and click **Save Changes** (this flushes rewrite rules)
2. If using plain permalinks: replace `/wp-json/headless-meta-pixel/v1/...` with `?rest_route=/headless-meta-pixel/v1/...`

### CAPI events not appearing in Meta Events Manager

1. Check that **Pixel ID** and **Conversions API Access Token** are both filled in — the plugin skips CAPI if either is missing
2. Check **Enable Conversions API** is turned on
3. Go to the **Diagnostics** tab and click **Send Test Event** — if it fails, the error message will describe the problem
4. Check **Last CAPI Error** on the Diagnostics tab for the most recent error from a live event

### Purchase events firing twice (or not at all)

- **Firing twice:** Check if your frontend is also calling `/track` with `event_name: "Purchase"` on the order confirmation page. Use the WooCommerce order ID as the `event_id` (e.g., `order_12345`) to match the server-side ID so Meta can deduplicate
- **Not firing:** Confirm WooCommerce is active and the order is reaching `processing`, `on-hold`, or `completed` status. Check for the `_headless_meta_pixel_capi_sent` meta key on the order in the database — if it's already set from a prior attempt, the event won't resend

### Test event code left in production

Events sent with a test event code only appear in the Test Events tool — they do **not** count in your actual reporting or conversion optimization. If you notice your real conversion data looks low, check that the **Test Event Code** setting is empty.

### WooCommerce notice in admin

If you see a "WooCommerce is recommended" notice, the plugin is active but WooCommerce is not installed. Purchase auto-tracking requires WooCommerce. The `/config` and `/track` endpoints still work without WooCommerce.
