/**
 * Diagnostics Routes — Admin Error Viewing
 *
 * Provides an endpoint to view the last error logged by the plugin.
 */

import { RestRoute } from 'wpts';

class ClarityDiagnostics {
  @RestRoute('/diagnostics/last-error', { method: 'GET', capability: 'manage_options' })
  getLastError(request: any): any {
    return {
      last_error: getOption('headless_clarity_last_error', ''),
    };
  }
}
