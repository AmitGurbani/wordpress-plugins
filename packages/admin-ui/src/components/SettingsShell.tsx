import { Button, Spinner, TabPanel } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { SettingsShellProps } from '../types';

export function SettingsShell<S extends object>({
  title,
  textDomain,
  tabs,
  settingsState,
  children,
}: SettingsShellProps<S>) {
  const { settings, loading, saving, saved, error, update, save } = settingsState;

  if (loading) return <Spinner />;

  const tabProps = { settings, update };

  return (
    <div className="wrap">
      <h1>{title}</h1>

      <TabPanel tabs={tabs}>{(tab) => children(tab, tabProps)}</TabPanel>

      <div style={{ marginTop: '16px' }}>
        <Button variant="primary" onClick={save} isBusy={saving}>
          {saving ? <Spinner /> : __('Save Settings', textDomain)}
        </Button>
        {saved && (
          <span style={{ marginLeft: '12px', color: '#00a32a' }}>
            {__('Settings saved.', textDomain)}
          </span>
        )}
        {error && <span style={{ marginLeft: '12px', color: '#d63638' }}>{error}</span>}
      </div>
    </div>
  );
}
