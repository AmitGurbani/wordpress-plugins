import { __ } from '@wordpress/i18n';

export interface Settings {
  measurement_id: string;
  api_secret: string;
  currency: string;
  enable_view_item: boolean;
  enable_add_to_cart: boolean;
  enable_begin_checkout: boolean;
  enable_purchase: boolean;
  enable_search: boolean;
}

export interface TabProps {
  settings: Settings;
  update: (key: keyof Settings, value: any) => void;
}

export const DEFAULTS: Settings = {
  measurement_id: '',
  api_secret: '',
  currency: 'USD',
  enable_view_item: true,
  enable_add_to_cart: true,
  enable_begin_checkout: true,
  enable_purchase: true,
  enable_search: true,
};

export const TABS = [
  { name: 'general', title: __('General', 'headless-google-analytics') },
  { name: 'events', title: __('Events', 'headless-google-analytics') },
  { name: 'diagnostics', title: __('Diagnostics', 'headless-google-analytics') },
];
