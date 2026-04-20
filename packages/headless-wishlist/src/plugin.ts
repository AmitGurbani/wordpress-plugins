/**
 * Headless Wishlist — wpts Plugin
 *
 * REST API wishlist for headless WordPress stores.
 * Stores wishlisted product IDs per user in WordPress user meta.
 *
 * Build: npx wpts build src/plugin.ts -o dist --clean
 */

import { Activate, AdminPage, Plugin } from 'wpts';
import './wishlist-routes.js';
import './analytics-routes.js';

@Plugin({
  name: 'Headless Wishlist',
  uri: 'https://github.com/AmitGurbani/wordpress-plugins',
  description: 'REST API wishlist for headless WordPress stores.',
  version: '1.1.0',
  author: 'Amit Gurbani',
  authorUri: 'https://github.com/AmitGurbani',
  license: 'GPL-2.0+',
  textDomain: 'headless-wishlist',
  requiresWP: '6.0',
  requiresPHP: '8.0',
  wooNotice: 'required',
})
@AdminPage({
  pageTitle: 'Headless Wishlist',
  menuTitle: 'Wishlist',
  capability: 'manage_options',
  menuSlug: 'headless-wishlist',
  iconUrl: 'dashicons-heart',
})
class HeadlessWishlist {
  @Activate()
  onActivation(): void {
    updateOption('headless_wishlist_version', '1.0.0');
  }
}
