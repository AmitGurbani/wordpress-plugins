import { __ } from '@wordpress/i18n';
import { SettingsShell, useSettings } from 'admin-ui';
import { GeneralTab } from './tabs/GeneralTab';
import type { Settings } from './types';
import { DEFAULTS, TABS } from './types';

export function SettingsPage() {
  const state = useSettings<Settings>({
    slug: 'headless-pos-sessions',
    textDomain: 'headless-pos-sessions',
    defaults: DEFAULTS,
  });

  return (
    <SettingsShell
      title={__('POS Sessions Settings', 'headless-pos-sessions')}
      textDomain="headless-pos-sessions"
      tabs={TABS}
      settingsState={state}
    >
      {(_tab, tabProps) => <GeneralTab {...tabProps} />}
    </SettingsShell>
  );
}
