import { Button, SelectControl, TextareaControl, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { FormSection } from 'admin-ui';
import type { TabProps } from '../types';

declare const wp: any;

export function StoreIdentityTab({ settings, update }: TabProps) {
  const fallbacks = settings._fallbacks;

  const openMediaLibrary = () => {
    const frame = wp.media({
      title: __('Select Logo', 'headless-storefront'),
      multiple: false,
      library: { type: 'image' },
    });
    frame.on('select', () => {
      const attachment = frame.state().get('selection').first().toJSON();
      update('logo_url', attachment.url);
    });
    frame.open();
  };

  return (
    <FormSection>
      <TextControl
        label={__('App Name', 'headless-storefront')}
        help={__(
          'Store display name. Falls back to WordPress Site Title if empty.',
          'headless-storefront',
        )}
        placeholder={fallbacks?.app_name ?? ''}
        value={settings.app_name}
        onChange={(v: string) => update('app_name', v)}
      />
      <TextControl
        label={__('Short Name', 'headless-storefront')}
        help={__(
          'Short name for PWA manifest. Falls back to App Name if empty.',
          'headless-storefront',
        )}
        value={settings.short_name}
        onChange={(v: string) => update('short_name', v)}
      />
      <TextControl
        label={__('Tagline', 'headless-storefront')}
        help={__(
          'Store tagline for footer. Falls back to WordPress Site Tagline if empty.',
          'headless-storefront',
        )}
        placeholder={fallbacks?.tagline ?? ''}
        value={settings.tagline}
        onChange={(v: string) => update('tagline', v)}
      />
      <TextControl
        label={__('Title Tagline', 'headless-storefront')}
        help={__('Browser tab tagline (e.g., "Shop Smart, Save Big").', 'headless-storefront')}
        value={settings.title_tagline}
        onChange={(v: string) => update('title_tagline', v)}
      />
      <TextareaControl
        label={__('Description', 'headless-storefront')}
        help={__('Store meta description.', 'headless-storefront')}
        value={settings.description}
        onChange={(v: string) => update('description', v)}
        rows={3}
      />

      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontWeight: 600, marginBottom: '8px' }}>{__('Logo', 'headless-storefront')}</p>
        {settings.logo_url && (
          <div style={{ marginBottom: '8px' }}>
            <img
              src={settings.logo_url}
              alt={__('Logo preview', 'headless-storefront')}
              style={{ maxHeight: '60px', display: 'block', marginBottom: '4px' }}
            />
            <code style={{ fontSize: '11px' }}>{settings.logo_url}</code>
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" onClick={openMediaLibrary}>
            {settings.logo_url
              ? __('Change Logo', 'headless-storefront')
              : __('Select Logo', 'headless-storefront')}
          </Button>
          {settings.logo_url && (
            <Button variant="tertiary" isDestructive onClick={() => update('logo_url', '')}>
              {__('Remove', 'headless-storefront')}
            </Button>
          )}
        </div>
      </div>

      <SelectControl
        label={__('Font Family', 'headless-storefront')}
        help={__('Must match a font loaded in the frontend build.', 'headless-storefront')}
        value={settings.font_family}
        options={[
          { label: 'Inter', value: 'Inter' },
          { label: 'DM Sans', value: 'DM Sans' },
        ]}
        onChange={(v: string) => update('font_family', v)}
      />
    </FormSection>
  );
}
