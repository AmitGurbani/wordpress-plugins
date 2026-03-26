/**
 * Server-Side Tracking — GA4 Measurement Protocol
 *
 * Handles sending events to GA4 via the Measurement Protocol and provides
 * the WooCommerce Purchase hook for automatic server-side tracking.
 */

import { Action } from 'wpts';

class GoogleAnalyticsServerTracking {
  // ── Helper Methods ────────────────────────────────────────────────────

  // Duplicated in track-routes.ts — wpts classes compile independently, matching meta-pixel pattern
  sendGa4Event(eventName: string, clientId: string, userId: string, params: any): any {
    const measurementId: string = getOption('headless_google_analytics_measurement_id', '');
    const apiSecret: string = getOption('headless_google_analytics_api_secret', '');

    if (!measurementId || !apiSecret) {
      return { success: false, message: 'Measurement ID or API Secret not configured.' };
    }

    const payload: any = {
      client_id: clientId,
      events: [
        {
          name: eventName,
          params: params,
        },
      ],
    };

    if (userId) {
      payload['user_id'] = userId;
    }

    const url: string =
      'https://www.google-analytics.com/mp/collect?measurement_id=' +
      measurementId +
      '&api_secret=' +
      apiSecret;

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

  // ── WooCommerce Purchase Hook ─────────────────────────────────────────

  @Action('woocommerce_order_status_changed', { priority: 10, acceptedArgs: 4 })
  onOrderStatusChanged(orderId: number, oldStatus: string, newStatus: string, order: any): void {
    // Only track statuses that represent a purchase
    const purchaseStatuses: string[] = ['processing', 'on-hold', 'completed'];
    if (!purchaseStatuses.includes(newStatus)) {
      return;
    }

    if (getOption('headless_google_analytics_enable_purchase', '1') !== '1') {
      return;
    }

    if (!order) {
      return;
    }

    // Prevent double-send on retries
    const alreadySent: any = getPostMeta(orderId, '_headless_ga_sent', true);
    if (alreadySent) {
      return;
    }

    // Generate client_id for server-side events (no browser _ga cookie available)
    const clientId: string = strval(wpRand(1000000000, 9999999999)) + '.' + strval(time());

    // Include user_id if customer is logged in
    const customerId: number = order.get_customer_id();
    const userId: string = customerId ? strval(customerId) : '';

    const currency: string = order.get_currency();
    const total: number = parseFloat(order.get_total());

    // Build items array from order items
    const gaItems: any[] = [];
    const items: any[] = order.get_items();

    for (const item of items) {
      const product: any = item.get_product();
      if (!product) {
        continue;
      }
      const sku: string = product.get_sku();
      const itemId: string = sku ? sku : strval(product.get_id());
      gaItems.push({
        item_id: itemId,
        item_name: item.get_name(),
        quantity: item.get_quantity(),
        price: parseFloat(product.get_price()),
      });
    }

    const params: any = {
      currency: currency,
      value: total,
      transaction_id: strval(orderId),
      items: gaItems,
      engagement_time_msec: 1,
    };

    const result: any = this.sendGa4Event('purchase', clientId, userId, params);

    // Only mark as sent on success — allows retry on next status change if GA4 was unreachable
    if (result['success']) {
      updatePostMeta(orderId, '_headless_ga_sent', '1');
    }
  }
}
