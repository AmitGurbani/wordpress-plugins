import { request as playwrightRequest } from '@playwright/test';
import { expect, test, wpCli } from '../../fixtures/wordpress';

const SLUG = 'headless-storefront';
const BASE = `http://localhost:8889/wp-json/${SLUG}/v1`;

test.describe('Headless Storefront — Config API', () => {
  test.afterAll(async ({ restApi }) => {
    // The "dispatched:true" test below populates the last-revalidate option;
    // delete it so the option doesn't leak across test runs.
    wpCli('option delete headless_storefront_last_revalidate_at');
    // Reset config to empty (defaults)
    await restApi.updateSettings(SLUG, {
      app_name: '',
      short_name: '',
      tagline: '',
      title_tagline: '',
      description: '',
      logo_url: '',
      font_family: 'Inter',
      contact: { phone: '', phone_href: '', email: '', whatsapp_number: '', whatsapp_label: '' },
      social: [],
      cities: [],
      trust_signals: ['Genuine Products', 'Easy Returns', 'Secure Payment', 'Fast Delivery'],
      delivery_message: 'Delivery in 1\u20132 business days',
      return_policy:
        'Easy returns within 7 days of delivery. Items must be unused and in original packaging.',
      delivery_badge: '',
      hours_text: '',
      delivery_area_text: '',
      colors: { primary: '#6366f1', secondary: '', accent: '' },
      tokens: {
        section_gap: '2rem',
        card_padding: '0.75rem',
        card_radius: '0.75rem',
        button_radius: '0.5rem',
        image_radius: '0.5rem',
        card_shadow: 'none',
        card_hover_shadow: '0 4px 12px oklch(0 0 0 / 0.1)',
        hover_duration: '150ms',
      },
      frontend_url: '',
      revalidate_secret: '',
    });
  });

  test('GET /config is publicly accessible', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/config`);
    expect(res.status()).toBe(200);
    await ctx.dispose();
  });

  test('GET /config returns all expected fields with defaults', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/config`);
    const data = await res.json();

    // Top-level fields
    expect(data).toHaveProperty('app_name');
    expect(data).toHaveProperty('short_name');
    expect(data).toHaveProperty('tagline');
    expect(data).toHaveProperty('title_tagline');
    expect(data).toHaveProperty('description');
    expect(data).toHaveProperty('contact');
    expect(data).toHaveProperty('social');
    expect(data).toHaveProperty('cities');
    expect(data).toHaveProperty('trust_signals');
    expect(data).toHaveProperty('delivery_message');
    expect(data).toHaveProperty('return_policy');
    expect(data).toHaveProperty('delivery_badge');
    expect(data).toHaveProperty('hours_text');
    expect(data).toHaveProperty('delivery_area_text');
    expect(data).toHaveProperty('colors');
    expect(data).toHaveProperty('tokens');
    expect(data).toHaveProperty('logo_url');
    expect(data).toHaveProperty('font_family');

    // Defaults
    expect(data.font_family).toBe('Inter');
    expect(data.delivery_badge).toBe('');
    expect(Array.isArray(data.social)).toBe(true);
    expect(Array.isArray(data.cities)).toBe(true);
    expect(Array.isArray(data.trust_signals)).toBe(true);
    expect(data.trust_signals).toEqual([
      'Genuine Products',
      'Easy Returns',
      'Secure Payment',
      'Fast Delivery',
    ]);

    // Token defaults
    expect(data.tokens.section_gap).toBe('2rem');
    expect(data.tokens.card_radius).toBe('0.75rem');
    expect(data.tokens.hover_duration).toBe('150ms');

    // Color defaults
    expect(data.colors.primary).toBe('#6366f1');

    // Admin-only fields must NOT be present
    expect(data).not.toHaveProperty('frontend_url');
    expect(data).not.toHaveProperty('revalidate_secret');
    expect(data).not.toHaveProperty('_fallbacks');

    await ctx.dispose();
  });

  test('GET /config applies WP fallbacks for app_name and tagline', async () => {
    // With empty app_name/tagline, /config should fall back to WP blogname/blogdescription
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/config`);
    const data = await res.json();

    // blogname is always set in WordPress; blogdescription may be empty in wp-env
    expect(data.app_name.length).toBeGreaterThan(0);
    expect(typeof data.tagline).toBe('string');

    await ctx.dispose();
  });

  test('GET /config short_name falls back to app_name', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/config`);
    const data = await res.json();

    // When short_name is empty, it should equal app_name
    expect(data.short_name).toBe(data.app_name);

    await ctx.dispose();
  });

  test('GET /config returns null for empty optional colors', async ({ restApi }) => {
    // Explicitly clear optional colors (fresh install seeds slate defaults)
    await restApi.updateSettings(SLUG, {
      colors: { primary: '#6366f1', secondary: '', accent: '' },
    });

    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/config`);
    const data = await res.json();

    expect(data.colors.secondary).toBeNull();
    expect(data.colors.accent).toBeNull();

    await ctx.dispose();
  });

  test('GET /config returns null for empty logo_url', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/config`);
    const data = await res.json();

    expect(data.logo_url).toBeNull();

    await ctx.dispose();
  });

  test('GET /config returns null whatsapp when not set', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/config`);
    const data = await res.json();

    expect(data.contact.whatsapp).toBeNull();

    await ctx.dispose();
  });

  test('GET /config reflects updated settings', async ({ restApi }) => {
    await restApi.updateSettings(SLUG, {
      app_name: 'Config Test Store',
      short_name: 'CTS',
      tagline: 'Config tagline',
      contact: {
        phone: '1800-999-0000',
        phone_href: 'tel:18009990000',
        email: 'config@test.com',
        whatsapp_number: '911111111111',
        whatsapp_label: 'Chat',
      },
      social: [{ platform: 'facebook', href: 'https://facebook.com/test', label: 'Facebook' }],
      cities: ['Pune', 'Goa'],
      colors: { primary: '#ff0000', secondary: '#00ff00', accent: '' },
    });

    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/config`);
    const data = await res.json();

    expect(data.app_name).toBe('Config Test Store');
    expect(data.short_name).toBe('CTS');
    expect(data.tagline).toBe('Config tagline');
    expect(data.contact.phone).toBe('1800-999-0000');
    expect(data.contact.email).toBe('config@test.com');
    expect(data.contact.whatsapp).toEqual({ number: '911111111111', label: 'Chat' });
    expect(data.social).toHaveLength(1);
    expect(data.social[0].platform).toBe('facebook');
    expect(data.cities).toEqual(['Pune', 'Goa']);
    expect(data.colors.primary).toBe('#ff0000');
    expect(data.colors.secondary).toBe('#00ff00');
    expect(data.colors.accent).toBeNull();

    await ctx.dispose();
  });

  test('POST /admin/revalidate requires authentication', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(`${BASE}/admin/revalidate`);
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });

  test('POST /admin/revalidate returns dispatched:false when frontend_url empty', async ({
    restApi,
  }) => {
    await restApi.updateSettings(SLUG, { frontend_url: '', revalidate_secret: '' });

    const { status, data } = await restApi.post(`${SLUG}/v1/admin/revalidate`);
    expect(status).toBe(200);
    expect(data).toEqual({ dispatched: false });
  });

  test('POST /admin/revalidate returns dispatched:true when config is set', async ({ restApi }) => {
    // Config is set; dispatched:true reflects the helper firing wp_safe_remote_post (which
    // itself may reject private URLs via SSRF guard, but that's fire-and-forget and not
    // observable here).
    await restApi.updateSettings(SLUG, {
      frontend_url: 'https://example.com',
      revalidate_secret: 'test-secret',
    });

    const { status, data } = await restApi.post(`${SLUG}/v1/admin/revalidate`);
    expect(status).toBe(200);
    expect(data).toEqual({ dispatched: true });
  });

  test('GET /settings includes _fallbacks', async ({ restApi }) => {
    const { data } = await restApi.getSettings(SLUG);

    expect(data).toHaveProperty('_fallbacks');
    expect(data._fallbacks).toHaveProperty('app_name');
    expect(data._fallbacks).toHaveProperty('tagline');
    expect(data._fallbacks).toHaveProperty('contact_email');
  });

  test('POST /settings validates social platform', async ({ restApi }) => {
    const { status } = await restApi.updateSettings(SLUG, {
      social: [
        { platform: 'instagram', href: 'https://instagram.com/valid', label: 'Valid' },
        { platform: 'invalid_platform', href: 'https://example.com', label: 'Invalid' },
      ],
    });
    expect(status).toBe(200);

    // Invalid platform should be filtered out
    const { data: settings } = await restApi.getSettings(SLUG);
    const platforms = settings.social.map((s: any) => s.platform);
    expect(platforms).toContain('instagram');
    expect(platforms).not.toContain('invalid_platform');
  });

  test('GET /config returns hours_text and delivery_area_text', async ({ restApi }) => {
    await restApi.updateSettings(SLUG, {
      hours_text: 'Mon–Sat 9–9',
      delivery_area_text: 'Within 5 km of Bandra',
    });

    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/config`);
    const data = await res.json();
    expect(data.hours_text).toBe('Mon–Sat 9–9');
    expect(data.delivery_area_text).toBe('Within 5 km of Bandra');
    await ctx.dispose();
  });

  test('PATCH /settings requires authentication', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.patch(`${BASE}/settings`, { data: { app_name: 'No Auth' } });
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });

  test('PATCH /settings updates only the provided keys', async ({ restApi }) => {
    // Seed a known full state
    await restApi.updateSettings(SLUG, {
      app_name: 'Patch Base',
      tagline: 'Patch base tagline',
      hours_text: '',
      delivery_area_text: '',
    });

    // Patch a single field
    const { status, data } = await restApi.patch(`${SLUG}/v1/settings`, {
      app_name: 'Patch Updated',
    });
    expect(status).toBe(200);
    expect(data.app_name).toBe('Patch Updated');
    // Other fields untouched
    expect(data.tagline).toBe('Patch base tagline');
  });

  test('PATCH /settings shallow-merges nested objects', async ({ restApi }) => {
    await restApi.updateSettings(SLUG, {
      colors: { primary: '#111111', secondary: '#222222', accent: '#333333' },
    });

    // Patch only colors.secondary
    const { data } = await restApi.patch(`${SLUG}/v1/settings`, {
      colors: { secondary: '#aabbcc' },
    });

    expect(data.colors.primary).toBe('#111111');
    expect(data.colors.secondary).toBe('#aabbcc');
    expect(data.colors.accent).toBe('#333333');
  });

  test('PATCH /settings clears with empty string', async ({ restApi }) => {
    await restApi.updateSettings(SLUG, { hours_text: 'Mon–Sat 9–9' });

    const { data } = await restApi.patch(`${SLUG}/v1/settings`, { hours_text: '' });
    expect(data.hours_text).toBe('');
  });

  test('PATCH /settings treats null as absent (no-op)', async ({ restApi }) => {
    await restApi.updateSettings(SLUG, { tagline: 'Keep me' });

    // null is treated like "key absent" — see docs in config-routes.ts patchSettings
    const { data } = await restApi.patch(`${SLUG}/v1/settings`, { tagline: null });
    expect(data.tagline).toBe('Keep me');
  });

  test('PATCH /settings replaces arrays wholesale when present', async ({ restApi }) => {
    await restApi.updateSettings(SLUG, { cities: ['Mumbai', 'Delhi', 'Bengaluru'] });

    const { data } = await restApi.patch(`${SLUG}/v1/settings`, { cities: ['Pune'] });
    expect(data.cities).toEqual(['Pune']);
  });
});
