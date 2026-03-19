/**
 * Config Routes — Frontend Configuration Endpoint
 *
 * Provides the Pixel ID to the headless frontend for browser-side pixel initialization.
 */

import { RestRoute } from 'wpts';

class MetaPixelConfig {

  @RestRoute('/config', { method: 'GET', public: true })
  getConfig(request: any): any {
    const pixelId: string = getOption('meta_pixel_pixel_id', '');
    return { pixel_id: pixelId };
  }
}
