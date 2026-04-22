import apiFetch from '@wordpress/api-fetch';
import {
  Button,
  __experimentalNumberControl as NumberControl,
  Spinner,
  TextControl,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { FormSection } from 'admin-ui';
import type { SearchQuery, TabProps } from '../types';

export function PopularSearchesTab({ settings, update }: TabProps) {
  const [searches, setSearches] = useState<SearchQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const fetchSearches = () => {
    apiFetch({ path: '/headless-storefront/v1/admin/popular-searches' })
      .then((result: any) => {
        setSearches(result);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchSearches();
  }, []);

  const handleClear = async () => {
    setClearing(true);
    try {
      await apiFetch({
        path: '/headless-storefront/v1/admin/clear-searches',
        method: 'POST',
      });
      setSearches([]);
    } catch {
      // ignore
    }
    setClearing(false);
  };

  const overridesStr = settings.popular_searches_override.join(', ');

  const handleOverridesChange = (v: string) => {
    const parsed = v
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    update('popular_searches_override', parsed);
  };

  return (
    <FormSection>
      <h3>{__('Auto-Tracked Searches', 'headless-storefront')}</h3>
      {loading ? (
        <Spinner />
      ) : searches.length > 0 ? (
        <table className="widefat striped" style={{ marginBottom: '16px' }}>
          <thead>
            <tr>
              <th>{__('Query', 'headless-storefront')}</th>
              <th>{__('Count', 'headless-storefront')}</th>
              <th>{__('Last Searched', 'headless-storefront')}</th>
            </tr>
          </thead>
          <tbody>
            {searches.map((row, i) => (
              <tr key={i}>
                <td>
                  <code>{row.query}</code>
                </td>
                <td>{row.count}</td>
                <td>{row.last_searched}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ color: '#666' }}>
          {__(
            'No search data yet. Searches from the WooCommerce Store API will appear here.',
            'headless-storefront',
          )}
        </p>
      )}

      <Button
        variant="secondary"
        isDestructive
        onClick={handleClear}
        isBusy={clearing}
        style={{ marginBottom: '24px' }}
      >
        {clearing ? <Spinner /> : __('Clear Search Data', 'headless-storefront')}
      </Button>

      <h3>{__('Settings', 'headless-storefront')}</h3>
      <TextControl
        label={__('Manual Overrides', 'headless-storefront')}
        help={__(
          'Comma-separated search terms. When set, these replace auto-tracked searches in the /config response.',
          'headless-storefront',
        )}
        value={overridesStr}
        onChange={handleOverridesChange}
      />
      <NumberControl
        label={__('Max Results', 'headless-storefront')}
        help={__('Maximum number of popular searches returned. Default: 12', 'headless-storefront')}
        value={settings.popular_searches_max}
        onChange={(v: string | undefined) =>
          update('popular_searches_max', v ? parseInt(v, 10) : 12)
        }
        min={1}
        max={50}
      />
    </FormSection>
  );
}
