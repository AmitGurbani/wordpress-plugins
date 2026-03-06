import { ToggleControl, TextareaControl, __experimentalNumberControl as NumberControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { TabProps } from '../types';

export function FeaturesTab({ settings, update }: TabProps) {
  return (
    <div style={{ padding: '16px 0', maxWidth: '600px' }}>
      <ToggleControl
        label={__('Enable Fuzzy Matching', 'fuzzyfind')}
        help={settings.fuzzy_enabled
          ? __('Fuzzy matching is ON. Misspellings will be corrected automatically.', 'fuzzyfind')
          : __('Enable to handle misspellings and typos using edit-distance matching.', 'fuzzyfind')
        }
        checked={settings.fuzzy_enabled}
        onChange={(v: boolean) => update('fuzzy_enabled', v)}
      />
      <ToggleControl
        label={__('Enable Autocomplete', 'fuzzyfind')}
        help={settings.autocomplete_enabled
          ? __('Autocomplete endpoint is active at /fuzzyfind/v1/autocomplete.', 'fuzzyfind')
          : __('Enable the REST API autocomplete endpoint for search-as-you-type.', 'fuzzyfind')
        }
        checked={settings.autocomplete_enabled}
        onChange={(v: boolean) => update('autocomplete_enabled', v)}
      />
      <ToggleControl
        label={__('Enable Search Analytics', 'fuzzyfind')}
        help={settings.analytics_enabled
          ? __('Search queries are being tracked for analytics.', 'fuzzyfind')
          : __('Enable to track popular searches and zero-result queries.', 'fuzzyfind')
        }
        checked={settings.analytics_enabled}
        onChange={(v: boolean) => update('analytics_enabled', v)}
      />
      <NumberControl
        label={__('Minimum Query Length', 'fuzzyfind')}
        help={__('Minimum characters required to trigger enhanced search. Default: 2.', 'fuzzyfind')}
        value={settings.min_query_length}
        onChange={(v: string | undefined) => update('min_query_length', v ? parseInt(v, 10) : 2)}
        min={1}
        max={5}
      />
      <NumberControl
        label={__('Autocomplete Result Limit', 'fuzzyfind')}
        help={__('Maximum number of autocomplete suggestions. Default: 8.', 'fuzzyfind')}
        value={settings.autocomplete_limit}
        onChange={(v: string | undefined) => update('autocomplete_limit', v ? parseInt(v, 10) : 8)}
        min={3}
        max={20}
      />
      <NumberControl
        label={__('"Did You Mean" Threshold', 'fuzzyfind')}
        help={__('Show suggestions when results are fewer than this number. Default: 3.', 'fuzzyfind')}
        value={settings.did_you_mean_threshold}
        onChange={(v: string | undefined) => update('did_you_mean_threshold', v ? parseInt(v, 10) : 3)}
        min={0}
        max={10}
      />
      <TextareaControl
        label={__('Search Synonyms', 'fuzzyfind')}
        help={__('One group per line, comma-separated. Example:\nsneakers, shoes, trainers\ntee, t-shirt, top', 'fuzzyfind')}
        value={settings.synonyms}
        onChange={(v: string) => update('synonyms', v)}
        rows={6}
      />
    </div>
  );
}
