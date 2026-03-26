import { useSettings, SettingsShell } from 'admin-ui';
import { __ } from '@wordpress/i18n';
import { DEFAULTS, TABS } from './types';
import type { Settings } from './types';
import { WeightsTab } from './tabs/WeightsTab';
import { FeaturesTab } from './tabs/FeaturesTab';
import { IndexTab } from './tabs/IndexTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';

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
