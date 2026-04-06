import { request as playwrightRequest } from '@playwright/test';
import { expect, test } from '../../fixtures/wordpress';

const SLUG = 'headless-auth';
const BASE = `http://localhost:8889/wp-json/${SLUG}/v1`;

test.describe('Headless Auth — Registration', () => {
  test.beforeAll(async ({ restApi }) => {
    await restApi.updateSettings(SLUG, {
      otp_test_mode: true,
      enable_registration: true,
      default_user_role: 'subscriber',
    });
  });

  test('full registration flow: send → verify → register → get tokens', async ({
    restApi,
    wpCli,
  }) => {
    const phone = '+13333333333';

    // Ensure no user with this phone exists
    try {
      const existingId = wpCli(
        `user list --meta_key=phone_number --meta_value=${phone} --field=ID`,
      );
      if (existingId) {
        wpCli(`user delete ${existingId} --yes`);
      }
    } catch {
      // No user found — expected
    }

    // Send OTP
    const ctx = await playwrightRequest.newContext();
    await ctx.post(`${BASE}/otp/send`, { data: { phone } });

    // Retrieve OTP as admin
    const { data: otpData } = await restApi.get(`${SLUG}/v1/otp/test-otp`);
    const otp = otpData.otp;

    // Verify OTP — should get registration_token for new phone
    const verifyRes = await ctx.post(`${BASE}/otp/verify`, {
      data: { phone, otp },
    });
    expect(verifyRes.status()).toBe(200);
    const verifyData = await verifyRes.json();
    expect(verifyData.registration_token).toBeDefined();

    // Register with the token
    const registerRes = await ctx.post(`${BASE}/auth/register`, {
      data: {
        registration_token: verifyData.registration_token,
        name: 'Test User',
      },
    });
    expect(registerRes.status()).toBe(200);
    const registerData = await registerRes.json();
    expect(registerData.access_token).toBeDefined();
    expect(registerData.refresh_token).toBeDefined();
    expect(registerData.user).toBeDefined();

    // Verify the user was created in WordPress
    const newUserId = registerData.user.id;
    const userPhone = wpCli(`user meta get ${newUserId} phone_number`);
    expect(userPhone).toBe(phone);

    await ctx.dispose();

    // Clean up
    wpCli(`user delete ${newUserId} --yes`);
  });
});
