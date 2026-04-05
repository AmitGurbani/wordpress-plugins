import { request as playwrightRequest } from '@playwright/test';
import { expect, test } from '../../fixtures/wordpress';

const SLUG = 'headless-otp-auth';
const BASE = `http://localhost:8889/wp-json/${SLUG}/v1`;

async function sendAndRetrieveOtp(
  phone: string,
  restApi: { get: (path: string) => Promise<{ data: any }> },
): Promise<string> {
  const ctx = await playwrightRequest.newContext();
  try {
    await ctx.post(`${BASE}/otp/send`, { data: { phone } });
  } finally {
    await ctx.dispose();
  }

  const { data } = await restApi.get(`${SLUG}/v1/otp/test-otp`);
  return data.otp;
}

test.describe('Headless OTP Auth — Verify OTP', () => {
  test.beforeAll(async ({ restApi }) => {
    await restApi.updateSettings(SLUG, {
      otp_test_mode: true,
      enable_registration: true,
    });
  });

  test('full OTP flow: send → retrieve → verify → get tokens', async ({ restApi, wpCli }) => {
    // Create a test user with a known phone
    const phone = '+11111111111';
    try {
      wpCli(`user create otpuser1 otpuser1@test.com --role=subscriber --user_pass=testpass123`);
    } catch {
      // User may already exist
    }
    // Set the phone meta for the user
    const userId = wpCli('user get otpuser1 --field=ID');
    wpCli(`user meta update ${userId} phone_number ${phone}`);

    const otp = await sendAndRetrieveOtp(phone, restApi);

    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(`${BASE}/otp/verify`, {
      data: { phone, otp },
    });
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data.access_token).toBeDefined();
    expect(data.refresh_token).toBeDefined();
    expect(data.user).toBeDefined();
    expect(data.user.id).toBe(Number(userId));

    await ctx.dispose();
  });

  test('verify with wrong OTP returns error', async ({ restApi, wpCli }) => {
    const phone = '+12222222222';
    // Create user with this phone
    try {
      wpCli(`user create otpuser2 otpuser2@test.com --role=subscriber --user_pass=testpass123`);
    } catch {
      // May exist
    }
    const userId = wpCli('user get otpuser2 --field=ID');
    wpCli(`user meta update ${userId} phone_number ${phone}`);

    await sendAndRetrieveOtp(phone, restApi);

    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(`${BASE}/otp/verify`, {
      data: { phone, otp: '000000' },
    });
    expect(res.status()).not.toBe(200);
    await ctx.dispose();
  });

  test('verify for new phone returns registration_token when registration enabled', async ({
    restApi,
  }) => {
    const phone = '+19999999999';

    const otp = await sendAndRetrieveOtp(phone, restApi);

    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(`${BASE}/otp/verify`, {
      data: { phone, otp },
    });
    expect(res.status()).toBe(200);

    const data = await res.json();
    // No existing user — should get registration_token instead of access_token
    expect(data.registration_token).toBeDefined();
    expect(data.access_token).toBeUndefined();

    await ctx.dispose();
  });
});
