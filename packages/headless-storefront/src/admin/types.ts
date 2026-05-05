import { __ } from '@wordpress/i18n';
import type { TabProps as GenericTabProps } from 'admin-ui';

export interface SocialLink {
  platform: string;
  href: string;
  label: string;
}

export interface BakeryOccasion {
  id: string;
  label: string;
}

export interface TemplateConfig {
  bakery: {
    occasions: BakeryOccasion[];
    eggless_default: boolean;
  };
  quickcommerce: {
    eta_band_minutes: { min: number; max: number };
    cod_enabled: boolean;
  };
  fooddelivery: {
    veg_only: boolean;
    jain_filter_enabled: boolean;
  };
  ecommerce: {
    returns_window_days: number;
    exchange_enabled: boolean;
  };
}

export type TemplateName =
  | ''
  | 'kirana'
  | 'megamart'
  | 'bakery'
  | 'quickcommerce'
  | 'ecommerce'
  | 'fooddelivery';

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
  hours_text: string;
  delivery_area_text: string;
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
  frontend_url: string;
  revalidate_secret: string;
  // v1.8: merchant policy + identity additions
  fssai_license: string;
  estd_line: string;
  owner_name: string;
  // mov / delivery_fee surface as strings in the form so an empty input
  // means "unset" (vs. the legitimate value 0). Coerced server-side.
  mov: number | '';
  delivery_fee: number | '';
  delivery_areas: string[];
  // v1.8: template selector + namespaced per-vertical config
  template: TemplateName;
  template_config: TemplateConfig;
  _fallbacks?: {
    app_name: string;
    tagline: string;
    contact_email: string;
  };
  _last_revalidate_at?: string | null;
}

export type TabProps = GenericTabProps<Settings>;

export const DEFAULT_TEMPLATE_CONFIG: TemplateConfig = {
  bakery: {
    occasions: [],
    eggless_default: false,
  },
  quickcommerce: {
    eta_band_minutes: { min: 0, max: 0 },
    cod_enabled: false,
  },
  fooddelivery: {
    veg_only: false,
    jain_filter_enabled: false,
  },
  ecommerce: {
    returns_window_days: 0,
    exchange_enabled: false,
  },
};

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
  delivery_message: 'Delivery in 1–2 business days',
  return_policy:
    'Easy returns within 7 days of delivery. Items must be unused and in original packaging.',
  delivery_badge: '',
  hours_text: '',
  delivery_area_text: '',
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
  frontend_url: '',
  revalidate_secret: '',
  fssai_license: '',
  estd_line: '',
  owner_name: '',
  mov: '',
  delivery_fee: '',
  delivery_areas: [],
  template: '',
  template_config: DEFAULT_TEMPLATE_CONFIG,
};

export const TABS = [
  { name: 'identity', title: __('Store Identity', 'headless-storefront') },
  { name: 'appearance', title: __('Appearance', 'headless-storefront') },
  { name: 'contact', title: __('Contact & Social', 'headless-storefront') },
  { name: 'footer', title: __('Footer Content', 'headless-storefront') },
  { name: 'product', title: __('Product Page', 'headless-storefront') },
  { name: 'operations', title: __('Operations', 'headless-storefront') },
  { name: 'template', title: __('Template', 'headless-storefront') },
  { name: 'cache', title: __('Cache Settings', 'headless-storefront') },
];
