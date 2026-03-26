import { __ } from '@wordpress/i18n';
import { DiagnosticsPanel } from 'admin-ui';

export function DiagnosticsTab() {
  return (
    <DiagnosticsPanel
      slug="headless-meta-pixel"
      textDomain="headless-meta-pixel"
      lastErrorTitle={__('Last CAPI Error', 'headless-meta-pixel')}
      testAction={{
        path: '/headless-meta-pixel/v1/diagnostics/test-capi',
        title: __('Test Conversions API', 'headless-meta-pixel'),
        description: __('Send a test PageView event to verify your CAPI connection. Make sure you have set a Test Event Code in the General tab first.', 'headless-meta-pixel'),
        buttonLabel: __('Test CAPI Connection', 'headless-meta-pixel'),
      }}
      renderTestExtra={(result) =>
        result.test_event_code ? (
          <p>
            {__('Test Event Code:', 'headless-meta-pixel')} <code>{result.test_event_code as string}</code>
          </p>
        ) : null
      }
    />
  );
}
