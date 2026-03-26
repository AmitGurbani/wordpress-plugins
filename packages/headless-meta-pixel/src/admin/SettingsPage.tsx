import { __ } from '@wordpress/i18n';
import { SettingsShell, useSettings } from 'admin-ui';
import { DiagnosticsTab } from './tabs/DiagnosticsTab';
import { EventsTab } from './tabs/EventsTab';
import { GeneralTab } from './tabs/GeneralTab';
import type { Settings } from './types';
import { DEFAULTS, TABS } from './types';

export function SettingsPage() {
  const state = useSettings<Settings>({
    slug: 'headless-meta-pixel',
    textDomain: 'headless-meta-pixel',
    defaults: DEFAULTS,
  });

  return (
    <SettingsShell
      title={__('Headless Meta Pixel Settings', 'headless-meta-pixel')}
      textDomain="headless-meta-pixel"
      tabs={TABS}
      settingsState={state}
    >
      {(tab, tabProps) => {
        switch (tab.name) {
          case 'general':
            return <GeneralTab {...tabProps} />;
          case 'events':
            return <EventsTab {...tabProps} />;
          case 'diagnostics':
            return <DiagnosticsTab />;
          default:
            return null;
        }
      }}
    </SettingsShell>
  );
}
