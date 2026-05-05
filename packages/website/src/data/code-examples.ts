export interface CodeExample {
  slug: string;
  label: string;
  request: { lang: string; code: string };
  response: { lang: string; code: string };
}

export const codeExamples: CodeExample[] = [
  {
    slug: 'headless-auth',
    label: 'Auth',
    request: {
      lang: 'bash',
      code: `# Send OTP
curl -X POST https://store.example.com/wp-json/headless-auth/v1/otp/send \\
  -H "Content-Type: application/json" \\
  -d '{"phone": "+919876543210"}'

# Verify OTP and get tokens
curl -X POST https://store.example.com/wp-json/headless-auth/v1/otp/verify \\
  -H "Content-Type: application/json" \\
  -d '{"phone": "+919876543210", "otp": "482916"}'`,
    },
    response: {
      lang: 'json',
      code: `{
  "access_token": "eyJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiJ9...",
  "expires_in": 3600,
  "user": {
    "id": 42,
    "username": "customer_9876543210",
    "email": "",
    "display_name": "customer_9876543210",
    "roles": ["customer"]
  }
}`,
    },
  },
  {
    slug: 'headless-clarity',
    label: 'Clarity',
    request: {
      lang: 'bash',
      code: `# Fetch Clarity config (public endpoint — optional user identity for logged-in requests)
curl https://store.example.com/wp-json/headless-clarity/v1/config`,
    },
    response: {
      lang: 'json',
      code: `{
  "project_id": "abcdefghij",
  "user": {
    "id": "42",
    "display_name": "Priya Sharma"
  }
}`,
    },
  },
  {
    slug: 'headless-fuzzy-find',
    label: 'Search',
    request: {
      lang: 'bash',
      code: `# Fuzzy search (handles typos)
curl "https://store.example.com/wp-json/headless-fuzzy-find/v1/search?q=shrt&per_page=3"

# Trending searches for storefront UI (admin overrides or top tracked queries)
curl "https://store.example.com/wp-json/headless-fuzzy-find/v1/popular-searches?limit=8"`,
    },
    response: {
      lang: 'json',
      code: `{
  "results": [
    {
      "id": 156,
      "title": "Classic Cotton Shirt",
      "slug": "classic-cotton-shirt",
      "price": "29.99",
      "image": "https://store.example.com/wp-content/uploads/shirt.jpg",
      "score": 8.42
    },
    {
      "id": 203,
      "title": "Slim Fit Polo Shirt",
      "slug": "slim-fit-polo-shirt",
      "price": "34.99",
      "image": "https://store.example.com/wp-content/uploads/polo.jpg",
      "score": 7.18
    }
  ],
  "total": 12,
  "pages": 4,
  "suggestion": "shirt"
}`,
    },
  },
  {
    slug: 'headless-google-analytics',
    label: 'Google Analytics',
    request: {
      lang: 'bash',
      code: `# Fetch GA4 config (auto-generated from @Setting({ exposeInConfig: true }))
curl https://store.example.com/wp-json/headless-google-analytics/v1/config`,
    },
    response: {
      lang: 'json',
      code: `{
  "measurement_id": "G-XXXXXXXX"
}`,
    },
  },
  {
    slug: 'headless-meta-pixel',
    label: 'Meta Pixel',
    request: {
      lang: 'typescript',
      code: `// Track event via Conversions API
const response = await fetch(
  "https://store.example.com/wp-json/headless-meta-pixel/v1/track",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_name: "AddToCart",
      event_id: "evt_abc123",  // for deduplication
      custom_data: {
        currency: "INR",
        value: 1499.0,
        content_ids: ["SKU-001"],
        content_type: "product",
      },
    }),
  }
);`,
    },
    response: {
      lang: 'json',
      code: `{
  "success": true,
  "events_received": 1,
  "fbtrace_id": "A2b3C4d5E6f7G8h9"
}`,
    },
  },
  {
    slug: 'headless-orders',
    label: 'Orders',
    request: {
      lang: 'bash',
      code: `# List authenticated customer's orders (pagination via X-WP-Total headers)
curl -i "https://store.example.com/wp-json/headless-orders/v1/orders?per_page=10&status=processing" \\
  -H "Authorization: Bearer eyJhbGci..."

# Fetch a single order
curl https://store.example.com/wp-json/headless-orders/v1/orders/4821 \\
  -H "Authorization: Bearer eyJhbGci..."`,
    },
    response: {
      lang: 'json',
      code: `[
  {
    "id": 4821,
    "order_number": "4821",
    "status": "processing",
    "created_at": "2026-04-20T14:32:00+00:00",
    "updated_at": "2026-04-20T14:35:00+00:00",
    "total": "1499.00",
    "shipping_total": "0.00",
    "currency": "INR",
    "payment_method": "cod",
    "customer_note": "",
    "billing": {
      "first_name": "Priya",
      "last_name": "Sharma",
      "email": "priya@example.com",
      "phone": "+919876543210"
    },
    "shipping": {
      "first_name": "Priya",
      "last_name": "Sharma",
      "city": "Mumbai",
      "country": "IN"
    },
    "items": [
      {
        "product_id": 156,
        "variation_id": 0,
        "name": "Classic Cotton Shirt",
        "quantity": 1,
        "subtotal": "1499.00",
        "total": "1499.00"
      }
    ]
  }
]`,
    },
  },
  {
    slug: 'headless-pos-sessions',
    label: 'POS Sessions',
    request: {
      lang: 'bash',
      code: `# Open a register session (idempotent — retrying with the same session_uuid returns 409 Conflict)
curl -X POST https://store.example.com/wp-json/headless-pos-sessions/v1/sessions \\
  -H "Authorization: Bearer eyJhbGci..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "session_uuid": "c1a8b0de-2c3e-4a1d-9f7b-7e2a3c4d5e6f",
    "terminal_id": "TERM-01",
    "opened_at": "2026-04-23T09:00:00Z",
    "opening_balance": 500.00
  }'

# Fetch the created session by id
curl https://store.example.com/wp-json/headless-pos-sessions/v1/sessions/9214 \\
  -H "Authorization: Bearer eyJhbGci..."`,
    },
    response: {
      lang: 'json',
      code: `{
  "id": 9214,
  "session_uuid": "c1a8b0de-2c3e-4a1d-9f7b-7e2a3c4d5e6f",
  "terminal_id": "TERM-01",
  "status": "open",
  "opened_at": "2026-04-23T09:00:00Z",
  "closed_at": "",
  "opening_balance": 500.00,
  "closing_balance": 0,
  "expected_balance": 0,
  "cash_in": 0,
  "cash_out": 0,
  "order_count": 0,
  "order_ids": [],
  "notes": "",
  "cashier_id": 42,
  "created_at": "2026-04-23 09:00:00"
}`,
    },
  },
  {
    slug: 'headless-storefront',
    label: 'Storefront',
    request: {
      lang: 'bash',
      code: `# Fetch branding config (public — caches forever)
curl https://store.example.com/wp-json/headless-storefront/v1/config`,
    },
    response: {
      lang: 'json',
      code: `{
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
}`,
    },
  },
  {
    slug: 'headless-umami',
    label: 'Umami',
    request: {
      lang: 'bash',
      code: `# Fetch Umami config (public endpoint — Umami Cloud or self-hosted URL)
curl https://store.example.com/wp-json/headless-umami/v1/config`,
    },
    response: {
      lang: 'json',
      code: `{
  "umami_url": "https://analytics.example.com",
  "website_id": "c1a8b0de-2c3e-4a1d-9f7b-7e2a3c4d5e6f"
}`,
    },
  },
  {
    slug: 'headless-wishlist',
    label: 'Wishlist',
    request: {
      lang: 'bash',
      code: `# Add product to wishlist
curl -X POST https://store.example.com/wp-json/headless-wishlist/v1/items \\
  -H "Authorization: Bearer eyJhbGci..." \\
  -H "Content-Type: application/json" \\
  -d '{"product_id": 156}'

# List wishlist
curl https://store.example.com/wp-json/headless-wishlist/v1/items \\
  -H "Authorization: Bearer eyJhbGci..."`,
    },
    response: {
      lang: 'json',
      code: `{
  "items": [
    {
      "product_id": 156,
      "title": "Classic Cotton Shirt",
      "price": "29.99",
      "image": "https://store.example.com/wp-content/uploads/shirt.jpg",
      "added_at": "2026-04-09T10:30:00Z"
    }
  ],
  "count": 1,
  "max_items": 100
}`,
    },
  },
];

export const wptsExample = {
  typescript: {
    lang: 'typescript',
    code: `@Setting({ sensitive: true })
apiKey: string;

@Setting({ exposeInConfig: true })
measurementId: string;

@RestRoute('/track', { methods: 'POST', auth: true })
trackEvent(data: RequestData): WpRestResponse {
  const payload = this.buildPayload(data);
  return wpRemotePost(GA4_ENDPOINT, payload);
}`,
  },
  php: {
    lang: 'php',
    code: `// Auto-generated PHP — do not edit
register_setting('headless_ga', 'headless_ga_api_key', [
    'type' => 'string',
    'sanitize_callback' => 'sanitize_text_field',
]);

register_rest_route('headless-google-analytics/v1', '/config', [
    'methods'  => 'GET',
    'callback' => [$this, 'get_config'],
    'permission_callback' => '__return_true',
]);

register_rest_route('headless-google-analytics/v1', '/track', [
    'methods'  => 'POST',
    'callback' => [$this, 'track_event'],
    'permission_callback' => [$this, 'check_auth'],
]);`,
  },
};
