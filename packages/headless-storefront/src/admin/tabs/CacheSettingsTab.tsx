import apiFetch from '@wordpress/api-fetch';
import { Button, Notice, Spinner, TextControl } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { FormSection, SecretField } from 'admin-ui';
import type { TabProps } from '../types';

type Status = { kind: 'ok'; message: string } | { kind: 'error'; message: string } | null;

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

export function CacheSettingsTab({ settings, update }: TabProps) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const canRevalidate =
    settings.frontend_url.trim().length > 0 && settings.revalidate_secret.trim().length > 0;
  const insecureUrl = isInsecureFrontendUrl(settings.frontend_url);

  const handleRevalidate = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const result: { dispatched: boolean } = await apiFetch({
        path: '/headless-storefront/v1/admin/revalidate',
        method: 'POST',
      });
      if (result.dispatched) {
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

  return (
    <FormSection>
      <p style={{ color: '#666', marginBottom: '16px' }}>
        {__(
          'When storefront settings (or Site Title / Tagline / WooCommerce email) are saved, a POST request is sent to your frontend to bust its cache. Both fields below must be configured for the webhook to fire.',
          'headless-storefront',
        )}
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
    </FormSection>
  );
}
