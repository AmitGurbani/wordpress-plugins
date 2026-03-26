import { __ } from '@wordpress/i18n';
import type { TabProps as GenericTabProps } from 'admin-ui';

export interface Settings {
  measurement_id: string;
  api_secret: string;
  currency: string;
  enable_purchase: boolean;
}

export type TabProps = GenericTabProps<Settings>;

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
