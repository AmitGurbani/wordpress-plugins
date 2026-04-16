/**
 * Headless Orders — wpts Plugin
 *
 * REST API for authenticated customers to view their WooCommerce orders.
 *
 * Build: npx wpts build src/plugin.ts -o dist --clean
 */

import { Plugin } from 'wpts';
import './order-routes.js';

@Plugin({
  name: 'Headless Orders',
  uri: 'https://github.com/AmitGurbani/wordpress-plugins',
  description: 'REST API for authenticated customers to view their WooCommerce orders.',
  version: '1.1.0',
  author: 'Amit Gurbani',
  authorUri: 'https://github.com/AmitGurbani',
  license: 'GPL-2.0+',
  textDomain: 'headless-orders',
  githubRepo: 'AmitGurbani/wordpress-plugins',
  requiresWP: '6.2',
  requiresPHP: '8.0',
  wooNotice: 'required',
})
class HeadlessOrders {}
