import { request as playwrightRequest } from '@playwright/test';
import { expect, test } from '../../fixtures/wordpress';

const SLUG = 'headless-auth';
const BASE = `http://localhost:8889/wp-json/${SLUG}/v1`;

test.describe('Headless Auth — Token Refresh', () => {
  test.beforeAll(async ({ restApi }) => {
    await restApi.updateSettings(SLUG, {
      otp_test_mode: true,
      enable_registration: true,
      enable_password_login: true,
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

  test('old refresh token works within 30s grace period (idempotent)', async () => {
    const ctx = await playwrightRequest.newContext();

    // Login to get tokens
    const loginRes = await ctx.post(`${BASE}/auth/login`, {
      data: { username: 'refreshuser', password: 'testpass123' },
    });
    expect(loginRes.status()).toBe(200);
    const { refresh_token: oldRefreshToken } = await loginRes.json();

    // Wait so the refresh generates tokens with a different iat (JWT is
    // deterministic for same-second inputs — same iat = identical token)
    await new Promise((r) => setTimeout(r, 1100));

    // First refresh — rotates tokens
    const firstRefresh = await ctx.post(`${BASE}/auth/refresh`, {
      data: { refresh_token: oldRefreshToken },
    });
    expect(firstRefresh.status()).toBe(200);
    const firstTokens = await firstRefresh.json();

    // Reuse old refresh token within grace period — should return same tokens
    const secondRefresh = await ctx.post(`${BASE}/auth/refresh`, {
      data: { refresh_token: oldRefreshToken },
    });
    expect(secondRefresh.status()).toBe(200);

    const secondTokens = await secondRefresh.json();
    expect(secondTokens.access_token).toBe(firstTokens.access_token);
    expect(secondTokens.refresh_token).toBe(firstTokens.refresh_token);

    await ctx.dispose();
  });

  test('old refresh token fails after new login clears grace period', async () => {
    const ctx = await playwrightRequest.newContext();

    // Login to get tokens
    const loginRes = await ctx.post(`${BASE}/auth/login`, {
      data: { username: 'refreshuser', password: 'testpass123' },
    });
    expect(loginRes.status()).toBe(200);
    const { refresh_token: oldRefreshToken } = await loginRes.json();

    // Refresh — rotates tokens, caches grace period
    const refreshRes = await ctx.post(`${BASE}/auth/refresh`, {
      data: { refresh_token: oldRefreshToken },
    });
    expect(refreshRes.status()).toBe(200);

    // Login again — should clear the grace period transient
    const reloginRes = await ctx.post(`${BASE}/auth/login`, {
      data: { username: 'refreshuser', password: 'testpass123' },
    });
    expect(reloginRes.status()).toBe(200);

    // Old refresh token should now be revoked (grace cleared by new login)
    const reuseRes = await ctx.post(`${BASE}/auth/refresh`, {
      data: { refresh_token: oldRefreshToken },
    });
    expect(reuseRes.status()).toBe(401);

    const error = await reuseRes.json();
    expect(error.code).toBe('invalid_token');

    await ctx.dispose();
  });
});
