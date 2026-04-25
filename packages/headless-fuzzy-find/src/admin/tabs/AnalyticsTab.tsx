import apiFetch from '@wordpress/api-fetch';
import {
  Button,
  __experimentalNumberControl as NumberControl,
  Spinner,
  TextareaControl,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { FormSection } from 'admin-ui';
import type { AnalyticsData, TabProps } from '../types';

export function AnalyticsTab({ settings, update }: TabProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const fetchAnalytics = () => {
    apiFetch({ path: '/headless-fuzzy-find/v1/analytics' })
      .then((result: any) => {
        setData(result);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleClear = async () => {
    setClearing(true);
    try {
      await apiFetch({
        path: '/headless-fuzzy-find/v1/analytics/clear',
        method: 'POST',
      });
      setData({ popular: [], zero_results: [] });
    } catch {
      // ignore
    }
    setClearing(false);
  };

  if (loading) return <Spinner />;

  return (
    <FormSection narrow={false}>
      <h3>{__('Popular Searches', 'headless-fuzzy-find')}</h3>
      {data && data.popular.length > 0 ? (
        <table className="widefat striped" style={{ marginBottom: '24px' }}>
          <thead>
            <tr>
              <th>{__('Query', 'headless-fuzzy-find')}</th>
              <th>{__('Searches', 'headless-fuzzy-find')}</th>
              <th>{__('Results', 'headless-fuzzy-find')}</th>
              <th>{__('Last Searched', 'headless-fuzzy-find')}</th>
            </tr>
          </thead>
          <tbody>
            {data.popular.map((row, i) => (
              <tr key={i}>
                <td>
                  <code>{row.query}</code>
                </td>
                <td>{row.search_count}</td>
                <td>{row.result_count}</td>
                <td>{row.last_searched}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ color: '#666' }}>{__('No search data yet.', 'headless-fuzzy-find')}</p>
      )}

      <h3>{__('Zero-Result Searches', 'headless-fuzzy-find')}</h3>
      {data && data.zero_results.length > 0 ? (
        <table className="widefat striped" style={{ marginBottom: '24px' }}>
          <thead>
            <tr>
              <th>{__('Query', 'headless-fuzzy-find')}</th>
              <th>{__('Searches', 'headless-fuzzy-find')}</th>
              <th>{__('Last Searched', 'headless-fuzzy-find')}</th>
            </tr>
          </thead>
          <tbody>
            {data.zero_results.map((row, i) => (
              <tr key={i}>
                <td>
                  <code>{row.query}</code>
                </td>
                <td>{row.search_count}</td>
                <td>{row.last_searched}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ color: '#666' }}>
          {__('No zero-result searches recorded.', 'headless-fuzzy-find')}
        </p>
      )}

      <Button
        variant="secondary"
        isDestructive
        onClick={handleClear}
        isBusy={clearing}
        style={{ marginBottom: '24px' }}
      >
        {clearing ? <Spinner /> : __('Clear Analytics', 'headless-fuzzy-find')}
      </Button>

      <h3>{__('Public Popular Searches Endpoint', 'headless-fuzzy-find')}</h3>
      <p style={{ color: '#666', marginTop: 0 }}>
        {__(
          'Configures GET /wp-json/headless-fuzzy-find/v1/popular-searches — returns trending search terms for storefront UIs.',
          'headless-fuzzy-find',
        )}
      </p>
      <TextareaControl
        label={__('Manual Overrides', 'headless-fuzzy-find')}
        help={__(
          'One search term per line. When set, these replace auto-tracked searches in the public endpoint.',
          'headless-fuzzy-find',
        )}
        value={settings.popular_searches_override}
        onChange={(v: string) => update('popular_searches_override', v)}
        rows={5}
      />
      <NumberControl
        label={__('Max Results', 'headless-fuzzy-find')}
        help={__('Maximum number of popular searches returned. Default: 12', 'headless-fuzzy-find')}
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
