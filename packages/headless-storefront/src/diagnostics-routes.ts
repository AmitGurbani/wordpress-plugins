/**
 * Headless Storefront Diagnostics Routes
 *
 * Synchronous webhook test endpoint for the "Test Webhook" admin button.
 * Mirrors the auto-fire payload but uses a blocking request so the HTTP
 * status code and connection errors are observable. Does NOT update
 * `headless_storefront_last_revalidate_at` — the test is purely diagnostic.
 *
 * Uses `wpSafeRemotePost` (same as auto-fire) for parity: a test that
 * succeeds while auto-fire would silently drop the request (e.g. against
 * a localhost frontend blocked by the SSRF guard) is worse than a test
 * that fails consistently.
 */

import { RestRoute } from '@amitgurbani/wpts';

class DiagnosticsRoutes {
  @RestRoute('/diagnostics/test-revalidate', { method: 'POST', capability: 'manage_options' })
  testRevalidate(_request: any): any {
    const config: any = getOption('headless_storefront_config', []);
    const frontendUrl: string = config.frontend_url ?? '';
    const secret: string = config.revalidate_secret ?? '';

    if (!frontendUrl || !secret) {
      return restEnsureResponse({
        success: false,
        code: 'not_configured',
        message: 'Frontend URL or Revalidate Secret is empty.',
        http_code: null,
      });
    }

    const response: any = wpSafeRemotePost(`${frontendUrl}/api/revalidate`, {
      body: jsonEncode({ type: 'storefront' }),
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': secret,
      },
      timeout: 10,
    });

    if (isWpError(response)) {
      // Most common: SSRF guard rejected URL, DNS failure, or connection refused.
      return restEnsureResponse({
        success: false,
        code: 'connection_failed',
        message: response.get_error_message(),
        http_code: null,
      });
    }

    const httpCode: number = intval(wpRemoteRetrieveResponseCode(response));

    if (httpCode >= 200 && httpCode < 300) {
      return restEnsureResponse({
        success: true,
        code: 'ok',
        message: 'Webhook configured correctly.',
        http_code: httpCode,
      });
    }

    let hint: string = 'Unexpected response from frontend.';
    if (httpCode === 401 || httpCode === 403) {
      hint = "Secret doesn't match.";
    } else if (httpCode === 404) {
      hint = 'Check Frontend URL path — /api/revalidate not found.';
    } else if (httpCode >= 500) {
      hint = 'Frontend returned an error.';
    }

    return restEnsureResponse({
      success: false,
      code: 'http_error',
      message: hint,
      http_code: httpCode,
    });
  }
}
