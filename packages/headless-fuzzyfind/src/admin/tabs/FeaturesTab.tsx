import {
  __experimentalNumberControl as NumberControl,
  TextareaControl,
  ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { TabProps } from '../types';

export function FeaturesTab({ settings, update }: TabProps) {
  return (
    <div style={{ padding: '16px 0', maxWidth: '600px' }}>
      <ToggleControl
        label={__('Enable Fuzzy Matching', 'headless-fuzzyfind')}
        help={
          settings.fuzzy_enabled
            ? __(
                'Fuzzy matching is ON. Misspellings will be corrected automatically.',
                'headless-fuzzyfind',
              )
            : __(
                'Enable to handle misspellings and typos using edit-distance matching.',
                'headless-fuzzyfind',
              )
        }
        checked={settings.fuzzy_enabled}
        onChange={(v: boolean) => update('fuzzy_enabled', v)}
      />
      <ToggleControl
        label={__('Enable Autocomplete', 'headless-fuzzyfind')}
        help={
          settings.autocomplete_enabled
            ? __(
                'Autocomplete endpoint is active at /headless-fuzzyfind/v1/autocomplete.',
                'headless-fuzzyfind',
              )
            : __(
                'Enable the REST API autocomplete endpoint for search-as-you-type.',
                'headless-fuzzyfind',
              )
        }
        checked={settings.autocomplete_enabled}
        onChange={(v: boolean) => update('autocomplete_enabled', v)}
      />
      <ToggleControl
        label={__('Enable Search Analytics', 'headless-fuzzyfind')}
        help={
          settings.analytics_enabled
            ? __('Search queries are being tracked for analytics.', 'headless-fuzzyfind')
            : __('Enable to track popular searches and zero-result queries.', 'headless-fuzzyfind')
        }
        checked={settings.analytics_enabled}
        onChange={(v: boolean) => update('analytics_enabled', v)}
      />
      <NumberControl
        label={__('Minimum Query Length', 'headless-fuzzyfind')}
        help={__(
          'Minimum characters required to trigger enhanced search. Default: 2.',
          'headless-fuzzyfind',
        )}
        value={settings.min_query_length}
        onChange={(v: string | undefined) => update('min_query_length', v ? parseInt(v, 10) : 2)}
        min={1}
        max={5}
      />
      <NumberControl
        label={__('Autocomplete Result Limit', 'headless-fuzzyfind')}
        help={__('Maximum number of autocomplete suggestions. Default: 8.', 'headless-fuzzyfind')}
        value={settings.autocomplete_limit}
        onChange={(v: string | undefined) => update('autocomplete_limit', v ? parseInt(v, 10) : 8)}
        min={3}
        max={20}
      />
      <NumberControl
        label={__('"Did You Mean" Threshold', 'headless-fuzzyfind')}
        help={__(
          'Show suggestions when results are fewer than this number. Default: 3.',
          'headless-fuzzyfind',
        )}
        value={settings.did_you_mean_threshold}
        onChange={(v: string | undefined) =>
          update('did_you_mean_threshold', v ? parseInt(v, 10) : 3)
        }
        min={0}
        max={10}
      />
      <TextareaControl
        label={__('Search Synonyms', 'headless-fuzzyfind')}
        help={__(
          'One group per line, comma-separated. Example:\nsneakers, shoes, trainers\ntee, t-shirt, top',
          'headless-fuzzyfind',
        )}
        value={settings.synonyms}
        onChange={(v: string) => update('synonyms', v)}
        rows={6}
      />
    </div>
  );
}
