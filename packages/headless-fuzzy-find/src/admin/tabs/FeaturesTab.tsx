import {
  __experimentalNumberControl as NumberControl,
  TextareaControl,
  ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { FormSection } from 'admin-ui';
import type { TabProps } from '../types';

export function FeaturesTab({ settings, update }: TabProps) {
  return (
    <FormSection>
      <ToggleControl
        label={__('Enable Fuzzy Matching', 'headless-fuzzy-find')}
        help={
          settings.fuzzy_enabled
            ? __(
                'Fuzzy matching is ON. Misspellings will be corrected automatically.',
                'headless-fuzzy-find',
              )
            : __(
                'Enable to handle misspellings and typos using edit-distance matching.',
                'headless-fuzzy-find',
              )
        }
        checked={settings.fuzzy_enabled}
        onChange={(v: boolean) => update('fuzzy_enabled', v)}
      />
      <ToggleControl
        label={__('Enable Autocomplete', 'headless-fuzzy-find')}
        help={
          settings.autocomplete_enabled
            ? __(
                'Autocomplete endpoint is active at /headless-fuzzy-find/v1/autocomplete.',
                'headless-fuzzy-find',
              )
            : __(
                'Enable the REST API autocomplete endpoint for search-as-you-type.',
                'headless-fuzzy-find',
              )
        }
        checked={settings.autocomplete_enabled}
        onChange={(v: boolean) => update('autocomplete_enabled', v)}
      />
      <ToggleControl
        label={__('Enable Search Analytics', 'headless-fuzzy-find')}
        help={
          settings.analytics_enabled
            ? __('Search queries are being tracked for analytics.', 'headless-fuzzy-find')
            : __('Enable to track popular searches and zero-result queries.', 'headless-fuzzy-find')
        }
        checked={settings.analytics_enabled}
        onChange={(v: boolean) => update('analytics_enabled', v)}
      />
      <NumberControl
        label={__('Minimum Query Length', 'headless-fuzzy-find')}
        help={__(
          'Minimum characters required to trigger enhanced search. Default: 2.',
          'headless-fuzzy-find',
        )}
        value={settings.min_query_length}
        onChange={(v: string | undefined) => update('min_query_length', v ? parseInt(v, 10) : 2)}
        min={1}
        max={5}
      />
      <NumberControl
        label={__('Autocomplete Result Limit', 'headless-fuzzy-find')}
        help={__('Maximum number of autocomplete suggestions. Default: 8.', 'headless-fuzzy-find')}
        value={settings.autocomplete_limit}
        onChange={(v: string | undefined) => update('autocomplete_limit', v ? parseInt(v, 10) : 8)}
        min={3}
        max={20}
      />
      <NumberControl
        label={__('"Did You Mean" Threshold', 'headless-fuzzy-find')}
        help={__(
          'Show suggestions when results are fewer than this number. Default: 3.',
          'headless-fuzzy-find',
        )}
        value={settings.did_you_mean_threshold}
        onChange={(v: string | undefined) =>
          update('did_you_mean_threshold', v ? parseInt(v, 10) : 3)
        }
        min={0}
        max={10}
      />
      <TextareaControl
        label={__('Search Synonyms', 'headless-fuzzy-find')}
        help={__(
          'One group per line, comma-separated. Example:\nsneakers, shoes, trainers\ntee, t-shirt, top',
          'headless-fuzzy-find',
        )}
        value={settings.synonyms}
        onChange={(v: string) => update('synonyms', v)}
        rows={6}
      />
    </FormSection>
  );
}
