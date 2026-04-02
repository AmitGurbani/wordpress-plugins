import { __ } from '@wordpress/i18n';
import type { TabProps as GenericTabProps } from 'admin-ui';

export interface Settings {
  retention_days: number;
  max_open_sessions: number;
}

export type TabProps = GenericTabProps<Settings>;

export const DEFAULTS: Settings = {
  retention_days: 90,
  max_open_sessions: 10,
};

export const TABS = [
  { name: 'general', title: __('General', 'headless-pos-sessions') },
];
