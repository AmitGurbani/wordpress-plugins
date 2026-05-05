import { TextareaControl, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { FormSection } from 'admin-ui';
import type { TabProps } from '../types';

function parseIntegerInput(raw: string): number | '' {
  if (raw.trim() === '') return '';
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n < 0) return '';
  return n;
}

export function OperationsTab({ settings, update }: TabProps) {
  const deliveryAreasStr = settings.delivery_areas.join(', ');

  const handleDeliveryAreasChange = (v: string) => {
    const parsed = v
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    update('delivery_areas', parsed);
  };

  return (
    <FormSection>
      <TextControl
        label={__('Owner Name', 'headless-storefront')}
        help={__(
          'Proprietor display name shown on storefronts that surface ownership (kirana, bakery).',
          'headless-storefront',
        )}
        value={settings.owner_name}
        onChange={(v: string) => update('owner_name', v)}
      />
      <TextControl
        label={__('Established Line', 'headless-storefront')}
        help={__(
          'Heritage line shown near the store name (e.g., "Since 1987").',
          'headless-storefront',
        )}
        value={settings.estd_line}
        onChange={(v: string) => update('estd_line', v)}
      />
      <TextControl
        label={__('FSSAI License', 'headless-storefront')}
        help={__(
          'Food Safety license number (legally required for IN food merchants — bakery, quickcommerce, fooddelivery).',
          'headless-storefront',
        )}
        value={settings.fssai_license}
        onChange={(v: string) => update('fssai_license', v)}
      />

      <h3 style={{ marginTop: '24px' }}>{__('Order Policy', 'headless-storefront')}</h3>
      <TextControl
        label={__('Minimum Order Value (MOV)', 'headless-storefront')}
        type="number"
        min={0}
        step={1}
        help={__(
          'Smallest order the storefront will accept, in major currency units (e.g., 200 = ₹200). Leave empty for no minimum.',
          'headless-storefront',
        )}
        value={settings.mov === '' ? '' : String(settings.mov)}
        onChange={(v: string) => update('mov', parseIntegerInput(v))}
      />
      <TextControl
        label={__('Delivery Fee', 'headless-storefront')}
        type="number"
        min={0}
        step={1}
        help={__(
          'Flat delivery fee in major currency units (e.g., 25 = ₹25). Use 0 for free delivery; leave empty if delivery fee is computed elsewhere.',
          'headless-storefront',
        )}
        value={settings.delivery_fee === '' ? '' : String(settings.delivery_fee)}
        onChange={(v: string) => update('delivery_fee', parseIntegerInput(v))}
      />

      <h3 style={{ marginTop: '24px' }}>
        {__('Delivery Areas (structured)', 'headless-storefront')}
      </h3>
      <p style={{ color: '#666', marginBottom: '12px' }}>
        {__(
          'Comma-separated localities (e.g., "Sector 14, Sector 15, DLF Phase 2"). Storefronts that render a coverage grid use this; the free-text Delivery Area on the Footer Content tab remains as a human-readable fallback.',
          'headless-storefront',
        )}
      </p>
      <TextareaControl
        label={__('Areas', 'headless-storefront')}
        value={deliveryAreasStr}
        onChange={handleDeliveryAreasChange}
        rows={3}
      />
    </FormSection>
  );
}
