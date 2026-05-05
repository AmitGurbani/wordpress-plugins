# Integration Guide

Headless Storefront serves store branding, merchant policy, and per-template config to a headless frontend over a public REST API. All settings live in a single WordPress option; the public `/config` endpoint returns the assembled response with WP/WC fallbacks. Admin routes (`/settings`, `/admin/revalidate`) gate on `manage_options` and accept either WordPress cookie+nonce or a JWT issued by [Headless Auth](../../headless-auth/).

## Overview

```
Frontend (Next.js, Astro, etc.)            WordPress + WooCommerce
───────────────────────────────────────    ──────────────────────────────
GET /config  ────────────────────────────→ Public branding + policy + template_config
GET /settings  ──────────────────────────→ Admin: raw editable shape (manage_options)
POST /settings  ─────────────────────────→ Admin: full-replace save
PATCH /settings  ────────────────────────→ Admin: partial update with shallow-merge
POST /admin/revalidate  ─────────────────→ Admin: manual webhook re-push
POST /diagnostics/test-revalidate  ──────→ Admin: synchronous webhook test
```

**Base URL:** `https://your-site.com/wp-json/headless-storefront/v1`

If the site uses plain permalinks: `https://your-site.com/?rest_route=/headless-storefront/v1`

**Key design points:**
- Single source of truth — all settings live in one `wp_options` row (`headless_storefront_config`)
- WP/WC fallbacks built into `/config`: `app_name` → `blogname`, `tagline` → `blogdescription`, `contact.email` → `woocommerce_email_from_address`
- Cache revalidation webhook fires on every save of the config option (or any of the three fallback options)
- `template_config` namespaces vertical-specific settings so per-template fields don't leak across storefronts
- Public response is filterable via `headless_storefront_config_response` for extensions that don't own the option blob

---

## Authentication

`/config` is **public** — no auth required, designed to be cached by the frontend.

`/settings`, `/admin/revalidate`, and `/diagnostics/test-revalidate` require the `manage_options` capability. The plugin checks `current_user_can('manage_options')` after the WordPress user is resolved, so both cookie+nonce (wp-admin) and JWT Bearer auth work transparently:

```
Authorization: Bearer <JWT>
```

JWTs are resolved by Headless Auth's `determine_current_user` filter (priority 20) before any REST permission callback runs. See the [Headless Auth Integration Guide](../../headless-auth/docs/integration-guide.md) for how to obtain a token.

---

## Quick Start

### 1. Fetch public branding config

```bash
curl https://your-site.com/wp-json/headless-storefront/v1/config
```

### 2. Read raw settings (admin)

```bash
curl https://your-site.com/wp-json/headless-storefront/v1/settings \
  -H "Authorization: Bearer $JWT"
```

### 3. Patch a single field

```bash
curl -X PATCH https://your-site.com/wp-json/headless-storefront/v1/settings \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"app_name": "New Name"}'
```

### 4. Trigger frontend revalidation manually

```bash
curl -X POST https://your-site.com/wp-json/headless-storefront/v1/admin/revalidate \
  -H "Authorization: Bearer $JWT"
```

---

## API Reference

### GET /config

Public branding and configuration. Returns a fully-shaped response with defaults and WP/WC fallbacks. Cache aggressively on the frontend; the plugin pushes a revalidation webhook on every save.

#### Request

```bash
curl https://your-site.com/wp-json/headless-storefront/v1/config
```

#### Success Response (200)

```json
{
  "app_name": "Acme Store",
  "short_name": "Acme",
  "tagline": "Fast delivery across India",
  "title_tagline": "",
  "description": "",
  "contact": {
    "phone": "+919876543210",
    "phone_href": "tel:+919876543210",
    "email": "support@acme.example.com",
    "whatsapp": { "number": "+919876543210", "label": "Chat with us" }
  },
  "social": [
    { "platform": "instagram", "href": "https://instagram.com/acme", "label": "@acme" }
  ],
  "cities": ["Mumbai", "Bangalore", "Delhi"],
  "trust_signals": ["Genuine Products", "Easy Returns", "Secure Payment", "Fast Delivery"],
  "delivery_message": "Delivery in 1–2 business days",
  "return_policy": "Easy returns within 7 days of delivery.",
  "delivery_badge": "",
  "hours_text": "Mon–Sat 8 am – 10 pm · Sun 9 am – 8 pm",
  "delivery_area_text": "Within 3 km of Sector 14, Gurgaon",
  "colors": { "primary": "#6366f1", "secondary": null, "accent": null },
  "tokens": {
    "section_gap": "2rem",
    "card_padding": "0.75rem",
    "card_radius": "0.75rem",
    "button_radius": "0.5rem",
    "image_radius": "0.5rem",
    "card_shadow": "none",
    "card_hover_shadow": "0 4px 12px oklch(0 0 0 / 0.1)",
    "hover_duration": "150ms"
  },
  "logo_url": "https://store.example.com/wp-content/uploads/logo.png",
  "font_family": "Inter",
  "fssai_license": "12345678901234",
  "estd_line": "Since 1987",
  "owner_name": "Acme Family",
  "mov": 200,
  "delivery_fee": 25,
  "delivery_areas": ["Sector 14", "Sector 15", "DLF Phase 2"],
  "template": "bakery",
  "template_config": {
    "bakery": {
      "occasions": [
        { "id": "birthday", "label": "Birthday" },
        { "id": "wedding", "label": "Wedding" }
      ],
      "eggless_default": true
    }
  }
}
```

