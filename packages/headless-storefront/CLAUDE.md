# Headless Storefront

Store branding and configuration for headless WordPress with WooCommerce. Stores all settings in a single WP option and exposes them via a public REST API for the Next.js frontend. Built with [wpts](../wpts/).

## Commands

- `pnpm build` — Build plugin to dist/
- `pnpm dev` — Watch mode rebuild
- `pnpm wp-env:start` — Start local WordPress (Docker required, http://localhost:8888, admin/password)
- `pnpm wp-env:stop` — Stop local WordPress

## Architecture

Multi-file wpts plugin with 4 source files:

- `src/plugin.ts` — Entry file: @Plugin(`wooNotice: 'required'`), @AdminPage(`parentSlug: 'options-general.php'`), @Activate (seeds default theme + empty `headless_storefront_last_revalidate_at` so wpts auto-cleans it on uninstall)
- `src/config-routes.ts` — GET /config (public), GET+POST+PATCH /settings (admin), POST /admin/revalidate (admin manual re-push); holds its own `dispatch_revalidate` helper plus `sanitize_payload` and `merge_patch` (lands in REST API PHP class)
- `src/revalidate-hooks.ts` — 4 `update_option_*` action handlers that fire the revalidation webhook; holds its own `dispatch_revalidate` helper (lands in Public PHP class). Split from config-routes because wpts places helpers into ONE class per source TS class: @RestRoute + @Action in the same class would leave action handlers unable to reach the helper.
- `src/diagnostics-routes.ts` — POST /diagnostics/test-revalidate (admin synchronous webhook test). Self-contained — no shared helpers with the other classes.
- `src/admin/index.tsx` — React settings page (8 tabs: Store Identity, Appearance, Contact & Social, Footer Content, Product Page, Operations, Template, Cache Settings)

## Key Design

- **Single option**: All branding settings stored in `headless_storefront_config` as JSON (no @Setting decorators)
- **Custom REST routes**: `/config` (public, nested response with WP/WC fallbacks) and `/settings` (admin, flat option read / full-replace POST / partial PATCH)
- **PATCH semantics**: `PATCH /settings` merges the body onto the existing option. Top-level keys present in the body replace the existing value; nested objects (`contact`, `colors`, `tokens`) shallow-merge so `{"colors":{"secondary":""}}` only touches that one inner key. Arrays (`social`, `cities`, `trust_signals`) are replaced wholesale when their key is present. **`null` is treated the same as "key absent"** (PHP `isset()` semantics) — to clear a field via PATCH, send `""` for strings or `[]` for arrays. The merged result is sanitized through the same path as POST, so persisted shape and validation rules are identical for both methods.
- **JWT-compatible auth**: All admin routes gate on `manage_options` via `current_user_can()` after the WP user is resolved. The `headless-auth` plugin ships a `determine_current_user` filter (priority 20) that resolves a `Bearer <jwt>` Authorization header to the matching WP user before any REST permission callback runs — so an external dashboard authenticating with the auth plugin's JWT clears the same `manage_options` gate as the wp-admin cookie+nonce flow, with no plugin-side change required.
- **`revalidate_secret` masking**: GET /settings returns `revalidate_secret` as `'********'` when set, `''` when unset. POST and PATCH responses also run through `maskResponse`, so the raw secret never traverses the REST surface. When the admin UI re-submits `'********'` (user did not edit the field), `preserveSecretOnMask` swaps it for the existing stored value before sanitization, mirroring the wpts `@Setting({ sensitive: true })` preserve-on-mask pattern. Manual implementation is required because settings live in a single JSON option (no per-field `@Setting` decorators).
- **Popular searches moved out**: Search tracking and the `/config/popular-searches` endpoint were removed; this concern lives in `headless-fuzzy-find` (`GET /headless-fuzzy-find/v1/popular-searches`), which has both the analytics log and the search engine that produces meaningful query data.
- **v1.8 merchant policy + template config**: Adds top-level optional fields `fssai_license`, `estd_line`, `owner_name`, `mov`, `delivery_fee`, `delivery_areas`, plus a `template` enum (`kirana | megamart | bakery | quickcommerce | ecommerce | fooddelivery`) and a namespaced `template_config` blob with one section per vertical. `/config` echoes only sections that hold meaningful values; `/settings` always returns a fully-shaped `template_config` so the admin form has stable controlled inputs. `mov` / `delivery_fee` use `''` to mean "unset" vs. an explicit `0` (free / no minimum); `/config` echoes `null` for unset numerics. The Operations tab in the admin UI surfaces the policy fields; the Template tab swaps the per-vertical fieldset based on the selected template (kirana / megamart show no per-vertical fields today). Field ownership: `mov` and `delivery_fee` live here pragmatically because no `headless-checkout` plugin exists; if one ships, they migrate via the single option blob.
- **`headless_storefront_config_response` filter**: Applied right before `/config` returns, on the fully assembled response (including v1.8 additions). Lets sibling plugins or theme code mutate the public response without owning the option blob — the durable extension point complementing `template_config`.
- **Cache invalidation**: Four `update_option_*` hooks fire `POST {frontend_url}/api/revalidate` with body `{ "type": "storefront" }` and header `x-revalidate-secret: <secret>`:
  - `update_option_headless_storefront_config` (own settings)
  - `update_option_blogname` (Site Title fallback for app_name)
  - `update_option_blogdescription` (Tagline fallback)
  - `update_option_woocommerce_email_from_address` (contact email fallback)
  Uses `wp_safe_remote_post` (SSRF protection) with `blocking: false` and `timeout: 5` — fire-and-forget. Skipped when `defined('WP_CLI') && WP_CLI` is true. Also available as manual `POST /admin/revalidate` for the "Re-push storefront config" button.
- **Webhook health surface**: `headless_storefront_last_revalidate_at` (separate option, ISO 8601) records the last attempted dispatch timestamp. Updated by both helpers AFTER guard clauses but BEFORE the `wp_safe_remote_post` call (since dispatch is fire-and-forget, "attempted" is the only observable semantic). Fires on auto-fire and manual re-push only — NOT on the diagnostic test endpoint. Stored in a separate option (not inside `headless_storefront_config`) to avoid re-triggering the `update_option_headless_storefront_config` action and creating an infinite dispatch loop. Surfaced to the admin UI via `_last_revalidate_at` in the GET /settings response (null when never attempted).
- **Test webhook**: `POST /diagnostics/test-revalidate` does a synchronous `wp_safe_remote_post` (parity with auto-fire — a test that succeeds while auto-fire would silently drop the request is misleading) with `timeout: 10` and returns `{ success, code, http_code, message }`. Maps 401/403 → "Secret doesn't match", 404 → "Check Frontend URL path", 5xx → "Frontend returned an error". Does NOT update the timestamp — purely diagnostic.

## REST API

Namespace: `headless-storefront/v1`

| Method | Route | Permission | Purpose |
|--------|-------|-----------|---------|
| GET | `/config` | public | Branding config with defaults and WP/WC fallbacks |
| GET | `/settings` | manage_options | Raw settings for admin UI (includes `_fallbacks` and `_last_revalidate_at`) |
| POST | `/settings` | manage_options | Full-replace settings save |
| PATCH | `/settings` | manage_options | Partial settings update; merge semantics per "Key Design" above |
| POST | `/admin/revalidate` | manage_options | Fire the revalidation webhook manually; returns `{ dispatched: boolean }` |
| POST | `/diagnostics/test-revalidate` | manage_options | Synchronous webhook test; returns `{ success, code, http_code, message }` |

## Conventions

- **Option keys**: `headless_storefront_config` (single JSON option storing all settings); `headless_storefront_last_revalidate_at` (ISO 8601 string, last attempted webhook timestamp; empty until first dispatch)
- **WP/WC fallbacks** (in /config only): `app_name` → `blogname`, `tagline` → `blogdescription`, `contact.email` → `woocommerce_email_from_address`
- **Admin page**: Settings > Headless Storefront (submenu under Settings via `parentSlug: 'options-general.php'`)
