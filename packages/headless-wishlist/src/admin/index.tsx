import { createRoot } from '@wordpress/element';
import { AnalyticsPage } from './AnalyticsPage';

const rootElement = document.getElementById('wpts-admin-app');
if (rootElement) {
  createRoot(rootElement).render(<AnalyticsPage />);
}
