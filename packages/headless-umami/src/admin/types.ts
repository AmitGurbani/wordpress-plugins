import { __ } from '@wordpress/i18n';
import type { TabProps as GenericTabProps } from 'admin-ui';

export interface Settings {
  umami_url: string;
  website_id: string;
  enable_purchase: boolean;
}

export type TabProps = GenericTabProps<Settings>;

export const DEFAULTS: Settings = {
  umami_url: '',
  website_id: '',
  enable_purchase: true,
};

export const TABS = [
  { name: 'general', title: __('General', 'headless-umami') },
  { name: 'diagnostics', title: __('Diagnostics', 'headless-umami') },
];
