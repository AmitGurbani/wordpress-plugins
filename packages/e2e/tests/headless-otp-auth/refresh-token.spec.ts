import { request as playwrightRequest } from '@playwright/test';
import { expect, test } from '../../fixtures/wordpress';

const SLUG = 'headless-otp-auth';
const BASE = `http://localhost:8889/wp-json/${SLUG}/v1`;

test.describe('Headless OTP Auth — Token Refresh', () => {
  test.beforeAll(async ({ restApi }) => {
    await restApi.updateSettings(SLUG, {
      otp_test_mode: true,
      enable_registration: true,
    });
  });

  test('refresh token returns new access and refresh tokens', async ({ restApi, wpCli }) => {
    const phone = '+14444444444';

    // Create user
    try {
      wpCli(
        'user create refreshuser refreshuser@test.com --role=subscriber --user_pass=testpass123',
      );
    } catch {
      // May exist
    }
    const userId = wpCli('user get refreshuser --field=ID');
    wpCli(`user meta update ${userId} phone_number ${phone}`);

    // Send and verify OTP to get tokens
    const ctx = await playwrightRequest.newContext();
    await ctx.post(`${BASE}/otp/send`, { data: { phone } });

    const { data: otpData } = await restApi.get(`${SLUG}/v1/otp/test-otp`);

    const verifyRes = await ctx.post(`${BASE}/otp/verify`, {
      data: { phone, otp: otpData.otp },
    });
    const tokens = await verifyRes.json();
    expect(tokens.refresh_token).toBeDefined();

    // Use refresh token to get new tokens
    const refreshRes = await ctx.post(`${BASE}/auth/refresh`, {
      data: { refresh_token: tokens.refresh_token },
    });
    expect(refreshRes.status()).toBe(200);

    const newTokens = await refreshRes.json();
    expect(newTokens.access_token).toBeDefined();
    expect(newTokens.refresh_token).toBeDefined();

    await ctx.dispose();
  });
});
