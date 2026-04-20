import { Activate, Plugin, Uninstall } from 'wpts';
import './cleanup-hooks.js';
import './cleanup-routes.js';

@Plugin({
  name: 'Headless Media Cleanup',
  uri: 'https://github.com/AmitGurbani/wordpress-plugins',
  description:
    'Auto-delete orphaned WooCommerce media when images are removed from products, variations, and taxonomy terms.',
  version: '1.0.0',
  author: 'Amit Gurbani',
  authorUri: 'https://github.com/AmitGurbani',
  license: 'GPL-2.0+',
  textDomain: 'headless-media-cleanup',
  requiresWP: '6.2',
  requiresPHP: '8.0',
  wooNotice: 'required',
})
class HeadlessMediaCleanup {
  @Activate()
  onActivation(): void {
    updateOption('headless_media_cleanup_version', '1.0.0');
  }

  @Uninstall()
  onUninstall(): void {
    wpdb.query(
      wpdb.prepare(
        `DELETE FROM ${wpdb.postmeta} WHERE meta_key = %s`,
        '_headless_media_cleanup_tracked_images',
      ),
    );
    wpdb.query(
      wpdb.prepare(
        `DELETE FROM ${wpdb.termmeta} WHERE meta_key = %s`,
        '_headless_media_cleanup_tracked_image',
      ),
    );
  }
}
