/**
 * Server-Side Tracking — Umami Event Sending
 *
 * Handles sending events to Umami's /api/send endpoint and provides
 * the WooCommerce Purchase hook for automatic server-side tracking.
 */

import { Action } from 'wpts';

class UmamiServerTracking {

  // ── Helper Methods ────────────────────────────────────────────────────

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

  // ── WooCommerce Purchase Hook ─────────────────────────────────────────

  @Action('woocommerce_order_status_changed', { priority: 10, acceptedArgs: 4 })
  onOrderStatusChanged(orderId: number, oldStatus: string, newStatus: string, order: any): void {
    const purchaseStatuses: string[] = ['processing', 'on-hold', 'completed'];
    if (!purchaseStatuses.includes(newStatus)) {
      return;
    }

    if (getOption('headless_umami_enable_purchase', '1') !== '1') {
      return;
    }

    if (!order) {
      return;
    }

    const alreadySent: any = getPostMeta(orderId, '_headless_umami_sent', true);
    if (alreadySent) {
      return;
    }

    const currency: string = order.get_currency();
    const total: string = strval(order.get_total());

    const products: any[] = [];
    const items: any[] = order.get_items();

    for (const item of items) {
      const product: any = item.get_product();
      if (!product) {
        continue;
      }
      const sku: string = product.get_sku();
      const productId: string = sku ? sku : strval(product.get_id());
      products.push({
        id: productId,
        name: item.get_name(),
        quantity: item.get_quantity(),
        price: strval(product.get_price()),
      });
    }

    const eventData: any = {
      order_id: strval(orderId),
      revenue: total,
      currency: currency,
      products: products,
    };

    const orderUrl: string = order.get_checkout_order_received_url();

    const result: any = this.sendUmamiEvent('purchase', orderUrl, 'Purchase - Order #' + strval(orderId), eventData);

    // Only mark as sent on success — allows retry on next status change if Umami was unreachable
    if (result['success']) {
      updatePostMeta(orderId, '_headless_umami_sent', '1');
    }
  }
}
