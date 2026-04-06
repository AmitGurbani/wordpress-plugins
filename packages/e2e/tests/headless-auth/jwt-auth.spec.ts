import { request as playwrightRequest } from '@playwright/test';
import { expect, test } from '../../fixtures/wordpress';

const SLUG = 'headless-auth';
const BASE = `http://localhost:8889/wp-json/${SLUG}/v1`;

test.describe('Headless Auth — JWT Authentication', () => {
  test.beforeAll(async ({ restApi }) => {
    await restApi.updateSettings(SLUG, {
      otp_test_mode: true,
      enable_registration: true,
    });
  });

  test('GET /auth/me with valid access_token returns user', async ({ restApi, wpCli }) => {
    const phone = '+15555555555';

    try {
      wpCli('user create jwtuser jwtuser@test.com --role=subscriber --user_pass=testpass123');
    } catch {
      // May exist
    }
    const userId = wpCli('user get jwtuser --field=ID');
    wpCli(`user meta update ${userId} phone_number ${phone}`);

    // Get tokens via OTP flow
    const ctx = await playwrightRequest.newContext();
    const sendRes = await ctx.post(`${BASE}/otp/send`, { data: { phone } });
    expect(sendRes.status()).toBe(200);

    const { data: otpData } = await restApi.get(`${SLUG}/v1/otp/test-otp`);
    expect(otpData.otp).toBeTruthy();

    const verifyRes = await ctx.post(`${BASE}/otp/verify`, {
      data: { phone, otp: otpData.otp },
    });
    expect(verifyRes.status()).toBe(200);
    const tokens = await verifyRes.json();
    expect(tokens.access_token).toBeTruthy();

    // Use access_token to call /auth/me
    const meRes = await ctx.get(`${BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });
    expect(meRes.status()).toBe(200);

    const meData = await meRes.json();
    expect(meData.id).toBe(Number(userId));

    await ctx.dispose();
  });

  test('GET /auth/me with invalid token returns error', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/auth/me`, {
      headers: {
        Authorization: 'Bearer invalid_token_here',
      },
    });
    // Should fail — either 401 or return user_id 0
    const data = await res.json();
    if (res.status() === 200) {
      expect(data.id).toBe(0);
    } else {
      expect(res.status()).toBe(401);
    }
    await ctx.dispose();
  });
});
