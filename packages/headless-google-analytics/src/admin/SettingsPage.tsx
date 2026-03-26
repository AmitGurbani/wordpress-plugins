import { useSettings, SettingsShell } from 'admin-ui';
import { __ } from '@wordpress/i18n';
import { DEFAULTS, TABS } from './types';
import type { Settings } from './types';
import { GeneralTab } from './tabs/GeneralTab';
import { DiagnosticsTab } from './tabs/DiagnosticsTab';

export function SettingsPage() {
  const state = useSettings<Settings>({
    slug: 'headless-google-analytics',
    textDomain: 'headless-google-analytics',
    defaults: DEFAULTS,
  });

  return (
    <SettingsShell
      title={__('Headless Google Analytics Settings', 'headless-google-analytics')}
      textDomain="headless-google-analytics"
      tabs={TABS}
      settingsState={state}
    >
      {(tab, tabProps) => {
        switch (tab.name) {
          case 'general':
            return <GeneralTab {...tabProps} />;
          case 'diagnostics':
            return <DiagnosticsTab />;
          default:
            return null;
        }
      }}
    </SettingsShell>
  );
}
