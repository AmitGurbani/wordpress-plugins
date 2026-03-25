import { __ } from '@wordpress/i18n';

export interface Settings {
  project_id: string;
  enable_identify: boolean;
}

export interface TabProps {
  settings: Settings;
  update: (key: keyof Settings, value: any) => void;
}

export const DEFAULTS: Settings = {
  project_id: '',
  enable_identify: true,
};

export const TABS = [
  { name: 'general', title: __('General', 'headless-clarity') },
  { name: 'diagnostics', title: __('Diagnostics', 'headless-clarity') },
];
