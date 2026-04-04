import apiFetch from '@wordpress/api-fetch';
import { Button, Spinner } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { FormSection } from 'admin-ui';
import type { IndexStatus } from '../types';

export function IndexTab() {
  const [status, setStatus] = useState<IndexStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');

  const fetchStatus = () => {
    apiFetch({ path: '/headless-fuzzyfind/v1/index/status' })
      .then((data: any) => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleReindex = async () => {
    setRebuilding(true);
    setMessage('');
    try {
      const result: any = await apiFetch({
        path: '/headless-fuzzyfind/v1/index/rebuild',
        method: 'POST',
      });
      setMessage(result.message || __('Reindex started.', 'headless-fuzzyfind'));
      setTimeout(fetchStatus, 2000);
    } catch {
      setMessage(__('Failed to trigger reindex.', 'headless-fuzzyfind'));
    }
    setRebuilding(false);
  };

  const handleDelete = async () => {
    if (
      !confirm(
        __(
          'Are you sure? This will clear the search index. Search will be unavailable until you rebuild.',
          'headless-fuzzyfind',
        ),
      )
    ) {
      return;
    }
    setDeleting(true);
    setMessage('');
    try {
      const result: any = await apiFetch({
        path: '/headless-fuzzyfind/v1/index/delete',
        method: 'POST',
      });
      setMessage(result.message || __('Index cleared.', 'headless-fuzzyfind'));
      fetchStatus();
    } catch {
      setMessage(__('Failed to delete index.', 'headless-fuzzyfind'));
    }
    setDeleting(false);
  };

  if (loading) return <Spinner />;

  const percentage =
    status && status.total_products > 0
      ? Math.round((status.total_indexed / status.total_products) * 100)
      : 0;

  const lastIndexedDate =
    status && status.last_indexed
      ? new Date(status.last_indexed * 1000).toLocaleString()
      : __('Never', 'headless-fuzzyfind');

  return (
    <FormSection>
      <h3>{__('Index Status', 'headless-fuzzyfind')}</h3>

      {status && (
        <table className="widefat" style={{ marginBottom: '16px' }}>
          <tbody>
            <tr>
              <td>
                <strong>{__('Total Products', 'headless-fuzzyfind')}</strong>
              </td>
              <td>{status.total_products}</td>
            </tr>
            <tr>
              <td>
                <strong>{__('Products Indexed', 'headless-fuzzyfind')}</strong>
              </td>
              <td>
                {status.total_indexed} ({percentage}%)
              </td>
            </tr>
            <tr>
              <td>
                <strong>{__('Last Indexed', 'headless-fuzzyfind')}</strong>
              </td>
              <td>{lastIndexedDate}</td>
            </tr>
            <tr>
              <td>
                <strong>{__('Status', 'headless-fuzzyfind')}</strong>
              </td>
              <td>
                {status.is_indexing
                  ? __('Indexing in progress...', 'headless-fuzzyfind')
                  : __('Idle', 'headless-fuzzyfind')}
              </td>
            </tr>
          </tbody>
        </table>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Button
          variant="secondary"
          onClick={handleReindex}
          isBusy={rebuilding}
          disabled={rebuilding || deleting || (status?.is_indexing ?? false)}
        >
          {rebuilding ? <Spinner /> : __('Rebuild Index', 'headless-fuzzyfind')}
        </Button>
        <Button
          isDestructive
          onClick={handleDelete}
          isBusy={deleting}
          disabled={rebuilding || deleting || (status?.is_indexing ?? false)}
        >
          {deleting ? <Spinner /> : __('Delete Index', 'headless-fuzzyfind')}
        </Button>
        {message && <span style={{ color: '#00a32a' }}>{message}</span>}
      </div>
    </FormSection>
  );
}
