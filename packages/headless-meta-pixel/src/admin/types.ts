import { __ } from '@wordpress/i18n';

export interface Settings {
  pixel_id: string;
  access_token: string;
  test_event_code: string;
  currency: string;
  enable_view_content: boolean;
  enable_add_to_cart: boolean;
  enable_initiate_checkout: boolean;
  enable_purchase: boolean;
  enable_search: boolean;
  enable_capi: boolean;
}

export interface TabProps {
  settings: Settings;
  update: (key: keyof Settings, value: any) => void;
}

export const DEFAULTS: Settings = {
  pixel_id: '',
  access_token: '',
  test_event_code: '',
  currency: 'USD',
  enable_view_content: true,
  enable_add_to_cart: true,
  enable_initiate_checkout: true,
  enable_purchase: true,
  enable_search: true,
  enable_capi: true,
};

export const TABS = [
  { name: 'general', title: __('General', 'headless-meta-pixel') },
  { name: 'events', title: __('Events', 'headless-meta-pixel') },
  { name: 'diagnostics', title: __('Diagnostics', 'headless-meta-pixel') },
];
