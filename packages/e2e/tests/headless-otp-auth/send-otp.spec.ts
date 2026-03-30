import { test, expect } from '../../fixtures/wordpress';
import { request as playwrightRequest } from '@playwright/test';

const SLUG = 'headless-otp-auth';
const BASE = `http://localhost:8889/wp-json/${SLUG}/v1`;

test.describe('Headless OTP Auth — Send OTP', () => {
  test.beforeAll(async ({ restApi }) => {
    await restApi.updateSettings(SLUG, {
      otp_test_mode: true,
      otp_length: 6,
      otp_expiry: 300,
      max_otp_attempts: 3,
      rate_limit_window: 900,
      otp_resend_cooldown: 60,
    });
  });

  test('POST /otp/send in test mode returns success', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(`${BASE}/otp/send`, {
      data: { phone: '+11234567890' },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    await ctx.dispose();
  });

  test('GET /otp/test-otp returns the OTP in test mode', async ({
    restApi,
  }) => {
    // Send an OTP first (via public endpoint)
    const ctx = await playwrightRequest.newContext();
    await ctx.post(`${BASE}/otp/send`, {
      data: { phone: '+11234567891' },
    });
    await ctx.dispose();

    // Retrieve the OTP as admin
    const { status, data } = await restApi.get(`${SLUG}/v1/otp/test-otp`);
    expect(status).toBe(200);
    expect(data.otp).toBeDefined();
    expect(data.otp.length).toBe(6);
  });

  test('GET /otp/test-otp requires admin authentication', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/otp/test-otp`);
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });

  test('POST /otp/send without phone returns error', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(`${BASE}/otp/send`, {
      data: {},
    });
    expect(res.status()).toBe(400);
    await ctx.dispose();
  });
});
