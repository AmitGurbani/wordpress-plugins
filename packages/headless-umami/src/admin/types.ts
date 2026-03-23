import { __ } from '@wordpress/i18n';

export interface Settings {
  umami_url: string;
  website_id: string;
  enable_purchase: boolean;
}

export interface TabProps {
  settings: Settings;
  update: (key: keyof Settings, value: any) => void;
}

export const DEFAULTS: Settings = {
  umami_url: '',
  website_id: '',
  enable_purchase: true,
};

export const TABS = [
  { name: 'general', title: __('General', 'headless-umami') },
  { name: 'diagnostics', title: __('Diagnostics', 'headless-umami') },
];
