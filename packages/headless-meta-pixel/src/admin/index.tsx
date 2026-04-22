import { createRoot } from '@wordpress/element';
import { SettingsPage } from './SettingsPage';

const rootElement = document.getElementById('headless-meta-pixel-admin-app');
if (rootElement) {
  createRoot(rootElement).render(<SettingsPage />);
}
