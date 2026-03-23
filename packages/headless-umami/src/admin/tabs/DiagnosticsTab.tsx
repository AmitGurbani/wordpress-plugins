import { useState } from '@wordpress/element';
import { Button, Notice, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

interface TestResult {
  success: boolean;
  message: string;
}

export function DiagnosticsTab() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [lastError, setLastError] = useState('');
  const [loadingError, setLoadingError] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    setResult(null);
    try {
      const data = await apiFetch<TestResult>({
        path: '/headless-umami/v1/diagnostics/test-connection',
        method: 'POST',
      });
      setResult(data);
    } catch (err: any) {
      setResult({ success: false, message: err?.message || 'Request failed.' });
    }
    setTesting(false);
  };

  const fetchLastError = async () => {
    setLoadingError(true);
    try {
      const data = await apiFetch<{ last_error: string }>({
        path: '/headless-umami/v1/diagnostics/last-error',
      });
      setLastError(data.last_error || 'No errors recorded.');
    } catch {
      setLastError('Failed to fetch error log.');
    }
    setLoadingError(false);
  };

  return (
    <div style={{ padding: '16px 0', maxWidth: '600px' }}>
      <h3>{__('Test Umami Connection', 'headless-umami')}</h3>
      <p style={{ color: '#666', marginBottom: '12px' }}>
        {__('Send a test event to verify your Umami connection. Check your Umami dashboard to confirm the event arrived.', 'headless-umami')}
      </p>
      <Button variant="secondary" onClick={testConnection} isBusy={testing}>
        {testing ? <Spinner /> : __('Test Connection', 'headless-umami')}
      </Button>

      {result && (
        <Notice
          status={result.success ? 'success' : 'error'}
          isDismissible={false}
          style={{ marginTop: '12px' }}
        >
          <p>{result.message}</p>
        </Notice>
      )}

      <hr style={{ margin: '24px 0' }} />

      <h3>{__('Last Error', 'headless-umami')}</h3>
      <Button variant="secondary" onClick={fetchLastError} isBusy={loadingError}>
        {loadingError ? <Spinner /> : __('Fetch Last Error', 'headless-umami')}
      </Button>

      {lastError && (
        <pre style={{ marginTop: '12px', padding: '8px', background: '#f0f0f0', whiteSpace: 'pre-wrap' }}>
          {lastError}
        </pre>
      )}
    </div>
  );
}
