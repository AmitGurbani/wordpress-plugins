/**
 * Config Routes — Frontend Configuration Endpoint
 *
 * Provides the Clarity Project ID and optional user identity
 * to the headless frontend for initializing the Clarity tracking script.
 */

import { RestRoute } from 'wpts';

class ClarityConfig {
  @RestRoute('/config', { method: 'GET', public: true })
  getConfig(_request: any): any {
    const projectId: string = getOption('headless_clarity_project_id', '');

    const response: any = {
      project_id: projectId,
    };

    const enableIdentify: string = getOption('headless_clarity_enable_identify', '1');
    if (enableIdentify === '1') {
      const userId: number = getCurrentUserId();
      if (userId > 0) {
        response.user = {
          id: strval(userId),
          display_name: getTheAuthorMeta('display_name', userId),
        };
      }
    }

    return response;
  }
}
