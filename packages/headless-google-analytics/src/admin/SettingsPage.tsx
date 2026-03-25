import { useState, useEffect } from '@wordpress/element';
import { TabPanel, Button, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { DEFAULTS, TABS } from './types';
import type { Settings } from './types';
import { GeneralTab } from './tabs/GeneralTab';
import { DiagnosticsTab } from './tabs/DiagnosticsTab';

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch({ path: '/headless-google-analytics/v1/settings' })
      .then((data: any) => {
        setSettings({ ...DEFAULTS, ...data });
        setLoading(false);
      })
      .catch(() => {
        setError(__('Failed to load settings.', 'headless-google-analytics'));
        setLoading(false);
      });
  }, []);

  const update = (key: keyof Settings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      await apiFetch({
        path: '/headless-google-analytics/v1/settings',
        method: 'POST',
        data: settings,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError(__('Failed to save settings.', 'headless-google-analytics'));
    }
    setSaving(false);
  };

  if (loading) return <Spinner />;

  const tabProps = { settings, update };

  return (
    <div className="wrap">
      <h1>{__('Headless Google Analytics Settings', 'headless-google-analytics')}</h1>

      <TabPanel tabs={TABS}>
        {(tab) => {
          switch (tab.name) {
            case 'general':
              return <GeneralTab {...tabProps} />;
            case 'diagnostics':
              return <DiagnosticsTab />;
            default:
              return null;
          }
        }}
      </TabPanel>

      <div style={{ marginTop: '16px' }}>
        <Button variant="primary" onClick={save} isBusy={saving}>
          {saving ? <Spinner /> : __('Save Settings', 'headless-google-analytics')}
        </Button>
        {saved && (
          <span style={{ marginLeft: '12px', color: '#00a32a' }}>
            {__('Settings saved.', 'headless-google-analytics')}
          </span>
        )}
        {error && (
          <span style={{ marginLeft: '12px', color: '#d63638' }}>
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
