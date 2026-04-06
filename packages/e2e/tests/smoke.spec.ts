import { expect, test } from '../fixtures/wordpress';

test('WordPress REST API is accessible', async ({ request }) => {
  const res = await request.get('http://localhost:8889/wp-json/');
  expect(res.status()).toBe(200);
  const data = await res.json();
  expect(data.name).toBeTruthy();
});

test('all plugins are active', async ({ wpCli }) => {
  const plugins = wpCli('plugin list --status=active --field=name');
  expect(plugins).toContain('headless-clarity');
  expect(plugins).toContain('headless-google-analytics');
  expect(plugins).toContain('headless-meta-pixel');
  expect(plugins).toContain('headless-umami');
  expect(plugins).toContain('headless-auth');
  expect(plugins).toContain('headless-fuzzy-find');
  expect(plugins).toContain('headless-pos-sessions');
  expect(plugins).toContain('woocommerce');
});

test('WooCommerce is configured', async ({ wpCli }) => {
  const currency = wpCli('option get woocommerce_currency');
  expect(currency).toBe('USD');
});
