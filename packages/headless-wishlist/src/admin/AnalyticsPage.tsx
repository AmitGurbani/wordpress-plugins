import apiFetch from '@wordpress/api-fetch';
import { Card, CardBody, CardHeader, Spinner } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { FormSection } from 'admin-ui';
import type { AnalyticsData } from './types';

export function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch({ path: '/headless-wishlist/v1/analytics/popular' })
      .then((result: any) => {
        setData(result);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="wrap">
        <h1>{__('Wishlist Analytics', 'headless-wishlist')}</h1>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="wrap">
      <h1>{__('Wishlist Analytics', 'headless-wishlist')}</h1>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <Card size="small">
          <CardHeader>
            <strong>{__('Users with Wishlists', 'headless-wishlist')}</strong>
          </CardHeader>
          <CardBody>
            <span style={{ fontSize: '24px', fontWeight: 600 }}>{data?.total_users ?? 0}</span>
          </CardBody>
        </Card>
        <Card size="small">
          <CardHeader>
            <strong>{__('Total Wishlisted Items', 'headless-wishlist')}</strong>
          </CardHeader>
          <CardBody>
            <span style={{ fontSize: '24px', fontWeight: 600 }}>{data?.total_items ?? 0}</span>
          </CardBody>
        </Card>
      </div>

      <FormSection narrow={false}>
        <h3>{__('Most Wishlisted Products', 'headless-wishlist')}</h3>
        {data && data.popular.length > 0 ? (
          <table className="widefat striped">
            <thead>
              <tr>
                <th>#</th>
                <th>{__('Product', 'headless-wishlist')}</th>
                <th>{__('Wishlisted By', 'headless-wishlist')}</th>
              </tr>
            </thead>
            <tbody>
              {data.popular.map((row, i) => (
                <tr key={row.product_id}>
                  <td>{i + 1}</td>
                  <td>{row.name}</td>
                  <td>
                    {row.count} {row.count === 1
                      ? __('user', 'headless-wishlist')
                      : __('users', 'headless-wishlist')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#666' }}>
            {__('No wishlist data yet. Products will appear here once customers start adding items to their wishlists.', 'headless-wishlist')}
          </p>
        )}
      </FormSection>
    </div>
  );
}
