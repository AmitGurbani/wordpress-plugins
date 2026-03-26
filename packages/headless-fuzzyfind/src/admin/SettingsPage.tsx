import { __ } from '@wordpress/i18n';
import { SettingsShell, useSettings } from 'admin-ui';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import { FeaturesTab } from './tabs/FeaturesTab';
import { IndexTab } from './tabs/IndexTab';
import { WeightsTab } from './tabs/WeightsTab';
import type { Settings } from './types';
import { DEFAULTS, TABS } from './types';

export function SettingsPage() {
  const state = useSettings<Settings>({
    slug: 'headless-fuzzyfind',
    textDomain: 'headless-fuzzyfind',
    defaults: DEFAULTS,
  });

  return (
    <SettingsShell
      title={__('Headless FuzzyFind', 'headless-fuzzyfind')}
      textDomain="headless-fuzzyfind"
      tabs={TABS}
      settingsState={state}
    >
      {(tab, tabProps) => {
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
    </SettingsShell>
  );
}
