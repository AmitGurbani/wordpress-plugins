import { TextareaControl, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { FormSection } from 'admin-ui';
import type { TabProps } from '../types';

export function FooterContentTab({ settings, update }: TabProps) {
  const citiesStr = settings.cities.join(', ');

  const handleCitiesChange = (v: string) => {
    const parsed = v
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    update('cities', parsed);
  };

  const updateTrustSignal = (index: number, value: string) => {
    const updated = [...settings.trust_signals];
    updated[index] = value;
    update('trust_signals', updated);
  };

  return (
    <FormSection>
      <TextareaControl
        label={__('Store Hours', 'headless-storefront')}
        help={__(
          'Freeform store hours shown in the footer (e.g., "Mon–Sat 8 am – 10 pm · Sun 9 am – 8 pm"). Leave empty to hide the section.',
          'headless-storefront',
        )}
        value={settings.hours_text}
        onChange={(v: string) => update('hours_text', v)}
        rows={2}
      />
      <TextareaControl
        label={__('Delivery Area', 'headless-storefront')}
        help={__(
          'Freeform delivery coverage description (e.g., "Within 3 km of Sector 14, Gurgaon"). Leave empty to hide.',
          'headless-storefront',
        )}
        value={settings.delivery_area_text}
        onChange={(v: string) => update('delivery_area_text', v)}
        rows={2}
      />
      <TextControl
        label={__('Cities', 'headless-storefront')}
        help={__('Comma-separated delivery coverage cities.', 'headless-storefront')}
        value={citiesStr}
        onChange={handleCitiesChange}
      />

      <h3 style={{ marginTop: '24px' }}>{__('Trust Signals', 'headless-storefront')}</h3>
      <p style={{ color: '#666', marginBottom: '12px' }}>
        {__('Product page trust badges (4 badges).', 'headless-storefront')}
      </p>
      {[0, 1, 2, 3].map((i) => (
        <TextControl
          key={i}
          label={`${__('Badge', 'headless-storefront')} ${i + 1}`}
          value={settings.trust_signals[i] ?? ''}
          onChange={(v: string) => updateTrustSignal(i, v)}
        />
      ))}
    </FormSection>
  );
}
