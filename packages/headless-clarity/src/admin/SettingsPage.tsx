import { __ } from '@wordpress/i18n';
import { SettingsShell, useSettings } from 'admin-ui';
import { DiagnosticsTab } from './tabs/DiagnosticsTab';
import { GeneralTab } from './tabs/GeneralTab';
import type { Settings } from './types';
import { DEFAULTS, TABS } from './types';

export function SettingsPage() {
  const state = useSettings<Settings>({
    slug: 'headless-clarity',
    textDomain: 'headless-clarity',
    defaults: DEFAULTS,
  });

  return (
    <SettingsShell
      title={__('Headless Clarity Settings', 'headless-clarity')}
      textDomain="headless-clarity"
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
