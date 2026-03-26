import { __ } from '@wordpress/i18n';
import { DiagnosticsPanel } from 'admin-ui';

export function DiagnosticsTab() {
  return (
    <DiagnosticsPanel
      slug="headless-umami"
      textDomain="headless-umami"
      testAction={{
        path: '/headless-umami/v1/diagnostics/test-connection',
        title: __('Test Umami Connection', 'headless-umami'),
        description: __('Send a test event to verify your Umami connection. Check your Umami dashboard to confirm the event arrived.', 'headless-umami'),
        buttonLabel: __('Test Connection', 'headless-umami'),
      }}
    />
  );
}
