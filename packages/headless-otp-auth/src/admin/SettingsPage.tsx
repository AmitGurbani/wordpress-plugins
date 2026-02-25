import { useState, useEffect } from '@wordpress/element';
import { TabPanel, Button, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { DEFAULTS, TABS } from './types';
import type { Settings, TestOtpData } from './types';
import { OtpTab } from './tabs/OtpTab';
import { SecurityTab } from './tabs/SecurityTab';
import { AuthTab } from './tabs/AuthTab';
import { AdvancedTab } from './tabs/AdvancedTab';

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [testOtp, setTestOtp] = useState<TestOtpData | null>(null);

  useEffect(() => {
    apiFetch({ path: '/headless-otp-auth/v1/settings' })
      .then((data: any) => {
        setSettings({ ...DEFAULTS, ...data });
        setLoading(false);
      })
      .catch(() => {
        setError(__('Failed to load settings.', 'headless-otp-auth'));
        setLoading(false);
      });
  }, []);

  const update = (key: keyof Settings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const fetchTestOtp = () => {
    apiFetch({ path: '/headless-otp-auth/v1/otp/test-otp' })
      .then((data: any) => setTestOtp(data))
      .catch(() => setTestOtp(null));
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      await apiFetch({
        path: '/headless-otp-auth/v1/settings',
        method: 'POST',
        data: settings,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError(__('Failed to save settings.', 'headless-otp-auth'));
    }
    setSaving(false);
  };

  if (loading) return <Spinner />;

  const tabProps = { settings, update };

  return (
    <div className="wrap">
      <h1>{__('Headless OTP Auth Settings', 'headless-otp-auth')}</h1>

      <TabPanel tabs={TABS}>
        {(tab) => {
          switch (tab.name) {
            case 'otp':
              return <OtpTab {...tabProps} testOtp={testOtp} fetchTestOtp={fetchTestOtp} />;
            case 'security':
              return <SecurityTab {...tabProps} />;
            case 'auth':
              return <AuthTab {...tabProps} />;
            case 'advanced':
              return <AdvancedTab {...tabProps} />;
            default:
              return null;
          }
        }}
      </TabPanel>

      <div style={{ marginTop: '16px' }}>
        <Button variant="primary" onClick={save} isBusy={saving}>
          {saving ? <Spinner /> : __('Save Settings', 'headless-otp-auth')}
        </Button>
        {saved && (
          <span style={{ marginLeft: '12px', color: '#00a32a' }}>
            {__('Settings saved.', 'headless-otp-auth')}
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
