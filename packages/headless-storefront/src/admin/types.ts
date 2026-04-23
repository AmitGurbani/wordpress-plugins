import { __ } from '@wordpress/i18n';
import type { TabProps as GenericTabProps } from 'admin-ui';

export interface SocialLink {
  platform: string;
  href: string;
  label: string;
}

export interface Settings {
  app_name: string;
  short_name: string;
  tagline: string;
  title_tagline: string;
  description: string;
  logo_url: string;
  font_family: string;
  contact: {
    phone: string;
    phone_href: string;
    email: string;
    whatsapp_number: string;
    whatsapp_label: string;
  };
  social: SocialLink[];
  cities: string[];
  trust_signals: string[];
  delivery_message: string;
  return_policy: string;
  delivery_badge: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  tokens: {
    section_gap: string;
    card_padding: string;
    card_radius: string;
    button_radius: string;
    image_radius: string;
    card_shadow: string;
    card_hover_shadow: string;
    hover_duration: string;
  };
  popular_searches_override: string[];
  popular_searches_max: number;
  frontend_url: string;
  revalidate_secret: string;
  _fallbacks?: {
    app_name: string;
    tagline: string;
    contact_email: string;
  };
}

export type TabProps = GenericTabProps<Settings>;

export interface SearchQuery {
  query: string;
  count: number;
  last_searched: string;
}

export const DEFAULTS: Settings = {
  app_name: '',
  short_name: '',
  tagline: '',
  title_tagline: '',
  description: '',
  logo_url: '',
  font_family: 'Inter',
  contact: {
    phone: '',
    phone_href: '',
    email: '',
    whatsapp_number: '',
    whatsapp_label: '',
  },
  social: [],
  cities: [],
  trust_signals: ['Genuine Products', 'Easy Returns', 'Secure Payment', 'Fast Delivery'],
  delivery_message: 'Delivery in 1\u20132 business days',
  return_policy:
    'Easy returns within 7 days of delivery. Items must be unused and in original packaging.',
  delivery_badge: '',
  colors: {
    primary: '#6366f1',
    secondary: '#64748b',
    accent: '#94a3b8',
  },
  tokens: {
    section_gap: '2rem',
    card_padding: '0.75rem',
    card_radius: '0.75rem',
    button_radius: '0.5rem',
    image_radius: '0.5rem',
    card_shadow: 'none',
    card_hover_shadow: '0 4px 12px oklch(0 0 0 / 0.1)',
    hover_duration: '150ms',
  },
  popular_searches_override: [],
  popular_searches_max: 12,
  frontend_url: '',
  revalidate_secret: '',
};

export const TABS = [
  { name: 'identity', title: __('Store Identity', 'headless-storefront') },
  { name: 'appearance', title: __('Appearance', 'headless-storefront') },
  { name: 'contact', title: __('Contact & Social', 'headless-storefront') },
  { name: 'footer', title: __('Footer Content', 'headless-storefront') },
  { name: 'product', title: __('Product Page', 'headless-storefront') },
  { name: 'searches', title: __('Popular Searches', 'headless-storefront') },
  { name: 'cache', title: __('Cache Settings', 'headless-storefront') },
];
