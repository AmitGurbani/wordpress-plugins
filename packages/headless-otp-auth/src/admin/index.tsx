import { createRoot } from '@wordpress/element';
import { SettingsPage } from './SettingsPage';

const rootElement = document.getElementById('wpts-admin-app');
if (rootElement) {
  createRoot(rootElement).render(<SettingsPage />);
}