#### Field Notes

- **Optional strings**: `logo_url`, `colors.secondary`, `colors.accent`, `fssai_license`, `estd_line`, `owner_name`, `template` — return `null` when unset so callers can `value ?? defaultLabel` without a separate empty-string check.
- **Optional integers**: `mov`, `delivery_fee` — return `null` when unset, `0` when explicitly zero (a valid policy meaning "no minimum" / "free delivery"). Frontends should treat the two cases differently.
- **`template_config`**: only includes verticals that hold meaningful values. A bakery merchant who never touched quickcommerce settings will see `template_config: { bakery: {...} }` with no other keys.
- **`contact.whatsapp`**: returns `null` if neither number nor label is set; otherwise an object `{ number, label }`.
- **`trust_signals`**: defaults to `["Genuine Products", "Easy Returns", "Secure Payment", "Fast Delivery"]` if unset or empty.

### GET /settings

Admin-only. Returns the raw editable shape used by the admin UI, including masked secrets and hidden helper fields.

#### Differences from `/config`

| Field | `/config` | `/settings` |
|-------|-----------|-------------|
| `revalidate_secret` | not included | `'********'` if set, `''` if unset |
| `frontend_url` | not included | included |
| `_fallbacks` | not included | `{ app_name, tagline, contact_email }` from WP/WC |
| `_last_revalidate_at` | not included | ISO 8601 timestamp or `null` |
| `mov` / `delivery_fee` | `null` when unset, `0` when zero | `''` when unset, `0` when zero |
| `template_config` | omits empty sections | always returns a fully-shaped skeleton |
| WP/WC fallbacks | applied | not applied |

### POST /settings

Admin-only. Full-replace save. The body is sanitized through the same path as PATCH; missing keys fall back to their default values.

### PATCH /settings

Admin-only. Partial update with these merge semantics:

- Top-level scalars: present keys override; absent keys preserve.
- `null` is treated as "absent" (PHP `isset()` semantics). To clear a field, send `""` (string), `[]` (array), or `false` (boolean).
- `contact`, `colors`, `tokens`, `template_config`: shallow-merge at the inner level. `template_config.bakery` shallow-merges per field, preserving sibling verticals.
- `social`, `cities`, `trust_signals`, `delivery_areas`, and array-shaped nested fields are replaced wholesale when the key is present.

#### Example: patch a single nested template_config field

```bash
curl -X PATCH https://your-site.com/wp-json/headless-storefront/v1/settings \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"template_config": {"bakery": {"eggless_default": true}}}'
```

This updates only `template_config.bakery.eggless_default`; `template_config.bakery.occasions` and the other verticals remain untouched.

### POST /admin/revalidate

Admin-only. Manually fires the revalidation webhook (`POST {frontend_url}/api/revalidate`). Useful when the frontend cache appears stuck. Returns `{ "dispatched": true }` if the webhook was dispatched, `{ "dispatched": false }` if `frontend_url` or `revalidate_secret` is empty.

### POST /diagnostics/test-revalidate

Admin-only. Synchronous version of the webhook with a 10s timeout. Returns the actual HTTP status from the frontend so you can verify the URL and secret without waiting for an option change. Does NOT update `_last_revalidate_at`.

```json
{ "success": true, "code": "ok", "message": "Webhook configured correctly.", "http_code": 200 }
```

#### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 401 | `rest_forbidden` | Authentication required (no valid JWT or missing `manage_options` capability) |
| 403 | `rest_forbidden` | User lacks `manage_options` |

---

## Cache Revalidation Webhook

Saving any of these options triggers a `POST {frontend_url}/api/revalidate` webhook:

