import { __ } from '@wordpress/i18n';
import { SettingsShell, useSettings } from 'admin-ui';
import { AppearanceTab } from './tabs/AppearanceTab';
import { CacheSettingsTab } from './tabs/CacheSettingsTab';
import { ContactSocialTab } from './tabs/ContactSocialTab';
import { FooterContentTab } from './tabs/FooterContentTab';
import { OperationsTab } from './tabs/OperationsTab';
import { ProductPageTab } from './tabs/ProductPageTab';
import { StoreIdentityTab } from './tabs/StoreIdentityTab';
import { TemplateTab } from './tabs/TemplateTab';
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
      title={__('Headless Storefront', 'headless-storefront')}
      textDomain="headless-storefront"
      tabs={TABS}
      settingsState={state}
    >
      {(tab, tabProps) => {
        switch (tab.name) {
          case 'identity':
            return <StoreIdentityTab {...tabProps} />;
          case 'appearance':
            return <AppearanceTab {...tabProps} />;
          case 'contact':
            return <ContactSocialTab {...tabProps} />;
          case 'footer':
            return <FooterContentTab {...tabProps} />;
          case 'product':
            return <ProductPageTab {...tabProps} />;
          case 'operations':
            return <OperationsTab {...tabProps} />;
          case 'template':
            return <TemplateTab {...tabProps} />;
          case 'cache':
            return <CacheSettingsTab {...tabProps} />;
          default:
            return null;
        }
      }}
    </SettingsShell>
  );
}
