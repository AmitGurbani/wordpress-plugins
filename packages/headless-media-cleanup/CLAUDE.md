# Headless Media Cleanup

Auto-delete orphaned WooCommerce media when images are removed from products, variations, and taxonomy terms. Built with [wpts](../wpts/).

## Commands

- `pnpm build` — Build plugin to dist/
- `pnpm dev` — Watch mode rebuild
- `pnpm wp-env:start` — Start local WordPress (Docker required, http://localhost:8888, admin/password)
- `pnpm wp-env:stop` — Stop local WordPress

## Architecture

Multi-file wpts plugin with 3 source files (no admin UI, no settings):

- `src/plugin.ts` — Entry file: @Plugin(`wooNotice: 'required'`), @Activate
- `src/cleanup-hooks.ts` — 11 @Action hooks for detecting image changes on products, variations, and taxonomy terms
- `src/cleanup-routes.ts` — Admin REST endpoints for orphan scanning and manual cleanup

## How It Works

### State Tracking

The plugin tracks the last-known image set per entity using meta:
- Products/variations: `_headless_media_cleanup_tracked_images` post meta (JSON array of attachment IDs)
- Terms: `_headless_media_cleanup_tracked_image` term meta (single attachment ID string)

On each save, compares current images with tracked state to find removed IDs. On entity creation, records the baseline.

### Orphan Check

Before deleting any attachment, verifies it is not used by:
- Any product or variation as `_thumbnail_id` (featured image)
- Any product's `_product_image_gallery` (gallery images, comma-separated IDs)
- Any taxonomy term's `thumbnail_id` (category/tag/brand thumbnails)

### Hooks

**Products & Variations:** `woocommerce_new_product`, `woocommerce_update_product` (p:99), `woocommerce_new_product_variation`, `woocommerce_update_product_variation` (p:99), `before_delete_post`, `deleted_post`

**Taxonomy Terms:** `added_term_meta`, `updated_term_meta`, `delete_term_meta`, `pre_delete_term`, `delete_term`

## REST API

Namespace: `headless-media-cleanup/v1`

| Method | Route | Permission | Purpose |
|--------|-------|-----------|---------|
| GET | `/orphans` | manage_options | List orphaned WooCommerce images (paginated) |
| POST | `/orphans/cleanup` | manage_options | Delete all orphaned images |

## Filters

| Filter | Default | Purpose |
|--------|---------|---------|
| `headless_media_cleanup_enabled` | `true` | Global kill switch |
| `headless_media_cleanup_should_delete` | `true` | Per-attachment (2nd arg: attachment ID) |
| `headless_media_cleanup_taxonomies` | `['product_cat', 'product_tag', 'product_brand']` | Which taxonomies to monitor |

## Conventions

- **No settings** — zero configuration, uses WordPress filters for extensibility
- **Image-only** — mime type check (`image/*`) prevents deletion of downloadable files
- **Permanent delete** — `wp_delete_attachment($id, true)` skips trash, removes physical files
- **Transients** for cross-hook state during deletion flows (60s TTL)
- **Debug logging** — logs deletions and skips via `error_log()` when `WP_DEBUG_LOG` is enabled
