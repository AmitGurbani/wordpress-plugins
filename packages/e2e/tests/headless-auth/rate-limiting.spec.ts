import { request as playwrightRequest } from '@playwright/test';
import { expect, test } from '../../fixtures/wordpress';

const SLUG = 'headless-auth';
const BASE = `http://localhost:8889/wp-json/${SLUG}/v1`;

test.describe('Headless Auth — Rate Limiting', () => {
  test.beforeAll(async ({ restApi, wpCli }) => {
    await restApi.updateSettings(SLUG, {
      otp_test_mode: true,
      max_otp_attempts: 3,
      rate_limit_window: 900,
      otp_resend_cooldown: 1, // Set low for testing
      max_otp_verify_attempts: 3,
    });

    // Create user for brute force test (before any HTTP traffic hits WP)
    try {
      wpCli('user create bruteuser bruteuser@test.com --role=subscriber --user_pass=testpass123');
    } catch {
      // May already exist from a previous test run
    }
    const userId = wpCli('user get bruteuser --field=ID');
    wpCli(`user meta update ${userId} phone_number +17777777777`);
  });

  test('rate limits OTP send after max attempts', async ({ wpCli }) => {
    const phone = '+16666666666';

    // Clear any existing rate limit transients
    try {
      wpCli('transient delete --all');
    } catch {
      // Ignore errors
    }

    const ctx = await playwrightRequest.newContext();

    let lastStatus = 200;
    // Send max_otp_attempts + 1 requests
    for (let i = 0; i <= 3; i++) {
      const res = await ctx.post(`${BASE}/otp/send`, {
        data: { phone },
      });
      lastStatus = res.status();
      if (lastStatus === 429) break;
    }

    expect(lastStatus).toBe(429);
    await ctx.dispose();
  });

  test('brute force protection on wrong OTP verification', async ({ wpCli }) => {
    const phone = '+17777777777';

    // Clear rate limit transients
    try {
      wpCli('transient delete --all');
    } catch {
      // Ignore
    }

    // Send OTP (user + phone already set up in beforeAll)
    const ctx = await playwrightRequest.newContext();
    await ctx.post(`${BASE}/otp/send`, { data: { phone } });

    // Try wrong OTP multiple times
    let lastStatus = 200;
    for (let i = 0; i <= 3; i++) {
      const res = await ctx.post(`${BASE}/otp/verify`, {
        data: { phone, otp: '000000' },
      });
      lastStatus = res.status();
      if (lastStatus === 429) break;
    }

    // Should eventually get rate limited
    expect(lastStatus).toBe(429);
    await ctx.dispose();
  });
});
