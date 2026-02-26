import { __experimentalNumberControl as NumberControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { TabProps } from '../types';

export function WeightsTab({ settings, update }: TabProps) {
  return (
    <div style={{ padding: '16px 0', maxWidth: '600px' }}>
      <p style={{ color: '#666', marginBottom: '16px' }}>
        {__('Adjust how much weight each field has in search relevance scoring. Higher values mean matches in that field rank higher in results.', 'fuzzyfind')}
      </p>
      <NumberControl
        label={__('Title Weight', 'fuzzyfind')}
        help={__('Weight for product title matches. Default: 10.', 'fuzzyfind')}
        value={settings.weight_title}
        onChange={(v: string | undefined) => update('weight_title', v ? parseInt(v, 10) : 10)}
        min={1}
        max={10}
      />
      <NumberControl
        label={__('SKU Weight', 'fuzzyfind')}
        help={__('Weight for SKU matches. Default: 8.', 'fuzzyfind')}
        value={settings.weight_sku}
        onChange={(v: string | undefined) => update('weight_sku', v ? parseInt(v, 10) : 8)}
        min={1}
        max={10}
      />
      <NumberControl
        label={__('Category Weight', 'fuzzyfind')}
        help={__('Weight for product category name matches. Default: 6.', 'fuzzyfind')}
        value={settings.weight_categories}
        onChange={(v: string | undefined) => update('weight_categories', v ? parseInt(v, 10) : 6)}
        min={1}
        max={10}
      />
      <NumberControl
        label={__('Attribute Weight', 'fuzzyfind')}
        help={__('Weight for product attribute matches (color, size, etc.). Default: 5.', 'fuzzyfind')}
        value={settings.weight_attributes}
        onChange={(v: string | undefined) => update('weight_attributes', v ? parseInt(v, 10) : 5)}
        min={1}
        max={10}
      />
      <NumberControl
        label={__('Tag Weight', 'fuzzyfind')}
        help={__('Weight for product tag matches. Default: 4.', 'fuzzyfind')}
        value={settings.weight_tags}
        onChange={(v: string | undefined) => update('weight_tags', v ? parseInt(v, 10) : 4)}
        min={1}
        max={10}
      />
      <NumberControl
        label={__('Content Weight', 'fuzzyfind')}
        help={__('Weight for product description matches. Default: 2.', 'fuzzyfind')}
        value={settings.weight_content}
        onChange={(v: string | undefined) => update('weight_content', v ? parseInt(v, 10) : 2)}
        min={1}
        max={10}
      />
    </div>
  );
}
