import { useState } from '@wordpress/element';
import { Button, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

export function DiagnosticsTab() {
  const [lastError, setLastError] = useState('');
  const [loadingError, setLoadingError] = useState(false);

  const fetchLastError = async () => {
    setLoadingError(true);
    try {
      const data = await apiFetch<{ last_error: string }>({
        path: '/headless-clarity/v1/diagnostics/last-error',
      });
      setLastError(data.last_error || 'No errors recorded.');
    } catch {
      setLastError('Failed to fetch error log.');
    }
    setLoadingError(false);
  };

  return (
    <div style={{ padding: '16px 0', maxWidth: '600px' }}>
      <h3>{__('Last Error', 'headless-clarity')}</h3>
      <p style={{ color: '#666', marginBottom: '12px' }}>
        {__('View the last error logged by the plugin, if any.', 'headless-clarity')}
      </p>
      <Button variant="secondary" onClick={fetchLastError} isBusy={loadingError}>
        {loadingError ? <Spinner /> : __('Fetch Last Error', 'headless-clarity')}
      </Button>

      {lastError && (
        <pre style={{ marginTop: '12px', padding: '8px', background: '#f0f0f0', whiteSpace: 'pre-wrap' }}>
          {lastError}
        </pre>
      )}
    </div>
  );
}
