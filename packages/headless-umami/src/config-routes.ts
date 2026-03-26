/**
 * Config Routes — Frontend Configuration Endpoint
 *
 * Provides the Umami URL and Website ID to the headless frontend
 * for loading the Umami tracking script.
 */

import { RestRoute } from 'wpts';

class UmamiConfig {
  @RestRoute('/config', { method: 'GET', public: true })
  getConfig(request: any): any {
    const umamiUrl: string = escUrlRaw(getOption('headless_umami_umami_url', ''));
    const websiteId: string = getOption('headless_umami_website_id', '');
    return {
      umami_url: umamiUrl,
      website_id: websiteId,
    };
  }
}
