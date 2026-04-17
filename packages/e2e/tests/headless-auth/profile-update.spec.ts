import { request as playwrightRequest } from '@playwright/test';
import { expect, test } from '../../fixtures/wordpress';

const SLUG = 'headless-auth';
const BASE = `http://localhost:8889/wp-json/${SLUG}/v1`;

test.describe('Headless Auth — Profile Update (PUT /auth/me)', () => {
  test.beforeAll(async ({ restApi }) => {
    await restApi.updateSettings(SLUG, {
      otp_test_mode: true,
      enable_registration: true,
    });
  });

  /** Helper: create user, get JWT access token via OTP flow */
  async function getTokenForUser(
    username: string,
    email: string,
    phone: string,
    restApi: any,
    wpCli: (cmd: string) => string,
  ) {
    try {
      wpCli(
        `user create ${username} ${email} --role=customer --user_pass=testpass123 --first_name=Test --last_name=User`,
      );
    } catch {
      // May exist
    }
    const userId = wpCli(`user get ${username} --field=ID`);
    wpCli(`user meta update ${userId} phone_number ${phone}`);

    const ctx = await playwrightRequest.newContext();
    await ctx.post(`${BASE}/otp/send`, { data: { phone } });

    const { data: otpData } = await restApi.get(`${SLUG}/v1/otp/test-otp`);
    const verifyRes = await ctx.post(`${BASE}/otp/verify`, {
      data: { phone, otp: otpData.otp },
    });
    const tokens = await verifyRes.json();

    return { ctx, accessToken: tokens.access_token, userId };
  }

  test('updates display name', async ({ restApi, wpCli }) => {
    const { ctx, accessToken, userId } = await getTokenForUser(
      'profileuser1',
      'profile1@test.com',
      '+15550100001',
      restApi,
      wpCli,
    );

    const res = await ctx.put(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: 'Updated Display Name' },
    });
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data.id).toBe(Number(userId));
    expect(data.name).toBe('Updated Display Name');
    expect(data.first_name).toBeDefined();
    expect(data.last_name).toBeDefined();
    expect(data.roles).toBeInstanceOf(Array);

    await ctx.dispose();
  });

  test('updates first_name and last_name', async ({ restApi, wpCli }) => {
    const { ctx, accessToken } = await getTokenForUser(
      'profileuser2',
      'profile2@test.com',
      '+15550100002',
      restApi,
      wpCli,
    );

    const res = await ctx.put(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { first_name: 'Jane', last_name: 'Smith' },
    });
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data.first_name).toBe('Jane');
    expect(data.last_name).toBe('Smith');

    // Verify via GET /auth/me
    const meRes = await ctx.get(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const meData = await meRes.json();
    expect(meData.first_name).toBe('Jane');
    expect(meData.last_name).toBe('Smith');

    await ctx.dispose();
  });

  test('updates email address', async ({ restApi, wpCli }) => {
    const { ctx, accessToken } = await getTokenForUser(
      'profileuser3',
      'profile3@test.com',
      '+15550100003',
      restApi,
      wpCli,
    );

    const res = await ctx.put(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { email: 'newemail3@test.com' },
    });
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data.email).toBe('newemail3@test.com');

    await ctx.dispose();
  });

  test('updates phone number', async ({ restApi, wpCli }) => {
    const { ctx, accessToken } = await getTokenForUser(
      'profileuser4',
      'profile4@test.com',
      '+15550100004',
      restApi,
      wpCli,
    );

    const res = await ctx.put(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { phone: '+15550199999' },
    });
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data.phone).toBe('+15550199999');

    await ctx.dispose();
  });

  test('rejects duplicate email', async ({ restApi, wpCli }) => {
    // Create a second user to conflict with
    try {
      wpCli('user create conflictuser conflict@test.com --role=customer --user_pass=testpass123');
    } catch {
      // May exist
    }

    const { ctx, accessToken } = await getTokenForUser(
      'profileuser5',
      'profile5@test.com',
      '+15550100005',
      restApi,
      wpCli,
    );

    const res = await ctx.put(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { email: 'conflict@test.com' },
    });
    expect(res.status()).toBe(409);

    const data = await res.json();
    expect(data.code).toBe('email_exists');

    await ctx.dispose();
  });

  test('rejects duplicate phone number', async ({ restApi, wpCli }) => {
    // Create a second user with a known phone
    try {
      wpCli(
        'user create phoneconflict phoneconflict@test.com --role=customer --user_pass=testpass123',
      );
    } catch {
      // May exist
    }
    const conflictId = wpCli('user get phoneconflict --field=ID');
    wpCli(`user meta update ${conflictId} phone_number +15550188888`);

    const { ctx, accessToken } = await getTokenForUser(
      'profileuser6',
      'profile6@test.com',
      '+15550100006',
      restApi,
      wpCli,
    );

    const res = await ctx.put(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { phone: '+15550188888' },
    });
    expect(res.status()).toBe(409);

    const data = await res.json();
    expect(data.code).toBe('phone_exists');

    await ctx.dispose();
  });

  test('returns 400 when no fields provided', async ({ restApi, wpCli }) => {
    const { ctx, accessToken } = await getTokenForUser(
      'profileuser7',
      'profile7@test.com',
      '+15550100007',
      restApi,
      wpCli,
    );

    const res = await ctx.put(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {},
    });
    expect(res.status()).toBe(400);

    const data = await res.json();
    expect(data.code).toBe('no_changes');

    await ctx.dispose();
  });

  test('rejects unauthenticated request', async () => {
    const ctx = await playwrightRequest.newContext();

    const res = await ctx.put(`${BASE}/auth/me`, {
      headers: { Authorization: 'Bearer invalid_token' },
      data: { name: 'Hacker' },
    });
    expect(res.status()).toBe(401);

    await ctx.dispose();
  });

  test('GET /auth/me returns first_name and last_name', async ({ restApi, wpCli }) => {
    const { ctx, accessToken } = await getTokenForUser(
      'profileuser8',
      'profile8@test.com',
      '+15550100008',
      restApi,
      wpCli,
    );

    const res = await ctx.get(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty('first_name');
    expect(data).toHaveProperty('last_name');
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('email');
    expect(data).toHaveProperty('phone');
    expect(data).toHaveProperty('roles');

    await ctx.dispose();
  });
});
