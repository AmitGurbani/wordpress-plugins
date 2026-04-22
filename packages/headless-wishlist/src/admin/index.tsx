import { createRoot } from '@wordpress/element';
import { AnalyticsPage } from './AnalyticsPage';

const rootElement = document.getElementById('headless-wishlist-admin-app');
if (rootElement) {
  createRoot(rootElement).render(<AnalyticsPage />);
}
