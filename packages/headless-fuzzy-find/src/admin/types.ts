import { __ } from '@wordpress/i18n';
import type { TabProps as GenericTabProps } from 'admin-ui';

export interface Settings {
  weight_title: number;
  weight_sku: number;
  weight_content: number;
  fuzzy_enabled: boolean;
  autocomplete_enabled: boolean;
  analytics_enabled: boolean;
  min_query_length: number;
  autocomplete_limit: number;
  did_you_mean_threshold: number;
  synonyms: string;
}

export type TabProps = GenericTabProps<Settings>;

export interface IndexStatus {
  total_products: number;
  total_indexed: number;
  last_indexed: number | null;
  is_indexing: boolean;
}

export interface AnalyticsData {
  popular: Array<{
    query: string;
    search_count: number;
    result_count: number;
    last_searched: string;
  }>;
  zero_results: Array<{ query: string; search_count: number; last_searched: string }>;
}

export const DEFAULTS: Settings = {
  weight_title: 10,
  weight_sku: 8,
  weight_content: 2,
  fuzzy_enabled: true,
  autocomplete_enabled: true,
  analytics_enabled: true,
  min_query_length: 2,
  autocomplete_limit: 8,
  did_you_mean_threshold: 3,
  synonyms: '',
};

export const TABS = [
  { name: 'weights', title: __('Weights', 'headless-fuzzy-find') },
  { name: 'features', title: __('Features', 'headless-fuzzy-find') },
  { name: 'index', title: __('Index', 'headless-fuzzy-find') },
  { name: 'analytics', title: __('Analytics', 'headless-fuzzy-find') },
];
