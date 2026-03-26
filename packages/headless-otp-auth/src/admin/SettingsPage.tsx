import apiFetch from '@wordpress/api-fetch';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SettingsShell, useSettings } from 'admin-ui';
import { AdvancedTab } from './tabs/AdvancedTab';
import { AuthTab } from './tabs/AuthTab';
import { OtpTab } from './tabs/OtpTab';
import { SecurityTab } from './tabs/SecurityTab';
import type { Settings, TestOtpData } from './types';
import { DEFAULTS, TABS } from './types';

export function SettingsPage() {
  const state = useSettings<Settings>({
    slug: 'headless-otp-auth',
    textDomain: 'headless-otp-auth',
    defaults: DEFAULTS,
  });

  const [testOtp, setTestOtp] = useState<TestOtpData | null>(null);

  const fetchTestOtp = () => {
    apiFetch({ path: '/headless-otp-auth/v1/otp/test-otp' })
      .then((data: any) => setTestOtp(data))
      .catch(() => setTestOtp(null));
  };

  return (
    <SettingsShell
      title={__('Headless OTP Auth Settings', 'headless-otp-auth')}
      textDomain="headless-otp-auth"
      tabs={TABS}
      settingsState={state}
    >
      {(tab, tabProps) => {
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
    </SettingsShell>
  );
}
