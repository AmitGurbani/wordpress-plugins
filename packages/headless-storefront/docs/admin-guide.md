# Admin Guide

Setup guide for WordPress site administrators.

## Installation

1. Download the plugin zip file from [GitHub Releases](https://github.com/AmitGurbani/wordpress-plugins/releases)
2. Go to **Plugins > Add New > Upload Plugin** in WordPress admin
3. Upload the zip and click **Install Now**
4. Click **Activate**

**Required:**
- [WooCommerce](https://woocommerce.com/) must be installed and active. The plugin displays an admin notice if WooCommerce is missing.

**Recommended:** Go to **Settings > Permalinks** and select "Post name" (or any option other than "Plain"). This enables clean REST API URLs (`/wp-json/...`).

## Settings Page

Settings live under **Settings > Headless Storefront**, organized into eight tabs:

| Tab | Purpose |
|-----|---------|
| **Store Identity** | App name, short name, tagline, title tagline, description, logo |
| **Appearance** | Color palette (primary/secondary/accent), font family, design tokens (spacing, radius, shadow, transition) |
| **Contact & Social** | Phone, email, WhatsApp, social links (Instagram, Facebook, Twitter, YouTube, LinkedIn) |
| **Footer Content** | Free-text store hours, free-text delivery area, cities list, four trust signals |
| **Product Page** | Delivery message, return policy, delivery badge |
| **Operations** | Owner name, established line, FSSAI license, minimum order value, delivery fee, structured delivery areas |
| **Template** | Storefront template selector (kirana, megamart, bakery, quickcommerce, ecommerce, fooddelivery) and per-vertical config that swaps based on the selected template |
| **Cache Settings** | Frontend revalidation URL, revalidate secret, manual re-push button, webhook test |

## Template Selector

The **Template** tab drives which vertical-specific fields appear in the admin form:

- **Kirana / Megamart** — no template-specific fields today (placeholders for future asks)
- **Bakery** — list of occasions (filter chips on cake category pages), default-eggless toggle
- **Quickcommerce** — ETA band (min/max minutes), Cash on Delivery enabled
- **Food Delivery** — Veg-only toggle, Jain filter toggle
- **E-commerce** — Returns window (days), Exchanges enabled

A merchant whose template is `bakery` will not see Quickcommerce / Food Delivery / E-commerce fields. The plugin still persists every section's data, so changing template is non-destructive.

## Field Ownership

Some fields straddle the line between branding and commerce policy:

- `mov` (minimum order value) and `delivery_fee` are commerce policy. They live in this plugin pragmatically because no separate `headless-checkout` plugin exists. If one ships later, they migrate cleanly because the entire config is one serialized option.
- `hours_text` and `delivery_area_text` are free-text strings. Storefronts that need machine-readable hours or coverage grids should consume `delivery_areas` (string array) and wait for a future structured `hours` field rather than parsing the free-text versions.

## Cache Revalidation

Saving any of the following options fires a `POST {frontend_url}/api/revalidate` webhook with header `x-revalidate-secret: <secret>` and body `{"type":"storefront"}`:

- `headless_storefront_config` (any plugin setting save)
- `blogname` (Site Title — fallback for `app_name`)
- `blogdescription` (Tagline — fallback for `tagline`)
- `woocommerce_email_from_address` (fallback for `contact.email`)

Both **Frontend URL** and **Revalidate Secret** must be set on the **Cache Settings** tab for the webhook to fire. The dispatch is fire-and-forget (5s timeout, non-blocking) — success is not observable, but the **Last webhook attempted** timestamp on the Cache Settings tab confirms the hook ran.

The **Test webhook** button on the same tab does a synchronous request and reports the HTTP status, so you can verify the URL and secret without waiting for an option change.

## Verifying the Setup

After installing and activating the plugin (alongside WooCommerce):

1. Confirm the plugin is active in the **Plugins** list
2. Visit **Settings > Headless Storefront** and configure at least the Store Identity tab
3. Hit the public config endpoint:

```bash
curl https://your-site.com/wp-json/headless-storefront/v1/config
```

The response should include the fields you saved, with WP/WC fallbacks filled in for `app_name`, `tagline`, and `contact.email` if you left them blank.

## Troubleshooting

### 404 on `/config`

1. If using pretty permalinks: go to **Settings > Permalinks** and click **Save Changes** (this flushes rewrite rules)
2. If using plain permalinks: replace `/wp-json/headless-storefront/v1/config` with `?rest_route=/headless-storefront/v1/config`
3. Confirm the plugin is activated in **Plugins** list

### Webhook never fires

- Check that both **Frontend URL** and **Revalidate Secret** are set on the **Cache Settings** tab
- The webhook is skipped during WP-CLI runs (intentional, to avoid spurious dispatches during seed scripts)
- If your frontend URL is on a private network, WordPress's SSRF guard (`wp_safe_remote_post`) may reject it — use the **Test webhook** button to surface the exact error

### Webhook secret looks like `********` after save

This is intentional. The plugin masks `revalidate_secret` in REST responses to limit blast radius if the network path is logged or proxied. The real value is preserved server-side and used by the webhook dispatcher. Edit the field in the admin UI to change the secret; leave the mask alone to keep the existing value.

### Numeric field saved as 0 instead of "unset"

For `mov` and `delivery_fee`, an empty input means "unset" and the public `/config` echoes `null`. An explicit `0` is a valid policy ("no minimum", "free delivery") and round-trips as the integer `0`. If you want "unset", clear the field rather than typing `0`.
