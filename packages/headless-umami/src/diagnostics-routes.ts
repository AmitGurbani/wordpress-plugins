/**
 * Diagnostics Routes — Admin Connection Testing
 *
 * Provides endpoints to test the Umami connection and view the last error.
 */

import { RestRoute } from 'wpts';

class UmamiDiagnostics {

  sendUmamiEvent(eventName: string, url: string, title: string, eventData: any): any {
    const umamiUrl: string = getOption('headless_umami_umami_url', '');
    const websiteId: string = getOption('headless_umami_website_id', '');

    if (!umamiUrl || !websiteId) {
      return { success: false, message: 'Umami URL or Website ID not configured.' };
    }

    const siteUrlParsed: any = wpParseUrl(siteUrl());
    const hostname: string = siteUrlParsed['host'] ?? '';

    const innerPayload: any = {
      hostname: hostname,
      language: '',
      referrer: '',
      screen: '1920x1080',
      title: title,
      url: url,
      website: websiteId,
      name: eventName,
    };

    if (eventData) {
      innerPayload['data'] = eventData;
    }

    const payload: any = {
      type: 'event',
      payload: innerPayload,
    };

    const apiUrl: string = rtrim(umamiUrl, '/') + '/api/send';

    const response: any = wpSafeRemotePost(apiUrl, {
      body: jsonEncode(payload),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; HeadlessUmami/1.0; +wordpress)',
      },
      timeout: 5,
    });

    if (isWpError(response)) {
      updateOption('headless_umami_last_error', response.get_error_message());
      return { success: false, message: response.get_error_message() };
    }

    const code: number = intval(wpRemoteRetrieveResponseCode(response));
    if (code < 200 || code >= 300) {
      const body: string = wpRemoteRetrieveBody(response);
      updateOption('headless_umami_last_error', 'HTTP ' + strval(code) + ': ' + body);
      return { success: false, message: 'Umami returned HTTP ' + strval(code) };
    }

    return { success: true };
  }

  @RestRoute('/diagnostics/test-connection', { method: 'POST', capability: 'manage_options' })
  testConnection(request: any): any {
    const result: any = this.sendUmamiEvent('plugin_test', '/', 'Plugin Connection Test', { source: 'headless-umami-diagnostics' });

    if (result['success']) {
      return { success: true, message: 'Connection to Umami successful. A test event was sent.' };
    }

    return result;
  }

  @RestRoute('/diagnostics/last-error', { method: 'GET', capability: 'manage_options' })
  getLastError(request: any): any {
    return {
      last_error: getOption('headless_umami_last_error', ''),
    };
  }
}
