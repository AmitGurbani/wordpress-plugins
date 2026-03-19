/**
 * Diagnostics Routes — Admin Diagnostic Endpoints
 *
 * Test CAPI connection and retrieve error logs.
 */

import { RestRoute } from 'wpts';

class MetaPixelDiagnostics {

  @RestRoute('/diagnostics/test-capi', { method: 'POST', capability: 'manage_options' })
  testCapi(request: any): any {
    const pixelId: string = getOption('meta_pixel_pixel_id', '');
    const accessToken: string = getOption('meta_pixel_access_token', '');

    if (!pixelId || !accessToken) {
      return { success: false, message: 'Pixel ID and Access Token are required.' };
    }

    const testEventCode: string = getOption('meta_pixel_test_event_code', '');
    if (!testEventCode) {
      return { success: false, message: 'Set a Test Event Code in settings first.' };
    }

    const url: string = 'https://graph.facebook.com/v25.0/' + pixelId + '/events?access_token=' + accessToken;

    const payload: any = {
      data: [{
        event_name: 'PageView',
        event_time: time(),
        event_id: 'test_' + strval(time()),
        action_source: 'website',
        event_source_url: siteUrl(),
        user_data: {
          client_user_agent: 'meta-pixel-plugin-test',
        },
      }],
      test_event_code: testEventCode,
    };

    const response: any = wpRemotePost(url, {
      body: jsonEncode(payload),
      headers: { 'Content-Type': 'application/json' },
      timeout: 15,
    });

    if (isWpError(response)) {
      return { success: false, message: response.get_error_message() };
    }

    const code: number = intval(wpRemoteRetrieveResponseCode(response));
    const body: string = wpRemoteRetrieveBody(response);

    if (code >= 200 && code < 300) {
      return {
        success: true,
        message: 'CAPI connection successful. Check Test Events in Meta Events Manager.',
        test_event_code: testEventCode,
      };
    }

    return { success: false, message: 'CAPI returned error.', status: code, response: body };
  }

  @RestRoute('/diagnostics/last-error', { method: 'GET', capability: 'manage_options' })
  getLastError(request: any): any {
    return {
      last_error: getOption('meta_pixel_last_capi_error', ''),
    };
  }
}
