import { __ } from '@wordpress/i18n';
import { SettingsShell, useSettings } from 'admin-ui';
import { CacheSettingsTab } from './tabs/CacheSettingsTab';
import { ColorsTab } from './tabs/ColorsTab';
import { ContactSocialTab } from './tabs/ContactSocialTab';
import { DesignTokensTab } from './tabs/DesignTokensTab';
import { FooterContentTab } from './tabs/FooterContentTab';
import { PopularSearchesTab } from './tabs/PopularSearchesTab';
import { ProductPageTab } from './tabs/ProductPageTab';
import { StoreIdentityTab } from './tabs/StoreIdentityTab';
import type { Settings } from './types';
import { DEFAULTS, TABS } from './types';

export function SettingsPage() {
  const state = useSettings<Settings>({
    slug: 'headless-storefront',
    textDomain: 'headless-storefront',
    defaults: DEFAULTS,
  });

  return (
    <SettingsShell
      title={__('Headless Branding', 'headless-storefront')}
      textDomain="headless-storefront"
      tabs={TABS}
      settingsState={state}
    >
      {(tab, tabProps) => {
        switch (tab.name) {
          case 'identity':
            return <StoreIdentityTab {...tabProps} />;
          case 'contact':
            return <ContactSocialTab {...tabProps} />;
          case 'footer':
            return <FooterContentTab {...tabProps} />;
          case 'product':
            return <ProductPageTab {...tabProps} />;
          case 'colors':
            return <ColorsTab {...tabProps} />;
          case 'tokens':
            return <DesignTokensTab {...tabProps} />;
          case 'searches':
            return <PopularSearchesTab {...tabProps} />;
          case 'cache':
            return <CacheSettingsTab {...tabProps} />;
          default:
            return null;
        }
      }}
    </SettingsShell>
  );
}
