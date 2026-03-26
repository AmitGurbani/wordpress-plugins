import { __ } from '@wordpress/i18n';
import type { TabProps as GenericTabProps } from 'admin-ui';

export interface Settings {
  project_id: string;
  enable_identify: boolean;
}

export type TabProps = GenericTabProps<Settings>;

export const DEFAULTS: Settings = {
  project_id: '',
  enable_identify: true,
};

export const TABS = [
  { name: 'general', title: __('General', 'headless-clarity') },
  { name: 'diagnostics', title: __('Diagnostics', 'headless-clarity') },
];
