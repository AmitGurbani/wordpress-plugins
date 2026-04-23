import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { FormSection, SecretField } from 'admin-ui';
import type { TabProps } from '../types';

export function CacheSettingsTab({ settings, update }: TabProps) {
  return (
    <FormSection>
      <p style={{ color: '#666', marginBottom: '16px' }}>
        {__(
          'When storefront settings are saved, a POST request is sent to your frontend to bust its cache. Both fields must be configured for the webhook to fire.',
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
      <SecretField
        label={__('Revalidate Secret', 'headless-storefront')}
        help={__("Must match your frontend's REVALIDATE_SECRET env var.", 'headless-storefront')}
        textDomain="headless-storefront"
        value={settings.revalidate_secret}
        onChange={(v: string) => update('revalidate_secret', v)}
      />
    </FormSection>
  );
}
