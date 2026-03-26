import apiFetch from '@wordpress/api-fetch';
import { Button, Notice, Spinner } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { DiagnosticsConfig } from '../types';

interface TestResult {
  success: boolean;
  message: string;
  [key: string]: unknown;
}

export function DiagnosticsPanel({
  slug,
  textDomain,
  lastErrorPath,
  lastErrorTitle,
  testAction,
  renderTestExtra,
}: DiagnosticsConfig) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [lastError, setLastError] = useState('');
  const [loadingError, setLoadingError] = useState(false);

  const errorPath = lastErrorPath ?? `/${slug}/v1/diagnostics/last-error`;
  const errorTitle = lastErrorTitle ?? __('Last Error', textDomain);

  const runTest = async () => {
    if (!testAction) return;
    setTesting(true);
    setResult(null);
    try {
      const data = await apiFetch<TestResult>({
        path: testAction.path,
        method: testAction.method ?? 'POST',
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
        path: errorPath,
      });
      setLastError(data.last_error || 'No errors recorded.');
    } catch {
      setLastError('Failed to fetch error log.');
    }
    setLoadingError(false);
  };

  return (
    <div style={{ padding: '16px 0', maxWidth: '600px' }}>
      {testAction && (
        <>
          <h3>{testAction.title}</h3>
          <p style={{ color: '#666', marginBottom: '12px' }}>{testAction.description}</p>
          <Button variant="secondary" onClick={runTest} isBusy={testing}>
            {testing ? <Spinner /> : testAction.buttonLabel}
          </Button>

          {result && (
            <div style={{ marginTop: '12px' }}>
              <Notice status={result.success ? 'success' : 'error'} isDismissible={false}>
                <p>{result.message}</p>
                {renderTestExtra?.(result)}
              </Notice>
            </div>
          )}

          <hr style={{ margin: '24px 0' }} />
        </>
      )}

      <h3>{errorTitle}</h3>
      {!testAction && (
        <p style={{ color: '#666', marginBottom: '12px' }}>
          {__('View the last error logged by the plugin, if any.', textDomain)}
        </p>
      )}
      <Button variant="secondary" onClick={fetchLastError} isBusy={loadingError}>
        {loadingError ? <Spinner /> : __('Fetch Last Error', textDomain)}
      </Button>

      {lastError && (
        <pre
          style={{
            marginTop: '12px',
            padding: '8px',
            background: '#f0f0f0',
            whiteSpace: 'pre-wrap',
          }}
        >
          {lastError}
        </pre>
      )}
    </div>
  );
}
