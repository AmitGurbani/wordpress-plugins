import apiFetch from '@wordpress/api-fetch';
import { Button, Notice, Spinner, TextControl } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { FormSection, SecretField } from 'admin-ui';
import type { TabProps } from '../types';

type Status = { kind: 'ok'; message: string } | { kind: 'error'; message: string } | null;

interface TestResult {
  success: boolean;
  code: string;
  message: string;
  http_code: number | null;
}

function isInsecureFrontendUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:') return false;
    const host = parsed.hostname;
    return !(host === 'localhost' || host.startsWith('127.') || host === '::1');
  } catch {
    return false;
  }
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const seconds = Math.max(0, Math.floor(diffMs / 1000));
  if (seconds < 60) return __('a few seconds ago', 'headless-storefront');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return minutes === 1
      ? __('1 minute ago', 'headless-storefront')
      : sprintf(__('%d minutes ago', 'headless-storefront'), minutes);
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return hours === 1
      ? __('1 hour ago', 'headless-storefront')
      : sprintf(__('%d hours ago', 'headless-storefront'), hours);
  }
  const days = Math.floor(hours / 24);
  return days === 1
    ? __('1 day ago', 'headless-storefront')
    : sprintf(__('%d days ago', 'headless-storefront'), days);
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatAbsoluteUtc(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())} UTC`;
}

export function CacheSettingsTab({ settings, update }: TabProps) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [optimisticLastAt, setOptimisticLastAt] = useState<string | null>(null);

  const canRevalidate =
    settings.frontend_url.trim().length > 0 && settings.revalidate_secret.trim().length > 0;
  const insecureUrl = isInsecureFrontendUrl(settings.frontend_url);

  const lastAt = optimisticLastAt ?? settings._last_revalidate_at ?? null;

  const handleRevalidate = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const result: { dispatched: boolean } = await apiFetch({
        path: '/headless-storefront/v1/admin/revalidate',
        method: 'POST',
      });
      if (result.dispatched) {
        setOptimisticLastAt(new Date().toISOString());
        setStatus({
          kind: 'ok',
          message: __('Revalidation webhook dispatched to the frontend.', 'headless-storefront'),
        });
      } else {
        setStatus({
          kind: 'error',
          message: __(
            'Webhook not dispatched — Frontend URL or Revalidate Secret is empty, or WP-CLI is active.',
            'headless-storefront',
          ),
        });
      }
    } catch (err: any) {
      setStatus({
        kind: 'error',
        message: err?.message ?? __('Request failed.', 'headless-storefront'),
      });
    }
    setBusy(false);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result: TestResult = await apiFetch({
        path: '/headless-storefront/v1/diagnostics/test-revalidate',
        method: 'POST',
      });
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        code: 'request_failed',
        message: err?.message ?? __('Request failed.', 'headless-storefront'),
        http_code: null,
      });
    }
    setTesting(false);
  };

  return (
    <FormSection>
      <p style={{ color: '#666', marginBottom: '8px' }}>
        {__(
          'When storefront settings (or Site Title / Tagline / WooCommerce email) are saved, a POST request is sent to your frontend to bust its cache. Both fields below must be configured for the webhook to fire.',
          'headless-storefront',
        )}
      </p>
      <p style={{ color: '#666', fontSize: '12px', marginBottom: '16px' }}>
        {lastAt
          ? sprintf(
              __('Last webhook attempted: %1$s (%2$s)', 'headless-storefront'),
              formatRelative(lastAt),
              formatAbsoluteUtc(lastAt),
            )
          : __('Last webhook attempted: never attempted yet.', 'headless-storefront')}
      </p>
      <TextControl
        label={__('Frontend URL', 'headless-storefront')}
        help={__(
          'Your Next.js frontend URL (e.g., https://store.example.com).',
          'headless-storefront',
        )}
        value={settings.frontend_url}
        onChange={(v: string) => update('frontend_url', v)}
      />
      {insecureUrl && (
        <div style={{ marginBottom: '16px' }}>
          <Notice status="warning" isDismissible={false}>
            {__(
              'Frontend URL uses http:// on a non-local host. The revalidate secret will be sent in cleartext over the network. Use https:// in production.',
              'headless-storefront',
            )}
          </Notice>
        </div>
      )}
      <SecretField
        label={__('Revalidate Secret', 'headless-storefront')}
        help={__("Must match your frontend's REVALIDATE_SECRET env var.", 'headless-storefront')}
        textDomain="headless-storefront"
        value={settings.revalidate_secret}
        onChange={(v: string) => update('revalidate_secret', v)}
      />

      <h3 style={{ marginTop: '24px' }}>{__('Manual Re-push', 'headless-storefront')}</h3>
      <p style={{ color: '#666', marginBottom: '12px' }}>
        {__(
          'Fires the revalidation webhook right now without saving. Useful when the frontend cache appears stuck.',
          'headless-storefront',
        )}
      </p>
      <Button
        variant="secondary"
        onClick={handleRevalidate}
        isBusy={busy}
        disabled={busy || !canRevalidate}
      >
        {busy ? <Spinner /> : __('Re-push storefront config', 'headless-storefront')}
      </Button>
      {!canRevalidate && (
        <p style={{ color: '#666', marginTop: '8px', fontSize: '12px' }}>
          {__('Configure both fields above to enable this button.', 'headless-storefront')}
        </p>
      )}
      {status && (
        <div style={{ marginTop: '12px' }}>
          <Notice
            status={status.kind === 'ok' ? 'success' : 'error'}
            isDismissible
            onRemove={() => setStatus(null)}
          >
            {status.message}
          </Notice>
        </div>
      )}

      <h3 style={{ marginTop: '24px' }}>{__('Test Webhook', 'headless-storefront')}</h3>
      <p style={{ color: '#666', marginBottom: '12px' }}>
        {__(
          'Sends a synchronous POST to your frontend and reports the HTTP response. Use this to verify your URL and secret are correct without waiting for an option change. Does not update the timestamp above.',
          'headless-storefront',
        )}
      </p>
      <Button
        variant="secondary"
        onClick={handleTest}
        isBusy={testing}
        disabled={testing || !canRevalidate}
      >
        {testing ? <Spinner /> : __('Test webhook', 'headless-storefront')}
      </Button>
      {!canRevalidate && (
        <p style={{ color: '#666', marginTop: '8px', fontSize: '12px' }}>
          {__('Configure both fields above to enable this button.', 'headless-storefront')}
        </p>
      )}
      {testResult && (
        <div style={{ marginTop: '12px' }}>
          <Notice
            status={testResult.success ? 'success' : 'error'}
            isDismissible
            onRemove={() => setTestResult(null)}
          >
            <p style={{ margin: 0 }}>
              {testResult.success && testResult.http_code !== null
                ? sprintf(
                    __('Webhook configured correctly (HTTP %d).', 'headless-storefront'),
                    testResult.http_code,
                  )
                : testResult.message}
            </p>
            {!testResult.success && testResult.http_code !== null && (
              <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
                {sprintf(__('HTTP %d', 'headless-storefront'), testResult.http_code)}
              </p>
            )}
          </Notice>
        </div>
      )}
    </FormSection>
  );
}
