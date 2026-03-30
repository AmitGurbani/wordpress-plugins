import { test, expect } from '../../fixtures/wordpress';
import { request as playwrightRequest } from '@playwright/test';

const SLUG = 'headless-meta-pixel';
const TRACK_URL = `http://localhost:8889/wp-json/${SLUG}/v1/track`;

test.describe('Headless Meta Pixel — Track Endpoint', () => {
  test.beforeAll(async ({ restApi }) => {
    await restApi.updateSettings(SLUG, {
      pixel_id: '123456789012345',
      access_token: 'test_token',
      enable_capi: true,
      enable_view_content: true,
      enable_add_to_cart: true,
      enable_search: true,
    });
  });

  test.afterAll(async ({ restApi }) => {
    await restApi.updateSettings(SLUG, {
      pixel_id: '',
      access_token: '',
      enable_capi: true,
      enable_view_content: true,
      enable_add_to_cart: true,
      enable_initiate_checkout: true,
      enable_purchase: true,
      enable_search: true,
    });
  });

  test('POST /track with valid event returns success', async () => {
    // Track endpoint is public — no auth needed
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(TRACK_URL, {
      data: {
        event_name: 'ViewContent',
        event_id: 'test-event-123',
        event_source_url: 'https://example.com/product/1',
        custom_data: {
          content_type: 'product',
          content_ids: ['PROD-001'],
          value: 29.99,
          currency: 'USD',
        },
      },
    });
    // The response may be 200 or 500 depending on whether the CAPI call succeeds
    // (it won't with dummy credentials), but it should not be 400
    expect(res.status()).not.toBe(400);
    await ctx.dispose();
  });

  test('POST /track without event_name returns 400', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(TRACK_URL, {
      data: { event_id: 'test-123' },
    });
    expect(res.status()).toBe(400);
    await ctx.dispose();
  });

  test('POST /track with unsupported event_name returns 400', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(TRACK_URL, {
      data: {
        event_name: 'UnsupportedEvent',
        event_id: 'test-123',
      },
    });
    expect(res.status()).toBe(400);
    await ctx.dispose();
  });

  test('POST /track with disabled event returns 403', async ({ restApi }) => {
    // Disable ViewContent
    await restApi.updateSettings(SLUG, { enable_view_content: false });

    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(TRACK_URL, {
      data: {
        event_name: 'ViewContent',
        event_id: 'test-123',
        event_source_url: 'https://example.com',
      },
    });
    expect(res.status()).toBe(403);
    await ctx.dispose();

    // Re-enable
    await restApi.updateSettings(SLUG, { enable_view_content: true });
  });

  test('POST /track rate limiting returns 429', async () => {
    const ctx = await playwrightRequest.newContext();

    // Send 61 rapid requests to trigger rate limit (60/min per IP)
    let lastStatus = 200;
    for (let i = 0; i < 61; i++) {
      const res = await ctx.post(TRACK_URL, {
        data: {
          event_name: 'AddToCart',
          event_id: `rate-test-${i}`,
          event_source_url: 'https://example.com',
        },
      });
      lastStatus = res.status();
      if (lastStatus === 429) break;
    }

    expect(lastStatus).toBe(429);
    await ctx.dispose();
  });
});
