import { wpCli } from './wordpress';

function parseId(output: string): number {
  // wp-env may prefix output with status lines; the actual ID is the last line
  const lastLine = output.split('\n').filter(Boolean).at(-1) ?? '';
  const id = Number.parseInt(lastLine, 10);
  if (Number.isNaN(id)) {
    throw new Error(`WP-CLI did not return a valid ID: ${output}`);
  }
  return id;
}

export function createOrder(opts: {
  productId: number;
  customerId?: number;
}): number {
  const customer = opts.customerId ?? 1;
  const output = wpCli(
    `wc shop_order create --customer_id=${customer} --line_items='[{"product_id":${opts.productId},"quantity":1}]' --user=admin --porcelain`,
  );
  return parseId(output);
}

export function updateOrderStatus(orderId: number, status: string): void {
  wpCli(`wc shop_order update ${orderId} --status=${status} --user=admin`);
}

export function getPostMeta(postId: number, key: string): string {
  return wpCli(`post meta get ${postId} ${key}`);
}

export function deleteOrder(orderId: number): void {
  wpCli(`post delete ${orderId} --force`);
}

