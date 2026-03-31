/**
 * Conversions API — Server-Side Event Sending
 *
 * Handles sending events to Meta's Conversions API and provides
 * the WooCommerce Purchase hook for automatic server-side tracking.
 */

import { Action } from 'wpts';

class MetaPixelCapi {
  // ── Helper Methods ────────────────────────────────────────────────────

  hashForCapi(value: string): string {
    if (!value) {
      return '';
    }
    const normalized: string = strtolower(value.trim());
    return hash('sha256', normalized);
  }

  buildUserDataFromOrder(order: any): any {
    const userData: any = {};

    const email: string = order.get_billing_email();
    if (email) {
      userData['em'] = this.hashForCapi(email);
    }

    const phone: string = order.get_billing_phone();
    if (phone) {
      userData['ph'] = this.hashForCapi(phone);
    }

    const firstName: string = order.get_billing_first_name();
    if (firstName) {
      userData['fn'] = this.hashForCapi(firstName);
    }

    const lastName: string = order.get_billing_last_name();
    if (lastName) {
      userData['ln'] = this.hashForCapi(lastName);
    }

    const city: string = order.get_billing_city();
    if (city) {
      userData['ct'] = this.hashForCapi(city);
    }

    const state: string = order.get_billing_state();
    if (state) {
      userData['st'] = this.hashForCapi(state);
    }

    const postcode: string = order.get_billing_postcode();
    if (postcode) {
      userData['zp'] = this.hashForCapi(postcode);
    }

    const country: string = order.get_billing_country();
    if (country) {
      userData['country'] = this.hashForCapi(country);
    }

    const userId: number = order.get_customer_id();
    if (userId) {
      userData['external_id'] = this.hashForCapi(strval(userId));
    }

    return userData;
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

  // ── WooCommerce Purchase Hook ─────────────────────────────────────────

  @Action('woocommerce_order_status_changed', { priority: 10, acceptedArgs: 4 })
  onOrderStatusChanged(orderId: number, oldStatus: string, newStatus: string, order: any): void {
    // Only track statuses that represent a purchase
    const purchaseStatuses: string[] = ['processing', 'on-hold', 'completed'];
    if (!purchaseStatuses.includes(newStatus)) {
      return;
    }

    if (getOption('headless_meta_pixel_enable_capi', '1') !== '1') {
      return;
    }
    if (getOption('headless_meta_pixel_enable_purchase', '1') !== '1') {
      return;
    }

    if (!order) {
      return;
    }

    // Prevent double-send on retries
    const alreadySent: any = order.get_meta('_headless_meta_pixel_capi_sent', true);
    if (alreadySent) {
      return;
    }

    const eventId: string = 'order_' + strval(orderId);
    const currency: string = order.get_currency();
    const total: string = strval(order.get_total());

    // Build contents array from order items
    const contents: any[] = [];
    const contentIds: string[] = [];
    const items: any[] = order.get_items();

    for (const item of items) {
      const product: any = item.get_product();
      if (!product) {
        continue;
      }
      const sku: string = product.get_sku();
      const contentId: string = sku ? sku : strval(product.get_id());
      contentIds.push(contentId);
      contents.push({
        id: contentId,
        quantity: item.get_quantity(),
        item_price: strval(product.get_price()),
      });
    }

    const customData: any = {
      currency: currency,
      value: total,
      content_type: 'product',
      contents: contents,
      content_ids: contentIds,
    };

    const sourceUrl: string = order.get_checkout_order_received_url();
    const userData: any = this.buildUserDataFromOrder(order);

    const result: any = this.sendCapiEvent('Purchase', eventId, sourceUrl, customData, userData);

    // Only mark as sent on success — allows retry on next status change if CAPI was unreachable
    if (result['success']) {
      order.update_meta_data('_headless_meta_pixel_capi_sent', '1');
      order.save();
    }
  }
}
