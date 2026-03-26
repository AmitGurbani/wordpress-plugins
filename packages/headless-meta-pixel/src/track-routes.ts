/**
 * Track Routes — Event Proxy Endpoint
 *
 * Receives events from the headless frontend and forwards them
 * to Meta's Conversions API with server-side data enrichment.
 */

import { RestRoute } from 'wpts';

class MetaPixelTrack {
  hashForCapi(value: string): string {
    if (!value) {
      return '';
    }
    const normalized: string = strtolower(value.trim());
    return hash('sha256', normalized);
  }

  sendCapiEvent(
    eventName: string,
    eventId: string,
    sourceUrl: string,
    customData: any,
    userData: any,
  ): any {
    const pixelId: string = getOption('headless_meta_pixel_pixel_id', '');
    const accessToken: string = getOption('headless_meta_pixel_access_token', '');

    if (!pixelId || !accessToken) {
      return { success: false, message: 'Pixel ID or Access Token not configured.' };
    }

    const event: any = {
      event_name: eventName,
      event_time: time(),
      event_id: eventId,
      action_source: 'website',
      user_data: userData,
      custom_data: customData,
    };

    if (sourceUrl) {
      event['event_source_url'] = sourceUrl;
    }

    const payload: any = {
      data: [event],
    };

    const testEventCode: string = getOption('headless_meta_pixel_test_event_code', '');
    if (testEventCode) {
      payload['test_event_code'] = testEventCode;
    }

    const url: string =
      'https://graph.facebook.com/v25.0/' + pixelId + '/events?access_token=' + accessToken;

    const response: any = wpRemotePost(url, {
      body: jsonEncode(payload),
      headers: { 'Content-Type': 'application/json' },
      timeout: 5,
    });

    if (isWpError(response)) {
      updateOption('headless_meta_pixel_last_capi_error', response.get_error_message());
      return { success: false, message: response.get_error_message() };
    }

    return { success: true };
  }

  @RestRoute('/track', { method: 'POST', public: true })
  trackEvent(request: any): any {
    // Rate limit: 60 requests per minute per IP
    const rlHeaders: any = getallheaders();
    let rlIp: string = '';
    const rlCfIp: string = rlHeaders['CF-Connecting-IP'] ?? '';
    const rlFwdFor: string = rlHeaders['X-Forwarded-For'] ?? '';
    const rlRealIp: string = rlHeaders['X-Real-IP'] ?? '';
    if (rlCfIp) {
      rlIp = rlCfIp.trim();
    } else if (rlFwdFor) {
      const rlParts: string[] = rlFwdFor.split(',');
      rlIp = rlParts[0].trim();
    } else if (rlRealIp) {
      rlIp = rlRealIp.trim();
    } else {
      rlIp = $_SERVER['REMOTE_ADDR'] ?? '';
    }
    const rlKey: string = 'hmp_rl_' + md5(rlIp);
    const rlCount: any = getTransient(rlKey);
    if (rlCount && intval(rlCount) >= 60) {
      return new WP_Error('rate_limited', 'Too many requests. Please try again later.', {
        status: 429,
      });
    }
    setTransient(rlKey, strval(rlCount ? intval(rlCount) + 1 : 1), 60);

    if (getOption('headless_meta_pixel_enable_capi', '1') !== '1') {
      return new WP_Error('capi_disabled', 'Conversions API is disabled.', { status: 403 });
    }

    const eventName: string = sanitizeTextField(request.get_param('event_name'));
    const eventId: string = sanitizeTextField(request.get_param('event_id'));
    const eventSourceUrl: string = escUrlRaw(request.get_param('event_source_url'));

    // Whitelist custom_data keys to prevent analytics pollution via public endpoint
    const rawCustomData: any = request.get_param('custom_data') ?? {};
    const customData: any = {};
    const allowedCustomDataKeys: string[] = [
      'currency',
      'value',
      'content_type',
      'contents',
      'content_ids',
      'search_string',
      'num_items',
      'order_id',
    ];
    for (const key of allowedCustomDataKeys) {
      const val: any = rawCustomData[key] ?? null;
      if (val !== null) {
        customData[key] = val;
      }
    }

    // Type-check array fields to prevent malformed payloads
    if (customData['contents'] !== undefined && !isArray(customData['contents'])) {
      delete customData['contents'];
    }
    if (customData['content_ids'] !== undefined && !isArray(customData['content_ids'])) {
      delete customData['content_ids'];
    }

    if (!eventName || !eventId) {
      return new WP_Error('missing_params', 'event_name and event_id are required.', {
        status: 400,
      });
    }

    // Validate event_name is allowed
    const allowedEvents: any = {
      ViewContent: 'enable_view_content',
      AddToCart: 'enable_add_to_cart',
      InitiateCheckout: 'enable_initiate_checkout',
      Purchase: 'enable_purchase',
      Search: 'enable_search',
    };

    const settingKey: any = allowedEvents[eventName];
    if (!settingKey) {
      return new WP_Error('invalid_event', 'Event name is not supported.', { status: 400 });
    }

    if (getOption('headless_meta_pixel_' + settingKey, '1') !== '1') {
      return new WP_Error('event_disabled', 'This event type is disabled.', { status: 403 });
    }

    // Build user_data from request
    const userData: any = {};

    // Browser identifiers from frontend (not hashed)
    const fbp: string = sanitizeTextField(request.get_param('_fbp'));
    if (fbp) {
      userData['fbp'] = fbp;
    }

    const fbc: string = sanitizeTextField(request.get_param('_fbc'));
    if (fbc) {
      userData['fbc'] = fbc;
    }

    // Client IP and User Agent from server
    const headers: Record<string, string> = getallheaders();
    const userAgent: string = headers['User-Agent'] ?? '';
    if (userAgent) {
      userData['client_user_agent'] = userAgent;
    }

    // Resolve real client IP behind proxies (for headless/reverse-proxy setups)
    let clientIp: string = '';
    const cfIp: string = headers['CF-Connecting-IP'] ?? '';
    const forwardedFor: string = headers['X-Forwarded-For'] ?? '';
    const realIp: string = headers['X-Real-IP'] ?? '';
    if (cfIp) {
      clientIp = cfIp.trim();
    } else if (forwardedFor) {
      const parts: string[] = forwardedFor.split(',');
      clientIp = parts[0].trim();
    } else if (realIp) {
      clientIp = realIp.trim();
    } else {
      clientIp = $_SERVER['REMOTE_ADDR'] ?? '';
    }
    if (clientIp) {
      userData['client_ip_address'] = clientIp;
    }

    // If user is logged in, add hashed PII
    if (isUserLoggedIn()) {
      const userId: number = getCurrentUserId();
      const userEmail: string = getTheAuthorMeta('user_email', userId);
      if (userEmail) {
        userData['em'] = this.hashForCapi(userEmail);
      }
      const firstName: string = getUserMeta(userId, 'first_name', true);
      if (firstName) {
        userData['fn'] = this.hashForCapi(firstName);
      }
      const lastName: string = getUserMeta(userId, 'last_name', true);
      if (lastName) {
        userData['ln'] = this.hashForCapi(lastName);
      }
      userData['external_id'] = this.hashForCapi(strval(userId));
    }

    const result: any = this.sendCapiEvent(
      eventName,
      eventId,
      eventSourceUrl,
      customData,
      userData,
    );

    return { success: result['success'], event_id: eventId };
  }
}
