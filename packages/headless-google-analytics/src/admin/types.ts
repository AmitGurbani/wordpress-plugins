import { __ } from '@wordpress/i18n';

export interface Settings {
  measurement_id: string;
  api_secret: string;
  currency: string;
  enable_purchase: boolean;
}

export interface TabProps {
  settings: Settings;
  update: (key: keyof Settings, value: any) => void;
}

export const DEFAULTS: Settings = {
  measurement_id: '',
  api_secret: '',
  currency: 'USD',
  enable_purchase: true,
};

export const TABS = [
  { name: 'general', title: __('General', 'headless-google-analytics') },
  { name: 'diagnostics', title: __('Diagnostics', 'headless-google-analytics') },
];
