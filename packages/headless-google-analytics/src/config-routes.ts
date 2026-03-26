/**
 * Config Routes — Frontend Configuration Endpoint
 *
 * Provides the Measurement ID to the headless frontend for browser-side gtag.js initialization.
 */

import { RestRoute } from 'wpts';

class GoogleAnalyticsConfig {
  @RestRoute('/config', { method: 'GET', public: true })
  getConfig(request: any): any {
    const measurementId: string = getOption('headless_google_analytics_measurement_id', '');
    return { measurement_id: measurementId };
  }
}
