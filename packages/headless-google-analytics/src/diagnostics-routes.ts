/**
 * Diagnostics Routes — Admin Diagnostic Endpoints
 *
 * Test GA4 Measurement Protocol connection using the debug endpoint
 * and retrieve error logs.
 */

import { DiagnosticsRoute, RestRoute } from 'wpts';

@DiagnosticsRoute()
class GoogleAnalyticsDiagnostics {
  @RestRoute('/diagnostics/test-event', { method: 'POST', capability: 'manage_options' })
  testEvent(request: any): any {
    const measurementId: string = getOption('headless_google_analytics_measurement_id', '');
    const apiSecret: string = getOption('headless_google_analytics_api_secret', '');

    if (!measurementId || !apiSecret) {
      return { success: false, message: 'Measurement ID and API Secret are required.' };
    }

    // Use GA4 debug endpoint for payload validation
    const url: string =
      'https://www.google-analytics.com/debug/mp/collect?measurement_id=' +
      measurementId +
      '&api_secret=' +
      apiSecret;

    const clientId: string = strval(wpRand(1000000000, 9999999999)) + '.' + strval(time());

    const payload: any = {
      client_id: clientId,
      events: [
        {
          name: 'page_view',
          params: {
            engagement_time_msec: 1,
          },
        },
      ],
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
    const decoded: any = jsonDecode(body, true);

    // Debug endpoint returns { validationMessages: [...] }
    // Empty array = success, non-empty = validation errors
    if (decoded && decoded['validationMessages'] !== undefined) {
      const messages: any[] = decoded['validationMessages'];
      if (messages.length === 0) {
        return {
          success: true,
          message:
            'Measurement Protocol validation passed. Note: the debug endpoint does not validate your Measurement ID or API Secret — verify events appear in GA4 Realtime.',
        };
      }

      // Return validation errors
      let errorDetails: string = '';
      for (const msg of messages) {
        errorDetails = errorDetails + msg['description'] + ' (' + msg['fieldPath'] + ')\n';
      }
      return {
        success: false,
        message: 'Validation errors found.',
        validation_errors: errorDetails,
      };
    }

    if (code >= 200 && code < 300) {
      return { success: true, message: 'Request sent successfully (HTTP ' + strval(code) + ').' };
    }

    return { success: false, message: 'Unexpected response.', status: code, response: body };
  }
}
