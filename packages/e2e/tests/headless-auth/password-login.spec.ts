import { request as playwrightRequest } from '@playwright/test';
import { expect, test } from '../../fixtures/wordpress';

const SLUG = 'headless-auth';
const BASE = `http://localhost:8889/wp-json/${SLUG}/v1`;

test.describe('Headless Auth — Password Login', () => {
  test.beforeAll(async ({ restApi, wpCli }) => {
    await restApi.updateSettings(SLUG, {
      enable_password_login: true,
      max_login_attempts: 5,
    });

    try {
      wpCli('user create loginuser loginuser@test.com --role=subscriber --user_pass=TestPass123!');
    } catch {
      // May exist — update password to ensure it matches
      wpCli('user update loginuser --user_pass=TestPass123!');
    }
  });

  test('POST /auth/login with username + password returns tokens', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(`${BASE}/auth/login`, {
      data: { username: 'loginuser', password: 'TestPass123!' },
    });
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data.access_token).toBeTruthy();
    expect(data.refresh_token).toBeTruthy();
    expect(data.user.id).toBeGreaterThan(0);
    expect(data.user.name).toBeTruthy();
    expect(data.user.email).toBe('loginuser@test.com');
    expect(data.user.phone).toBeDefined();
    expect(data.user.roles).toContain('subscriber');

    await ctx.dispose();
  });

  test('POST /auth/login with email + password returns tokens', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(`${BASE}/auth/login`, {
      data: { username: 'loginuser@test.com', password: 'TestPass123!' },
    });
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data.access_token).toBeTruthy();
    expect(data.refresh_token).toBeTruthy();
    expect(data.user.email).toBe('loginuser@test.com');

    await ctx.dispose();
  });

  test('POST /auth/login with wrong password returns 401', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(`${BASE}/auth/login`, {
      data: { username: 'loginuser', password: 'wrongpassword' },
    });
    expect(res.status()).toBe(401);

    const data = await res.json();
    expect(data.code).toBe('invalid_credentials');

    await ctx.dispose();
  });

  test('POST /auth/login with missing params returns 400', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(`${BASE}/auth/login`, {
      data: { username: 'loginuser' },
    });
    expect(res.status()).toBe(400);

    const data = await res.json();
    expect(data.code).toBe('missing_params');

    await ctx.dispose();
  });

  test('POST /auth/login with nonexistent user returns 401', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(`${BASE}/auth/login`, {
      data: { username: 'nonexistent_user_xyz', password: 'anypassword' },
    });
    expect(res.status()).toBe(401);

    const data = await res.json();
    expect(data.code).toBe('invalid_credentials');

    await ctx.dispose();
  });

  test('returned access token works for authenticated requests', async () => {
    const ctx = await playwrightRequest.newContext();
    const loginRes = await ctx.post(`${BASE}/auth/login`, {
      data: { username: 'loginuser', password: 'TestPass123!' },
    });
    expect(loginRes.status()).toBe(200);
    const tokens = await loginRes.json();

    const meRes = await ctx.get(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    expect(meRes.status()).toBe(200);

    const meData = await meRes.json();
    expect(meData.id).toBe(tokens.user.id);

    await ctx.dispose();
  });

  test('POST /auth/login when disabled returns 403', async ({ restApi }) => {
    await restApi.updateSettings(SLUG, { enable_password_login: false });

    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(`${BASE}/auth/login`, {
      data: { username: 'loginuser', password: 'TestPass123!' },
    });
    expect(res.status()).toBe(403);

    const data = await res.json();
    expect(data.code).toBe('login_disabled');

    await ctx.dispose();

    // Re-enable for other tests
    await restApi.updateSettings(SLUG, { enable_password_login: true });
  });
});
