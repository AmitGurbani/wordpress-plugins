export interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
}

export interface Faq {
  question: string;
  answer: string;
}

export interface Plugin {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  features: string[];
  namespace: string;
  category: 'auth' | 'analytics' | 'ecommerce' | 'search';
  wooCommerce: 'required' | 'optional' | 'none';
  endpoints: Endpoint[];
  faqs: Faq[];
  githubPath: string;
}

const REPO = 'https://github.com/AmitGurbani/wordpress-plugins';

export const plugins: Plugin[] = [
  {
    slug: 'headless-auth',
    name: 'Headless Auth',
    tagline: 'OTP and password authentication with JWT tokens',
    description:
      'Complete authentication solution for headless WordPress stores. Supports phone-based OTP login, username/email + password login, JWT access & refresh tokens, user registration, and brute-force protection.',
    category: 'auth',
    wooCommerce: 'optional',
    namespace: 'headless-auth/v1',
    githubPath: `${REPO}/tree/main/packages/headless-auth`,
    features: [
      'Phone-based OTP login with configurable delivery (SMS, WhatsApp, etc.)',
      'Username/email + password login',
      'JWT access tokens (configurable TTL) + refresh tokens',
      'New user registration with WooCommerce customer role',
      'Rate limiting and brute-force protection with lockout',
      'Test mode for development with admin-only OTP viewing',
    ],
    endpoints: [
      { method: 'POST', path: '/otp/send', description: 'Request OTP' },
      { method: 'POST', path: '/otp/verify', description: 'Verify OTP and get tokens' },
      { method: 'POST', path: '/auth/login', description: 'Username/email + password login' },
      { method: 'POST', path: '/auth/register', description: 'Register new user' },
      { method: 'POST', path: '/auth/refresh', description: 'Refresh JWT token pair' },
      { method: 'GET', path: '/auth/me', description: 'Get current user' },
      { method: 'PUT', path: '/auth/me', description: 'Update current user profile' },
    ],
    faqs: [
      {
        question: 'How does the OTP delivery work?',
        answer:
          'You configure a JSON template with a webhook URL. When an OTP is requested, the plugin sends a POST request with the phone number and OTP code to your endpoint, which handles the actual SMS/WhatsApp delivery.',
      },
      {
        question: 'Does it work without WooCommerce?',
        answer:
          'Yes. Without WooCommerce, new users get the default WordPress subscriber role. With WooCommerce, they get the customer role and billing phone metadata is synced.',
      },
    ],
  },
  {
    slug: 'headless-clarity',
    name: 'Headless Clarity',
    tagline: 'Microsoft Clarity session recordings and heatmaps',
    description:
      'Expose your Microsoft Clarity project configuration via REST API for headless frontends. Supports optional user identification for cross-device session tracking.',
    category: 'analytics',
    wooCommerce: 'none',
    namespace: 'headless-clarity/v1',
    githubPath: `${REPO}/tree/main/packages/headless-clarity`,
    features: [
      'REST endpoint for frontend Clarity script initialization',
      'Optional user identification for cross-device tracking',
      'Works alongside GA4, Meta Pixel, and Umami',
      'No server-side data collection \u2014 lightweight config endpoint only',
    ],
    endpoints: [
      {
        method: 'GET',
        path: '/config',
        description: 'Returns project_id and optional user identity',
      },
    ],
    faqs: [
      {
        question: 'Why not just hardcode the Clarity project ID?',
        answer:
          'A config endpoint lets you manage the project ID from WordPress admin without redeploying your frontend. It also enables optional user identification for logged-in users.',
      },
    ],
  },
  {
    slug: 'headless-fuzzy-find',
    name: 'Headless Fuzzy Find',
    tagline: 'Weighted, fuzzy product search with autocomplete',
    description:
      'Fast WooCommerce product search powered by FULLTEXT indexes and Levenshtein fuzzy matching. Supports weighted relevance scoring across title, SKU, description, attributes, categories, and tags. Built-in autocomplete, synonym expansion, and search analytics.',
    category: 'search',
    wooCommerce: 'required',
    namespace: 'headless-fuzzy-find/v1',
    githubPath: `${REPO}/tree/main/packages/headless-fuzzy-find`,
    features: [
      'FULLTEXT index with weighted relevance scoring',
      'Fuzzy correction via Levenshtein distance (handles typos like "shrt" \u2192 "shirt")',
      'Search-as-you-type autocomplete endpoint',
      'Synonym expansion support',
      '"Did you mean" suggestions for zero-result queries',
      'Search analytics tracking (popular searches, zero-result queries)',
    ],
    endpoints: [
      {
        method: 'GET',
        path: '/search',
        description: 'Paginated search with weighted scoring',
      },
      {
        method: 'GET',
        path: '/autocomplete',
        description: 'Search-as-you-type suggestions',
      },
    ],
    faqs: [
      {
        question: 'How does the relevance scoring work?',
        answer:
          'Title matches are weighted highest, followed by SKU, then short description, attributes, categories/tags, and finally full description. Exact matches rank above fuzzy matches.',
      },
      {
        question: 'Does it replace the default WooCommerce search?',
        answer:
          'It provides a separate REST API endpoint. Your headless frontend calls this instead of the default WP search. The default search remains available for the WordPress admin.',
      },
    ],
  },
  {
    slug: 'headless-google-analytics',
    name: 'Headless Google Analytics',
    tagline: 'GA4 with Measurement Protocol and WooCommerce tracking',
    description:
      'Expose GA4 configuration for headless frontends and automatically track WooCommerce purchases server-side via the Measurement Protocol. Supports user ID enrichment for logged-in users.',
    category: 'analytics',
    wooCommerce: 'optional',
    namespace: 'headless-google-analytics/v1',
    githubPath: `${REPO}/tree/main/packages/headless-google-analytics`,
    features: [
      'REST endpoint for frontend gtag.js initialization',
      'Server-side Measurement Protocol for purchase tracking',
      'Automatic WooCommerce purchase event on order status change',
      'Per-event toggles for individual event types',
      'GA4 debug endpoint integration for payload validation',
      'User ID enrichment for logged-in users',
    ],
    endpoints: [
      {
        method: 'GET',
        path: '/config',
        description: 'Returns measurement_id for frontend initialization',
      },
    ],
    faqs: [
      {
        question: 'Why server-side tracking?',
        answer:
          "Server-side Measurement Protocol events aren't blocked by ad blockers and ensure accurate purchase tracking regardless of the customer's browser environment.",
      },
    ],
  },
  {
    slug: 'headless-meta-pixel',
    name: 'Headless Meta Pixel',
    tagline: 'Meta Pixel with Conversions API and PII hashing',
    description:
      'Full Meta Pixel integration for headless stores. Proxy browser events to the Conversions API (CAPI) with automatic PII hashing, event deduplication, and WooCommerce purchase tracking.',
    category: 'analytics',
    wooCommerce: 'optional',
    namespace: 'headless-meta-pixel/v1',
    githubPath: `${REPO}/tree/main/packages/headless-meta-pixel`,
    features: [
      'REST endpoint for frontend pixel initialization',
      'Server-side Conversions API (CAPI) forwarding',
      'SHA-256 hashing of all PII (email, name, phone, address)',
      'Event deduplication via matching event_id (browser + server)',
      'Automatic WooCommerce purchase tracking on order status change',
      'Per-event toggles and test event code support',
    ],
    endpoints: [
      { method: 'GET', path: '/config', description: 'Returns pixel_id' },
      {
        method: 'POST',
        path: '/track',
        description: 'Proxy browser events to Conversions API',
      },
    ],
    faqs: [
      {
        question: 'How does event deduplication work?',
        answer:
          'Your frontend sends events with an event_id. The /track endpoint forwards the same event_id to CAPI. Meta deduplicates events with matching IDs, so each conversion is counted once.',
      },
      {
        question: 'Is PII handled securely?',
        answer:
          'All personally identifiable information (email, name, phone, address) is SHA-256 hashed before being sent to Meta, as required by the Conversions API specification.',
      },
    ],
  },
  {
    slug: 'headless-pos-sessions',
    name: 'Headless POS Sessions',
    tagline: 'POS register session storage with REST API',
    description:
      'Full CRUD REST API for point-of-sale register sessions. Stores session data as a Custom Post Type with structured metadata. Supports UUID-based deduplication for safe offline sync, automatic daily cleanup, and WooCommerce capability-based permissions.',
    category: 'ecommerce',
    wooCommerce: 'required',
    namespace: 'headless-pos-sessions/v1',
    githubPath: `${REPO}/tree/main/packages/headless-pos-sessions`,
    features: [
      'Full CRUD API for POS register sessions',
      'Custom Post Type storage with structured meta fields',
      'UUID-based deduplication (409 Conflict on duplicate)',
      'Automatic daily cleanup and auto-close of orphaned sessions',
      'Pagination, filtering by status/terminal/cashier/date range',
      'WooCommerce capability-based access control',
    ],
    endpoints: [
      { method: 'POST', path: '/sessions', description: 'Create session' },
      {
        method: 'GET',
        path: '/sessions',
        description: 'List sessions with pagination and filtering',
      },
      { method: 'GET', path: '/sessions/:id', description: 'Get single session' },
      { method: 'PUT', path: '/sessions/:id', description: 'Update session' },
      {
        method: 'DELETE',
        path: '/sessions/:id',
        description: 'Delete session (admin-only)',
      },
    ],
    faqs: [
      {
        question: 'How does offline sync work?',
        answer:
          'Each session includes a UUID. If the POS device retries creating a session that already exists, the API returns 409 Conflict instead of creating a duplicate. This makes offline-first sync safe.',
      },
      {
        question: 'What happens to old sessions?',
        answer:
          'A daily cron job automatically deletes closed sessions older than the configured retention period and auto-closes any orphaned open sessions.',
      },
    ],
  },
  {
    slug: 'headless-umami',
    name: 'Headless Umami',
    tagline: 'Privacy-first Umami Analytics with purchase tracking',
    description:
      'Expose Umami Analytics configuration for headless frontends. Supports both Umami Cloud and self-hosted instances. Automatic WooCommerce purchase event tracking with deduplication. Fully GDPR-friendly \u2014 no cookies, no PII collection.',
    category: 'analytics',
    wooCommerce: 'optional',
    namespace: 'headless-umami/v1',
    githubPath: `${REPO}/tree/main/packages/headless-umami`,
    features: [
      'REST endpoint for frontend Umami script initialization',
      'Supports Umami Cloud and self-hosted instances',
      'Automatic WooCommerce purchase event tracking',
      'Purchase deduplication across order status transitions',
      'Privacy-first: no cookies, no PII collection',
      'Connection diagnostics in admin panel',
    ],
    endpoints: [
      {
        method: 'GET',
        path: '/config',
        description: 'Returns umami_url and website_id',
      },
    ],
    faqs: [
      {
        question: 'Why Umami over Google Analytics?',
        answer:
          'Umami is privacy-first \u2014 no cookies, no PII, fully GDPR-compliant without consent banners. It can be self-hosted for complete data ownership, or used via Umami Cloud.',
      },
    ],
  },
  {
    slug: 'headless-orders',
    name: 'Headless Orders',
    tagline: 'Customer order history REST API',
    description:
      'REST API endpoints for authenticated customers to list and view their own WooCommerce orders. Supports pagination, status filtering, and returns billing/shipping addresses with line items. Fetch all orders or a single order by ID.',
    category: 'ecommerce',
    wooCommerce: 'required',
    namespace: 'headless-orders/v1',
    githubPath: `${REPO}/tree/main/packages/headless-orders`,
    features: [
      'JWT Bearer-token authentication with proper 401 responses',
      'Pagination with per_page and page query parameters',
      'Filter by order status (pending, processing, completed, etc.)',
      'Full billing and shipping address details',
      'Line items with product ID, name, quantity, and totals',
      'X-WP-Total and X-WP-TotalPages response headers',
    ],
    endpoints: [
      {
        method: 'GET',
        path: '/orders',
        description: 'List customer orders with pagination and status filtering',
      },
      {
        method: 'GET',
        path: '/orders/:id',
        description: 'Get a single order by ID',
      },
    ],
    faqs: [
      {
        question: 'How does authentication work?',
        answer:
          'The plugin relies on JWT authentication provided by a companion plugin (e.g., Headless Auth). The JWT token must be sent as a Bearer token in the Authorization header. The plugin itself does not issue tokens.',
      },
      {
        question: "Can a customer see other customers' orders?",
        answer:
          "No. The endpoint strictly filters by the authenticated user's ID. There is no way for one customer to access another's orders.",
      },
    ],
  },
  {
    slug: 'headless-wishlist',
    name: 'Headless Wishlist',
    tagline: 'Per-user product wishlist REST API',
    description:
      'Simple, lightweight wishlist for headless WooCommerce stores. Stores wishlist data in user meta (no custom tables). Includes automatic stale product cleanup, duplicate detection, and admin analytics for most-wishlisted products.',
    category: 'ecommerce',
    wooCommerce: 'required',
    namespace: 'headless-wishlist/v1',
    githubPath: `${REPO}/tree/main/packages/headless-wishlist`,
    features: [
      'Per-user product wishlists via REST API',
      'User meta storage \u2014 no custom database tables',
      'Automatic stale product cleanup on read',
      'Duplicate detection (409 Conflict on add)',
      'Configurable max items per wishlist',
      'Admin analytics: top 20 most wishlisted products',
    ],
    endpoints: [
      { method: 'GET', path: '/items', description: "List user's wishlist" },
      { method: 'POST', path: '/items', description: 'Add product to wishlist' },
      {
        method: 'DELETE',
        path: '/items/{product_id}',
        description: 'Remove product',
      },
      { method: 'DELETE', path: '/items', description: 'Clear entire wishlist' },
    ],
    faqs: [
      {
        question: 'Why user meta instead of a custom table?',
        answer:
          'User meta keeps the plugin lightweight with zero database migrations. For typical wishlist sizes (under 100 items), the performance is identical and the data is automatically cleaned up when a user is deleted.',
      },
    ],
  },
  {
    slug: 'headless-storefront',
    name: 'Headless Storefront',
    tagline: 'Store branding and configuration REST API',
    description:
      'Store branding and configuration REST API for headless WordPress with WooCommerce. All settings live in a single option and are exposed via a public /config endpoint with automatic WordPress and WooCommerce fallbacks.',
    category: 'ecommerce',
    wooCommerce: 'required',
    namespace: 'headless-storefront/v1',
    githubPath: `${REPO}/tree/main/packages/headless-storefront`,
    features: [
      'Public /config endpoint with full store branding (excludes popular searches)',
      'Separate /config/popular-searches endpoint so branding can cache forever',
      'Automatic WP/WC fallbacks (blogname, tagline, email, etc.)',
      '7-tab admin UI: Store Identity, Appearance, Contact & Social, Footer Content, Product Page, Popular Searches, Cache Settings',
      'Revalidation webhook fires on plugin option, blogname, blogdescription, or WC from-email change',
      'Manual "Re-push storefront config" button for debugging',
      'WooCommerce Store API search tracking with weekly cleanup',
      'Single JSON option \u2014 no @Setting decorator sprawl',
    ],
    endpoints: [
      {
        method: 'GET',
        path: '/config',
        description: 'Branding config (excludes popular searches) with WP/WC fallbacks',
      },
      {
        method: 'GET',
        path: '/config/popular-searches',
        description:
          'Returns { items: string[] } \u2014 admin overrides or live query from tracking table',
      },
      {
        method: 'POST',
        path: '/admin/revalidate',
        description:
          'manage_options \u2014 manually fires the revalidation webhook; returns { dispatched: boolean }',
      },
    ],
    faqs: [
      {
        question: 'Why a single /config endpoint instead of per-setting routes?',
        answer:
          'Headless frontends typically need the full branding config in one request at boot time. A single /config response with sensible WP/WC fallbacks minimizes round-trips and lets the frontend stay in sync with a single cache key.',
      },
    ],
  },
  {
    slug: 'headless-media-cleanup',
    name: 'Headless Media Cleanup',
    tagline: 'Auto-delete orphaned WooCommerce media',
    description:
      'Automatically delete media from the WordPress Media Library when images are removed from WooCommerce products, variations, or taxonomy terms \u2014 but only if the image is not used anywhere else. Zero configuration; extensible via filters.',
    category: 'ecommerce',
    wooCommerce: 'required',
    namespace: 'headless-media-cleanup/v1',
    githubPath: `${REPO}/tree/main/packages/headless-media-cleanup`,
    features: [
      'Covers product featured images, gallery images, and variation images',
      'Covers category, tag, and brand thumbnails',
      'Orphan check \u2014 deletes only images with zero remaining WooCommerce references',
      'Image-only guard \u2014 never touches downloadable files or other attachments',
      'Global and per-attachment disable filters',
      'Permanent delete \u2014 skips trash and removes physical files',
    ],
    endpoints: [],
    faqs: [
      {
        question: 'Will it delete images used by blog posts?',
        answer:
          'The orphan check only covers WooCommerce entities (products, variations, categories, tags, brands). Images embedded in post content via <img> tags are not tracked. Use the `headless_media_cleanup_should_delete` filter to add custom checks.',
      },
      {
        question: 'Can I disable it temporarily?',
        answer:
          "Yes. Add `add_filter( 'headless_media_cleanup_enabled', '__return_false' );` to your theme or a mu-plugin.",
      },
    ],
  },
];

export const categories = {
  auth: { label: 'Authentication', color: 'emerald' },
  analytics: { label: 'Analytics', color: 'violet' },
  ecommerce: { label: 'E-Commerce', color: 'amber' },
  search: { label: 'Search', color: 'rose' },
} as const;

export function getPlugin(slug: string): Plugin | undefined {
  return plugins.find((p) => p.slug === slug);
}

export function getPluginsByCategory(category: Plugin['category']): Plugin[] {
  return plugins.filter((p) => p.category === category);
}

export function getOtherPlugins(slug: string): Plugin[] {
  return plugins.filter((p) => p.slug !== slug);
}
