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
    slug: 'headless-fuzzy-find',
    label: 'Search',
    request: {
      lang: 'bash',
      code: `# Fuzzy search (handles typos)
curl "https://store.example.com/wp-json/headless-fuzzy-find/v1/search?q=shrt&per_page=3"`,
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
