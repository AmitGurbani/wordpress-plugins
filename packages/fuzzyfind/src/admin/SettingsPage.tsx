import { useState, useEffect } from '@wordpress/element';
import { TabPanel, Button, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { DEFAULTS, TABS } from './types';
import type { Settings } from './types';
import { WeightsTab } from './tabs/WeightsTab';
import { FeaturesTab } from './tabs/FeaturesTab';
import { IndexTab } from './tabs/IndexTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch({ path: '/fuzzyfind/v1/settings' })
      .then((data: any) => {
        setSettings({ ...DEFAULTS, ...data });
        setLoading(false);
      })
      .catch(() => {
        setError(__('Failed to load settings.', 'fuzzyfind'));
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
        path: '/fuzzyfind/v1/settings',
        method: 'POST',
        data: settings,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError(__('Failed to save settings.', 'fuzzyfind'));
    }
    setSaving(false);
  };

  if (loading) return <Spinner />;

  const tabProps = { settings, update };

  return (
    <div className="wrap">
      <h1>{__('FuzzyFind for WooCommerce', 'fuzzyfind')}</h1>

      <TabPanel tabs={TABS}>
        {(tab) => {
          switch (tab.name) {
            case 'weights':
              return <WeightsTab {...tabProps} />;
            case 'features':
              return <FeaturesTab {...tabProps} />;
            case 'index':
              return <IndexTab />;
            case 'analytics':
              return <AnalyticsTab />;
            default:
              return null;
          }
        }}
      </TabPanel>

      <div style={{ marginTop: '16px' }}>
        <Button variant="primary" onClick={save} isBusy={saving}>
          {saving ? <Spinner /> : __('Save Settings', 'fuzzyfind')}
        </Button>
        {saved && (
          <span style={{ marginLeft: '12px', color: '#00a32a' }}>
            {__('Settings saved.', 'fuzzyfind')}
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
