import { useState, useEffect } from '@wordpress/element';
import { Button, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import type { AnalyticsData } from '../types';

export function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const fetchAnalytics = () => {
    apiFetch({ path: '/fuzzyfind/v1/analytics' })
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
        path: '/fuzzyfind/v1/analytics/clear',
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
      <h3>{__('Popular Searches', 'fuzzyfind')}</h3>
      {data && data.popular.length > 0 ? (
        <table className="widefat striped" style={{ marginBottom: '24px' }}>
          <thead>
            <tr>
              <th>{__('Query', 'fuzzyfind')}</th>
              <th>{__('Searches', 'fuzzyfind')}</th>
              <th>{__('Results', 'fuzzyfind')}</th>
              <th>{__('Last Searched', 'fuzzyfind')}</th>
            </tr>
          </thead>
          <tbody>
            {data.popular.map((row, i) => (
              <tr key={i}>
                <td><code>{row.query}</code></td>
                <td>{row.search_count}</td>
                <td>{row.result_count}</td>
                <td>{row.last_searched}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ color: '#666' }}>{__('No search data yet.', 'fuzzyfind')}</p>
      )}

      <h3>{__('Zero-Result Searches', 'fuzzyfind')}</h3>
      {data && data.zero_results.length > 0 ? (
        <table className="widefat striped" style={{ marginBottom: '24px' }}>
          <thead>
            <tr>
              <th>{__('Query', 'fuzzyfind')}</th>
              <th>{__('Searches', 'fuzzyfind')}</th>
              <th>{__('Last Searched', 'fuzzyfind')}</th>
            </tr>
          </thead>
          <tbody>
            {data.zero_results.map((row, i) => (
              <tr key={i}>
                <td><code>{row.query}</code></td>
                <td>{row.search_count}</td>
                <td>{row.last_searched}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ color: '#666' }}>{__('No zero-result searches recorded.', 'fuzzyfind')}</p>
      )}

      <Button
        variant="secondary"
        isDestructive
        onClick={handleClear}
        isBusy={clearing}
      >
        {clearing ? <Spinner /> : __('Clear Analytics', 'fuzzyfind')}
      </Button>
    </div>
  );
}
