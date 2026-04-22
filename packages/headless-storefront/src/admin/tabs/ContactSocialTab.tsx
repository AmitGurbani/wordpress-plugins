import { Button, SelectControl, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { FormSection } from 'admin-ui';
import type { Settings, SocialLink, TabProps } from '../types';

const PLATFORM_OPTIONS = [
  { label: 'Instagram', value: 'instagram' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'Twitter / X', value: 'twitter' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'LinkedIn', value: 'linkedin' },
];

export function ContactSocialTab({ settings, update }: TabProps) {
  const fallbacks = settings._fallbacks;
  const contact = settings.contact;

  const updateContact = (key: keyof Settings['contact'], value: string) => {
    update('contact', { ...contact, [key]: value });
  };

  const addSocialLink = () => {
    update('social', [...settings.social, { platform: 'instagram', href: '', label: '' }]);
  };

  const removeSocialLink = (index: number) => {
    update(
      'social',
      settings.social.filter((_: SocialLink, i: number) => i !== index),
    );
  };

  const updateSocialLink = (index: number, key: keyof SocialLink, value: string) => {
    const updated = [...settings.social];
    updated[index] = { ...updated[index], [key]: value };
    update('social', updated);
  };

  return (
    <FormSection>
      <h3>{__('Contact Information', 'headless-storefront')}</h3>
      <TextControl
        label={__('Phone Number', 'headless-storefront')}
        help={__('Display phone number.', 'headless-storefront')}
        value={contact.phone}
        onChange={(v: string) => updateContact('phone', v)}
      />
      <TextControl
        label={__('Phone Href', 'headless-storefront')}
        help={__('Phone tel: link (e.g., tel:18001234567).', 'headless-storefront')}
        value={contact.phone_href}
        onChange={(v: string) => updateContact('phone_href', v)}
      />
      <TextControl
        label={__('Email', 'headless-storefront')}
        help={__(
          'Support email. Falls back to WooCommerce "From" email if empty.',
          'headless-storefront',
        )}
        placeholder={fallbacks?.contact_email ?? ''}
        type="email"
        value={contact.email}
        onChange={(v: string) => updateContact('email', v)}
      />

      <h3 style={{ marginTop: '24px' }}>{__('WhatsApp', 'headless-storefront')}</h3>
      <TextControl
        label={__('WhatsApp Number', 'headless-storefront')}
        help={__('WhatsApp number with country code (e.g., 911234567890).', 'headless-storefront')}
        value={contact.whatsapp_number}
        onChange={(v: string) => updateContact('whatsapp_number', v)}
      />
      <TextControl
        label={__('WhatsApp Label', 'headless-storefront')}
        help={__('Display label for WhatsApp link.', 'headless-storefront')}
        value={contact.whatsapp_label}
        onChange={(v: string) => updateContact('whatsapp_label', v)}
      />

      <h3 style={{ marginTop: '24px' }}>{__('Social Links', 'headless-storefront')}</h3>
      {settings.social.map((link: SocialLink, i: number) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: '140px 1fr 1fr auto',
            gap: '8px',
            alignItems: 'end',
            marginBottom: '8px',
          }}
        >
          <SelectControl
            label={i === 0 ? __('Platform', 'headless-storefront') : ''}
            value={link.platform}
            options={PLATFORM_OPTIONS}
            onChange={(v: string) => updateSocialLink(i, 'platform', v)}
          />
          <TextControl
            label={i === 0 ? __('URL', 'headless-storefront') : ''}
            value={link.href}
            onChange={(v: string) => updateSocialLink(i, 'href', v)}
          />
          <TextControl
            label={i === 0 ? __('Label', 'headless-storefront') : ''}
            value={link.label}
            onChange={(v: string) => updateSocialLink(i, 'label', v)}
          />
          <Button variant="tertiary" isDestructive onClick={() => removeSocialLink(i)}>
            {__('Remove', 'headless-storefront')}
          </Button>
        </div>
      ))}
      <Button variant="secondary" onClick={addSocialLink}>
        {__('Add Social Link', 'headless-storefront')}
      </Button>
    </FormSection>
  );
}
