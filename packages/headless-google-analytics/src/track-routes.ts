/**
 * Track Routes — Event Proxy Endpoint
 *
 * Receives events from the headless frontend and forwards them
 * to GA4 via the Measurement Protocol with server-side enrichment.
 */

import { RestRoute } from 'wpts';

class GoogleAnalyticsTrack {

  // Duplicated from server-tracking.ts — wpts classes compile independently, matching meta-pixel pattern
  sendGa4Event(eventName: string, clientId: string, userId: string, params: any): any {
    const measurementId: string = getOption('headless_google_analytics_measurement_id', '');
    const apiSecret: string = getOption('headless_google_analytics_api_secret', '');

    if (!measurementId || !apiSecret) {
      return { success: false, message: 'Measurement ID or API Secret not configured.' };
    }

    const payload: any = {
      client_id: clientId,
      events: [{
        name: eventName,
        params: params,
      }],
    };

    if (userId) {
      payload['user_id'] = userId;
    }

    const url: string = 'https://www.google-analytics.com/mp/collect?measurement_id=' + measurementId + '&api_secret=' + apiSecret;

    const response: any = wpRemotePost(url, {
      body: jsonEncode(payload),
      headers: { 'Content-Type': 'application/json' },
      timeout: 5,
    });

    if (isWpError(response)) {
      updateOption('headless_google_analytics_last_error', response.get_error_message());
      return { success: false, message: response.get_error_message() };
    }

    return { success: true };
  }

  @RestRoute('/track', { method: 'POST', public: true })
  trackEvent(request: any): any {
    const eventName: string = sanitizeTextField(request.get_param('event_name'));
    let clientId: string = sanitizeTextField(request.get_param('client_id'));

    if (!clientId) {
      clientId = strval(wpRand(1000000000, 9999999999)) + '.' + strval(time());
    }

    if (!eventName) {
      return new WP_Error('missing_params', 'event_name is required.', { status: 400 });
    }

    // Validate event_name is allowed (purchase excluded — server-side only via WooCommerce hook)
    const allowedEvents: any = {
      view_item: 'enable_view_item',
      add_to_cart: 'enable_add_to_cart',
      begin_checkout: 'enable_begin_checkout',
      search: 'enable_search',
    };

    const settingKey: any = allowedEvents[eventName];
    if (!settingKey) {
      return new WP_Error('invalid_event', 'Event name is not supported.', { status: 400 });
    }

    if (getOption('headless_google_analytics_' + settingKey, '1') !== '1') {
      return new WP_Error('event_disabled', 'This event type is disabled.', { status: 403 });
    }

    // Whitelist params keys to prevent analytics pollution via public endpoint
    const rawParams: any = request.get_param('params') ?? {};
    const params: any = {};
    const allowedParamKeys: string[] = [
      'currency', 'value', 'transaction_id', 'items', 'search_term',
      'item_list_id', 'item_list_name', 'session_id', 'engagement_time_msec',
    ];
    for (const key of allowedParamKeys) {
      const val: any = rawParams[key] ?? null;
      if (val !== null) {
        params[key] = val;
      }
    }

    // Add user_id if logged in
    let userId: string = '';
    if (isUserLoggedIn()) {
      userId = strval(getCurrentUserId());
    }

    const result: any = this.sendGa4Event(eventName, clientId, userId, params);

    return { success: result['success'], event_name: eventName, client_id: clientId };
  }
}
