/**
 * Order REST API Endpoints
 *
 * GET /orders      — List WooCommerce orders for the authenticated customer.
 * GET /orders/:id  — Fetch a single WooCommerce order for the authenticated customer.
 * Namespace: headless-orders/v1
 */

import { RestRoute } from 'wpts';

class OrderRoutes {
  formatOrder(order: any): any {
    const dateCreated: any = order.get_date_created();
    const dateModified: any = order.get_date_modified();

    const rawItems: any = order.get_items();
    const items: any[] = [];
    for (const item of rawItems) {
      items.push({
        product_id: item.get_product_id(),
        variation_id: item.get_variation_id(),
        name: item.get_name(),
        quantity: item.get_quantity(),
        subtotal: item.get_subtotal(),
        total: item.get_total(),
      });
    }

    return {
      id: order.get_id(),
      order_number: order.get_order_number(),
      status: order.get_status(),
      created_at: dateCreated ? dateCreated.date('c') : '',
      updated_at: dateModified ? dateModified.date('c') : '',
      total: order.get_total(),
      shipping_total: order.get_shipping_total(),
      currency: order.get_currency(),
      payment_method: order.get_payment_method(),
      customer_note: order.get_customer_note(),
      billing: {
        first_name: order.get_billing_first_name(),
        last_name: order.get_billing_last_name(),
        address_1: order.get_billing_address_1(),
        address_2: order.get_billing_address_2(),
        city: order.get_billing_city(),
        state: order.get_billing_state(),
        postcode: order.get_billing_postcode(),
        country: order.get_billing_country(),
        email: order.get_billing_email(),
        phone: order.get_billing_phone(),
      },
      shipping: {
        first_name: order.get_shipping_first_name(),
        last_name: order.get_shipping_last_name(),
        address_1: order.get_shipping_address_1(),
        address_2: order.get_shipping_address_2(),
        city: order.get_shipping_city(),
        state: order.get_shipping_state(),
        postcode: order.get_shipping_postcode(),
        country: order.get_shipping_country(),
        phone: order.get_shipping_phone(),
      },
      items: items,
    };
  }

  @RestRoute('/orders', { method: 'GET', capability: 'read' })
  listOrders(request: any): any {
    if (!classExists('WooCommerce')) {
      return new WP_Error('woocommerce_required', 'WooCommerce is not active.', { status: 503 });
    }

    const userId: number = getCurrentUserId();

    const perPage: number = Math.min(
      100,
      Math.max(1, intval(request.get_param('per_page') ?? '20')),
    );
    const page: number = Math.max(1, intval(request.get_param('page') ?? '1'));

    const statusParam: string = sanitizeTextField(request.get_param('status') ?? '');
    const validStatuses: string[] = [
      'pending',
      'processing',
      'completed',
      'cancelled',
      'refunded',
      'failed',
      'on-hold',
    ];

    if (statusParam && !validStatuses.includes(statusParam)) {
      return new WP_Error('invalid_status', 'Invalid order status.', { status: 400 });
    }

    const queryArgs: Record<string, any> = {
      customer: userId,
      limit: perPage,
      page: page,
      orderby: 'date',
      order: 'DESC',
    };
    if (statusParam) {
      queryArgs.status = statusParam;
    }

    const orders: any[] = wcGetOrders(queryArgs);

    const formattedOrders: any[] = [];
    for (const order of orders) {
      formattedOrders.push(this.formatOrder(order));
    }

    const countArgs: Record<string, any> = {
      customer: userId,
      limit: -1,
      return: 'ids',
    };
    if (statusParam) {
      countArgs.status = statusParam;
    }
    const allIds: any[] = wcGetOrders(countArgs);
    const total: number = allIds.length;
    const totalPages: number = Math.max(1, Math.ceil(total / perPage));

    const response: any = restEnsureResponse(formattedOrders);
    response.header('X-WP-Total', total);
    response.header('X-WP-TotalPages', totalPages);
    return response;
  }

  @RestRoute('/orders/(?P<id>\\d+)', { method: 'GET', capability: 'read' })
  getOrder(request: any): any {
    if (!classExists('WooCommerce')) {
      return new WP_Error('woocommerce_required', 'WooCommerce is not active.', { status: 503 });
    }

    const userId: number = getCurrentUserId();

    const orderId: number = intval(request.get_param('id'));
    const order: any = wcGetOrder(orderId);
    if (!order) {
      return new WP_Error('order_not_found', 'Order not found.', { status: 404 });
    }

    if (order.get_customer_id() !== userId) {
      return new WP_Error('order_not_found', 'Order not found.', { status: 404 });
    }

    return this.formatOrder(order);
  }
}
