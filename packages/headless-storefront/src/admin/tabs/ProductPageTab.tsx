import { TextareaControl, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { FormSection } from 'admin-ui';
import type { TabProps } from '../types';

export function ProductPageTab({ settings, update }: TabProps) {
  return (
    <FormSection>
      <TextControl
        label={__('Delivery Message', 'headless-storefront')}
        help={__('Delivery info shown on product pages.', 'headless-storefront')}
        value={settings.delivery_message}
        onChange={(v: string) => update('delivery_message', v)}
      />
      <TextareaControl
        label={__('Return Policy', 'headless-storefront')}
        help={__('Return policy text shown on product pages.', 'headless-storefront')}
        value={settings.return_policy}
        onChange={(v: string) => update('return_policy', v)}
        rows={3}
      />
      <TextControl
        label={__('Delivery Badge', 'headless-storefront')}
        help={__('Badge text on product cards. Leave empty to hide.', 'headless-storefront')}
        value={settings.delivery_badge}
        onChange={(v: string) => update('delivery_badge', v)}
      />
    </FormSection>
  );
}
