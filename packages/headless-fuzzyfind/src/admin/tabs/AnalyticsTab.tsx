import apiFetch from '@wordpress/api-fetch';
import { Button, Spinner } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { AnalyticsData } from '../types';

export function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const fetchAnalytics = () => {
    apiFetch({ path: '/headless-fuzzyfind/v1/analytics' })
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
        path: '/headless-fuzzyfind/v1/analytics/clear',
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
    <div style={{ padding: '16px 0' }}>
      <h3>{__('Popular Searches', 'headless-fuzzyfind')}</h3>
      {data && data.popular.length > 0 ? (
        <table className="widefat striped" style={{ marginBottom: '24px' }}>
          <thead>
            <tr>
              <th>{__('Query', 'headless-fuzzyfind')}</th>
              <th>{__('Searches', 'headless-fuzzyfind')}</th>
              <th>{__('Results', 'headless-fuzzyfind')}</th>
              <th>{__('Last Searched', 'headless-fuzzyfind')}</th>
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
        <p style={{ color: '#666' }}>{__('No search data yet.', 'headless-fuzzyfind')}</p>
      )}

      <h3>{__('Zero-Result Searches', 'headless-fuzzyfind')}</h3>
      {data && data.zero_results.length > 0 ? (
        <table className="widefat striped" style={{ marginBottom: '24px' }}>
          <thead>
            <tr>
              <th>{__('Query', 'headless-fuzzyfind')}</th>
              <th>{__('Searches', 'headless-fuzzyfind')}</th>
              <th>{__('Last Searched', 'headless-fuzzyfind')}</th>
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
          {__('No zero-result searches recorded.', 'headless-fuzzyfind')}
        </p>
      )}

      <Button variant="secondary" isDestructive onClick={handleClear} isBusy={clearing}>
        {clearing ? <Spinner /> : __('Clear Analytics', 'headless-fuzzyfind')}
      </Button>
    </div>
  );
}