- `headless_storefront_config` (any plugin setting save)
- `blogname` (Site Title — fallback for `app_name`)
- `blogdescription` (Tagline — fallback for `tagline`)
- `woocommerce_email_from_address` (fallback for `contact.email`)

**Request:**

```
POST {frontend_url}/api/revalidate
Content-Type: application/json
x-revalidate-secret: <secret>

{ "type": "storefront" }
```

The dispatch is fire-and-forget (5s timeout, non-blocking via `wp_safe_remote_post`). Skipped during WP-CLI runs.

### Frontend handler example (Next.js)

```ts
// app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const secret = req.headers.get('x-revalidate-secret');
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const body = await req.json();
  if (body.type === 'storefront') {
    revalidateTag('storefront-config');
  }
  return NextResponse.json({ ok: true });
}
```

---

## Extending the Public Response

Apply the `headless_storefront_config_response` filter to add or mutate fields on `/config` without owning the option blob. The filter runs after the plugin assembles the response (including all v1.8 additions), so callbacks see the final shape:

```php
add_filter( 'headless_storefront_config_response', function ( $response ) {
    $response['custom_field'] = compute_custom_value();
    return $response;
} );
```

For known verticals, prefer adding fields to `template_config.<vertical>` rather than via the filter so the admin UI can manage them.

---

## Frontend Integration

A typed client for the `/config` response:

```ts
// lib/storefront-config.ts

const BASE = '/wp-json/headless-storefront/v1';

export interface SocialLink {
  platform: 'instagram' | 'facebook' | 'twitter' | 'youtube' | 'linkedin';
  href: string;
  label: string;
}

export interface Whatsapp {
  number: string;
  label: string;
}

export interface Contact {
  phone: string;
  phone_href: string;
  email: string;
  whatsapp: Whatsapp | null;
}

export interface BakeryOccasion {
  id: string;
  label: string;
}

export interface TemplateConfig {
  bakery?: { occasions: BakeryOccasion[]; eggless_default: boolean };
  quickcommerce?: { eta_band_minutes: { min: number; max: number }; cod_enabled: boolean };
  fooddelivery?: { veg_only: boolean; jain_filter_enabled: boolean };
  ecommerce?: { returns_window_days: number; exchange_enabled: boolean };
}

export interface StorefrontConfig {
  app_name: string;
  short_name: string;
  tagline: string;
  title_tagline: string;
  description: string;
  contact: Contact;
  social: SocialLink[];
  cities: string[];
  trust_signals: string[];
  delivery_message: string;
  return_policy: string;
  delivery_badge: string;
  hours_text: string;
  delivery_area_text: string;
  colors: { primary: string; secondary: string | null; accent: string | null };
  tokens: Record<string, string>;
  logo_url: string | null;
  font_family: string;
  fssai_license: string | null;
  estd_line: string | null;
  owner_name: string | null;
  mov: number | null;
  delivery_fee: number | null;
  delivery_areas: string[];
  template:
    | 'kirana'
    | 'megamart'
    | 'bakery'
    | 'quickcommerce'
    | 'ecommerce'
    | 'fooddelivery'
    | null;
  template_config: TemplateConfig;
}

export async function fetchStorefrontConfig(): Promise<StorefrontConfig> {
  const res = await fetch(`${BASE}/config`, {
    next: { tags: ['storefront-config'], revalidate: 31536000 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
```

### Reading template_config safely

`template_config` only includes sections that hold meaningful values, so always check for the section before reading nested fields:

```ts
const config = await fetchStorefrontConfig();

if (config.template === 'bakery' && config.template_config.bakery) {
  const occasions = config.template_config.bakery.occasions;
  const egglessDefault = config.template_config.bakery.eggless_default;
  // render bakery-specific UI
}
```

### Distinguishing unset vs. zero policy

```ts
function deliveryFeeLabel(fee: number | null): string {
  if (fee === null) return 'Calculated at checkout'; // unset
  if (fee === 0) return 'Free delivery';            // explicit zero
  return `₹${fee}`;
}

function minimumOrderLabel(mov: number | null): string {
  if (mov === null) return '';                     // unset — no policy
  if (mov === 0) return 'No minimum order';        // explicit zero
  return `Minimum order ₹${mov}`;
}
```

### PATCH from an external dashboard

```ts
// lib/storefront-admin.ts

async function patchStorefrontSettings(
  patch: Partial<StorefrontConfig>,
  jwt: string,
): Promise<StorefrontConfig> {
  const res = await fetch(`${BASE}/settings`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// Usage: update one nested template_config field; everything else preserved
await patchStorefrontSettings(
  { template_config: { bakery: { eggless_default: true } } },
  jwt,
);
```
