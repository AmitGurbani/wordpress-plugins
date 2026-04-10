/**
 * Headless Orders — wpts Plugin
 *
 * REST API for authenticated customers to list their WooCommerce orders.
 * The single-order endpoint already exists in WooCommerce Store API
 * (/wc/store/v1/order/{id}), so this plugin only adds the list endpoint.
 *
 * Build: npx wpts build src/plugin.ts -o dist --clean
 */

import { Plugin } from 'wpts';
import './order-routes.js';

@Plugin({
  name: 'Headless Orders',
  uri: 'https://github.com/AmitGurbani/wordpress-plugins',
  description: 'REST API for authenticated customers to list their WooCommerce orders.',
  version: '1.0.0',
  author: 'Amit Gurbani',
  authorUri: 'https://github.com/AmitGurbani',
  license: 'GPL-2.0+',
  textDomain: 'headless-orders',
  requiresWP: '6.2',
  requiresPHP: '8.0',
  wooNotice: 'required',
})
class HeadlessOrders {}
