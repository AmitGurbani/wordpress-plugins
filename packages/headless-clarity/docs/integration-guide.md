# Integration Guide

Headless Clarity provides a REST API endpoint for headless WordPress stores. The frontend handles all browser-side tracking via the Clarity JS script; this plugin serves the Clarity Project ID and optional user identity data.

## Overview

```
Frontend (Next.js, Nuxt, etc.)           WordPress
──────────────────────────────           ──────────────────────────────────
GET /config  ──────────────────────────→ returns { project_id, user? }
Load Clarity script
clarity("identify", user.id, ...)        (direct to Clarity, not via WP)
clarity("set", "key", "value")           (direct to Clarity, not via WP)
clarity("event", "name")                 (direct to Clarity, not via WP)
```

**Key design point:** Clarity is a purely client-side tool for session recordings and heatmaps. There is no server-side event API — no Measurement Protocol, no CAPI. WordPress only provides the configuration. All tracking happens in the browser.

**Base URL:** `https://your-site.com/wp-json/headless-clarity/v1`

If the site uses plain permalinks: `https://your-site.com/?rest_route=/headless-clarity/v1`

---

## GET /config

Returns the Clarity Project ID and optional user identity for frontend initialization. Public — no authentication required.

### Request

```http
GET /wp-json/headless-clarity/v1/config
```

### Response (anonymous user)

```json
{
  "project_id": "abcdefghij"
}
```

### Response (logged-in user, with Enable Identify on)

```json
{
  "project_id": "abcdefghij",
  "user": {
    "id": "42",
    "display_name": "John Doe"
  }
}
```

### Usage

```ts
const res = await fetch('/wp-json/headless-clarity/v1/config');
const config = await res.json();
```

If `project_id` is empty, the plugin is not yet configured — skip script loading.

---

## Frontend Script Initialization

Load the Clarity tracking script using the Project ID from `/config`:

```ts
(function(c, l, a, r, i, t, y) {
  c[a] = c[a] || function() { (c[a].q = c[a].q || []).push(arguments) };
  t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
  y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
})(window, document, "clarity", "script", config.project_id);
```

Or using the NPM package:

```bash
npm install @microsoft/clarity
```

```ts
import { clarity } from '@microsoft/clarity';
clarity.init(config.project_id);
```

---

## Clarity JavaScript API

Once the script is loaded, the global `clarity()` function is available.

### User Identification

If the `/config` response includes `user` data, identify the user for cross-device tracking:

```ts
if (config.user) {
  window.clarity("identify", config.user.id, null, null, config.user.display_name);
}
```

Clarity hashes the custom ID client-side before transmission. The `display_name` is shown in the dashboard as a friendly label.

### Custom Tags

Filter sessions in the Clarity dashboard by attaching metadata:

```ts
window.clarity("set", "page_type", "product");
window.clarity("set", "category", "electronics");
window.clarity("set", "user_role", "subscriber");
```

Tags accept a string or an array of strings as the value. No limit on the number of tags.

### Custom Events

Track specific actions as timeline markers in session recordings:

```ts
window.clarity("event", "add_to_cart");
window.clarity("event", "search");
window.clarity("event", "video_played");
```

### Cookie Consent

Clarity requires consent signals for users from the EEA, UK, and Switzerland (enforced since October 2025). Use the `consentv2` API:

```ts
// User granted consent
window.clarity("consentv2", {
  ad_Storage: "granted",
  analytics_Storage: "granted"
});

// User denied consent
window.clarity("consentv2", {
  ad_Storage: "denied",
  analytics_Storage: "denied"
});

// Erase cookies and stop tracking
window.clarity("consent", false);
```

Without consent, Clarity assigns a unique ID per page view and does not link sessions.

### Prioritize Sessions

If your site exceeds 100k sessions/day and Clarity is sampling, prioritize important sessions:

```ts
window.clarity("upgrade", "checkout_started");
window.clarity("upgrade", "high_value_customer");
```

---

## Purchase Tracking

Clarity has no server-side event API, so purchases **must be tracked client-side** on the order confirmation page using custom tags and events:

```ts
// On the order confirmation / "thank you" page
window.clarity("event", "purchase");
window.clarity("set", "order_id", order.id);
window.clarity("set", "order_value", order.total);
window.clarity("set", "currency", order.currency);
```

This allows filtering sessions by purchase value in the Clarity dashboard.

**Tip:** If you also use the [Headless Google Analytics](../../headless-google-analytics/) plugin and push GA4 eCommerce `dataLayer` events, Clarity will auto-detect those for product insights and conversion maps.

---

## TypeScript / React Example

A complete helper for initializing Clarity:

```ts
// lib/clarity.ts

let initialized = false;

interface ClarityConfig {
  project_id: string;
  user?: { id: string; display_name: string };
}

export async function initClarity(): Promise<void> {
  if (initialized) return;

  const res = await fetch('/wp-json/headless-clarity/v1/config');
  const config: ClarityConfig = await res.json();
  if (!config.project_id) return;

  // Load Clarity script
  (function(c: any, l: any, a: any, r: any, i: any, t: any, y: any) {
    c[a] = c[a] || function() { (c[a].q = c[a].q || []).push(arguments) };
    t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", config.project_id, undefined, undefined);

  // Identify user if available
  if (config.user) {
    (window as any).clarity("identify", config.user.id, null, null, config.user.display_name);
  }

  initialized = true;
}
```

Usage in a Next.js app:

```tsx
// app/layout.tsx
'use client';
import { useEffect } from 'react';
import { initClarity } from '@/lib/clarity';

export default function RootLayout({ children }) {
  useEffect(() => {
    initClarity();
  }, []);

  return <html><body>{children}</body></html>;
}
```

```tsx
// On order confirmation page
'use client';
import { useEffect } from 'react';

export default function OrderConfirmation({ order }) {
  useEffect(() => {
    if ((window as any).clarity) {
      (window as any).clarity("event", "purchase");
      (window as any).clarity("set", "order_id", order.id);
      (window as any).clarity("set", "order_value", String(order.total));
      (window as any).clarity("set", "currency", order.currency);
    }
  }, [order]);

  // ...
}
```

---

## Privacy

Microsoft Clarity:

- Automatically masks sensitive content (input fields, numbers, email addresses)
- Supports additional masking via `data-clarity-mask="true"` HTML attribute
- Hashes custom user IDs client-side before transmission
- Supports cookie-less mode for privacy-conscious deployments
- Does **not** inject any JavaScript into WordPress themes (headless-first design)
