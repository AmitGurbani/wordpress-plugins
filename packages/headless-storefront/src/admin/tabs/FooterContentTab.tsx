import { TextControl } from '@wordpress/components';
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
