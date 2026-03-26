import { __ } from '@wordpress/i18n';
import { DiagnosticsPanel } from 'admin-ui';

export function DiagnosticsTab() {
  return (
    <DiagnosticsPanel
      slug="headless-google-analytics"
      textDomain="headless-google-analytics"
      testAction={{
        path: '/headless-google-analytics/v1/diagnostics/test-event',
        title: __('Test Measurement Protocol', 'headless-google-analytics'),
        description: __(
          'Send a test page_view event to the GA4 Measurement Protocol debug endpoint. This validates your payload structure but does not verify your Measurement ID or API Secret — check GA4 Realtime to confirm events arrive.',
          'headless-google-analytics',
        ),
        buttonLabel: __('Test Measurement Protocol', 'headless-google-analytics'),
      }}
      renderTestExtra={(result) =>
        result.validation_errors ? (
          <pre
            style={{
              marginTop: '8px',
              padding: '8px',
              background: '#f0f0f0',
              whiteSpace: 'pre-wrap',
            }}
          >
            {result.validation_errors as string}
          </pre>
        ) : null
      }
    />
  );
}
