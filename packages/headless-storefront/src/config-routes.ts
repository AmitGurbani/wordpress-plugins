/**
 * Headless Storefront Config Routes
 *
 * Public /config endpoint for the frontend, admin /settings endpoints,
 * and cache invalidation webhook on option update.
 */

import { Action, RestRoute } from '@amitgurbani/wpts';

class ConfigRoutes {
  // ── GET /config (public) ───────────────────────────────────────────

  @RestRoute('/config', { method: 'GET', public: true })
  getConfig(_request: any): any {
    const config: any = getOption('headless_storefront_config', []);

    // ── Contact with WP/WC fallbacks ──
    const contact: any = config.contact ?? {};
    const contactPhone: string = sanitizeTextField(contact.phone ?? '');
    const contactPhoneHref: string = sanitizeTextField(contact.phone_href ?? '');
    const rawEmail: string = sanitizeTextField(contact.email ?? '');
    const contactEmail: string = rawEmail
      ? rawEmail
      : sanitizeTextField(getOption('woocommerce_email_from_address', ''));
    const whatsappNumber: string = sanitizeTextField(contact.whatsapp_number ?? '');
    const whatsappLabel: string = sanitizeTextField(contact.whatsapp_label ?? '');
    const whatsapp: any =
      whatsappNumber || whatsappLabel ? { number: whatsappNumber, label: whatsappLabel } : null;

    // ── Social ──
    const rawSocial: any = config.social ?? [];
    const social: any[] = [];
    if (isArray(rawSocial)) {
      for (const item of rawSocial) {
        if (item.platform && item.href && item.label) {
          social.push({
            platform: sanitizeTextField(item.platform),
            href: escUrl(item.href),
            label: sanitizeTextField(item.label),
          });
        }
      }
    }

    // ── Popular searches ──
    const overrides: any = config.popular_searches_override ?? [];
    const maxResults: number = intval(config.popular_searches_max ?? 12);
    let popularSearches: any[];

    if (isArray(overrides) && !empty(overrides)) {
      popularSearches = arrayMap('sanitize_text_field', overrides);
    } else {
      const table: string = `${wpdb.prefix}headless_search_queries`;
      const rows: any[] =
        wpdb.getResults(
          wpdb.prepare('SELECT `query` FROM %i ORDER BY count DESC LIMIT %d', table, maxResults),
        ) ?? [];
      popularSearches = wpListPluck(rows, 'query');
    }

    // ── Colors (empty → null for optional) ──
    const colors: any = config.colors ?? {};
    const primaryColor: string = sanitizeTextField(colors.primary ?? '#6366f1');
    const secondaryRaw: string = sanitizeTextField(colors.secondary ?? '');
    const accentRaw: string = sanitizeTextField(colors.accent ?? '');

    // ── Tokens ──
    const tokens: any = config.tokens ?? {};

    // ── App name / tagline with WP fallbacks ──
    const rawAppName: string = sanitizeTextField(config.app_name ?? '');
    const appName: string = rawAppName ? rawAppName : sanitizeTextField(getOption('blogname', ''));
    const rawShortName: string = sanitizeTextField(config.short_name ?? '');
    const shortName: string = rawShortName ? rawShortName : appName;
    const rawTagline: string = sanitizeTextField(config.tagline ?? '');
    const tagline: string = rawTagline
      ? rawTagline
      : sanitizeTextField(getOption('blogdescription', ''));

    // ── Trust signals ──
    const rawTrustSignals: any = config.trust_signals ?? [];
    const defaultTrustSignals: string[] = [
      'Genuine Products',
      'Easy Returns',
      'Secure Payment',
      'Fast Delivery',
    ];
    const trustSignals: any =
      isArray(rawTrustSignals) && !empty(rawTrustSignals)
        ? arrayMap('sanitize_text_field', rawTrustSignals)
        : defaultTrustSignals;

    // ── Cities ──
    const rawCities: any = config.cities ?? [];
    const cities: any = isArray(rawCities) ? arrayMap('sanitize_text_field', rawCities) : [];

    // ── Logo URL (empty → null) ──
    const rawLogoUrl: string = escUrl(config.logo_url ?? '');

    return restEnsureResponse({
      app_name: appName,
      short_name: shortName,
      tagline: tagline,
      title_tagline: sanitizeTextField(config.title_tagline ?? ''),
      description: sanitizeTextareaField(config.description ?? ''),
      contact: {
        phone: contactPhone,
        phone_href: contactPhoneHref,
        email: contactEmail,
        whatsapp: whatsapp,
      },
      social: social,
      popular_searches: popularSearches,
      cities: cities,
      trust_signals: trustSignals,
      delivery_message: sanitizeTextField(
        config.delivery_message ?? 'Delivery in 1\u20132 business days',
      ),
      return_policy: sanitizeTextareaField(
        config.return_policy ??
          'Easy returns within 7 days of delivery. Items must be unused and in original packaging.',
      ),
      delivery_badge: sanitizeTextField(config.delivery_badge ?? ''),
      colors: {
        primary: primaryColor,
        secondary: secondaryRaw ? secondaryRaw : null,
        accent: accentRaw ? accentRaw : null,
      },
      tokens: {
        section_gap: sanitizeTextField(tokens.section_gap ?? '2rem'),
        card_padding: sanitizeTextField(tokens.card_padding ?? '0.75rem'),
        card_radius: sanitizeTextField(tokens.card_radius ?? '0.75rem'),
        button_radius: sanitizeTextField(tokens.button_radius ?? '0.5rem'),
        image_radius: sanitizeTextField(tokens.image_radius ?? '0.5rem'),
        card_shadow: sanitizeTextField(tokens.card_shadow ?? 'none'),
        card_hover_shadow: sanitizeTextField(
          tokens.card_hover_shadow ?? '0 4px 12px oklch(0 0 0 / 0.1)',
        ),
        hover_duration: sanitizeTextField(tokens.hover_duration ?? '150ms'),
      },
      logo_url: rawLogoUrl ? rawLogoUrl : null,
      font_family: sanitizeTextField(config.font_family ?? 'Inter'),
    });
  }

  // ── GET /settings (admin) ──────────────────────────────────────────

  @RestRoute('/settings', { method: 'GET', capability: 'manage_options' })
  getSettings(_request: any): any {
    const config: any = getOption('headless_storefront_config', []);

    const contact: any = config.contact ?? {};
    const colors: any = config.colors ?? {};
    const tokens: any = config.tokens ?? {};

    return restEnsureResponse({
      app_name: config.app_name ?? '',
      short_name: config.short_name ?? '',
      tagline: config.tagline ?? '',
      title_tagline: config.title_tagline ?? '',
      description: config.description ?? '',
      logo_url: config.logo_url ?? '',
      font_family: config.font_family ?? 'Inter',
      contact: {
        phone: contact.phone ?? '',
        phone_href: contact.phone_href ?? '',
        email: contact.email ?? '',
        whatsapp_number: contact.whatsapp_number ?? '',
        whatsapp_label: contact.whatsapp_label ?? '',
      },
      social: isArray(config.social ?? []) ? config.social : [],
      cities: isArray(config.cities ?? []) ? config.cities : [],
      trust_signals: isArray(config.trust_signals ?? [])
        ? config.trust_signals
        : ['Genuine Products', 'Easy Returns', 'Secure Payment', 'Fast Delivery'],
      delivery_message: config.delivery_message ?? 'Delivery in 1\u20132 business days',
      return_policy:
        config.return_policy ??
        'Easy returns within 7 days of delivery. Items must be unused and in original packaging.',
      delivery_badge: config.delivery_badge ?? '',
      colors: {
        primary: colors.primary ?? '#6366f1',
        secondary: colors.secondary ?? '',
        accent: colors.accent ?? '',
      },
      tokens: {
        section_gap: tokens.section_gap ?? '2rem',
        card_padding: tokens.card_padding ?? '0.75rem',
        card_radius: tokens.card_radius ?? '0.75rem',
        button_radius: tokens.button_radius ?? '0.5rem',
        image_radius: tokens.image_radius ?? '0.5rem',
        card_shadow: tokens.card_shadow ?? 'none',
        card_hover_shadow: tokens.card_hover_shadow ?? '0 4px 12px oklch(0 0 0 / 0.1)',
        hover_duration: tokens.hover_duration ?? '150ms',
      },
      popular_searches_override: isArray(config.popular_searches_override ?? [])
        ? config.popular_searches_override
        : [],
      popular_searches_max: intval(config.popular_searches_max ?? 12),
      frontend_url: config.frontend_url ?? '',
      revalidate_secret: config.revalidate_secret ?? '',
      _fallbacks: {
        app_name: getOption('blogname', ''),
        tagline: getOption('blogdescription', ''),
        contact_email: getOption('woocommerce_email_from_address', ''),
      },
    });
  }

  // ── POST /settings (admin) ─────────────────────────────────────────

  @RestRoute('/settings', { method: 'POST', capability: 'manage_options' })
  saveSettings(request: any): any {
    const data: any = request.get_json_params();

    // Sanitize contact
    const rawContact: any = data.contact ?? {};
    const contact: any = {
      phone: sanitizeTextField(rawContact.phone ?? ''),
      phone_href: sanitizeTextField(rawContact.phone_href ?? ''),
      email: sanitizeEmail(rawContact.email ?? ''),
      whatsapp_number: sanitizeTextField(rawContact.whatsapp_number ?? ''),
      whatsapp_label: sanitizeTextField(rawContact.whatsapp_label ?? ''),
    };

    // Sanitize social links
    const rawSocial: any = data.social ?? [];
    const validPlatforms: string[] = ['instagram', 'facebook', 'twitter', 'youtube', 'linkedin'];
    const social: any[] = [];
    if (isArray(rawSocial)) {
      for (const item of rawSocial) {
        const platform: string = sanitizeTextField(item.platform ?? '');
        if (inArray(platform, validPlatforms)) {
          social.push({
            platform: platform,
            href: escUrlRaw(item.href ?? ''),
            label: sanitizeTextField(item.label ?? ''),
          });
        }
      }
    }

    // Sanitize colors
    const rawColors: any = data.colors ?? {};
    const colors: any = {
      primary: sanitizeHexColor(rawColors.primary ?? '#6366f1') ?? '#6366f1',
      secondary: sanitizeHexColor(rawColors.secondary ?? '') ?? '',
      accent: sanitizeHexColor(rawColors.accent ?? '') ?? '',
    };

    // Sanitize tokens
    const rawTokens: any = data.tokens ?? {};
    const tokens: any = {
      section_gap: sanitizeTextField(rawTokens.section_gap ?? '2rem'),
      card_padding: sanitizeTextField(rawTokens.card_padding ?? '0.75rem'),
      card_radius: sanitizeTextField(rawTokens.card_radius ?? '0.75rem'),
      button_radius: sanitizeTextField(rawTokens.button_radius ?? '0.5rem'),
      image_radius: sanitizeTextField(rawTokens.image_radius ?? '0.5rem'),
      card_shadow: sanitizeTextField(rawTokens.card_shadow ?? 'none'),
      card_hover_shadow: sanitizeTextField(
        rawTokens.card_hover_shadow ?? '0 4px 12px oklch(0 0 0 / 0.1)',
      ),
      hover_duration: sanitizeTextField(rawTokens.hover_duration ?? '150ms'),
    };

    // Sanitize arrays
    const rawCities: any = data.cities ?? [];
    const cities: any = isArray(rawCities) ? arrayMap('sanitize_text_field', rawCities) : [];

    const rawTrustSignals: any = data.trust_signals ?? [];
    const trustSignals: any = isArray(rawTrustSignals)
      ? arrayMap('sanitize_text_field', rawTrustSignals)
      : [];

    const rawOverrides: any = data.popular_searches_override ?? [];
    const overrides: any = isArray(rawOverrides)
      ? arrayMap('sanitize_text_field', rawOverrides)
      : [];

    const sanitized: any = {
      app_name: sanitizeTextField(data.app_name ?? ''),
      short_name: sanitizeTextField(data.short_name ?? ''),
      tagline: sanitizeTextField(data.tagline ?? ''),
      title_tagline: sanitizeTextField(data.title_tagline ?? ''),
      description: sanitizeTextareaField(data.description ?? ''),
      logo_url: escUrlRaw(data.logo_url ?? ''),
      font_family: sanitizeTextField(data.font_family ?? 'Inter'),
      contact: contact,
      social: social,
      cities: cities,
      trust_signals: trustSignals,
      delivery_message: sanitizeTextField(data.delivery_message ?? ''),
      return_policy: sanitizeTextareaField(data.return_policy ?? ''),
      delivery_badge: sanitizeTextField(data.delivery_badge ?? ''),
      colors: colors,
      tokens: tokens,
      popular_searches_override: overrides,
      popular_searches_max: absint(data.popular_searches_max ?? 12),
      frontend_url: escUrlRaw(data.frontend_url ?? ''),
      revalidate_secret: sanitizeTextField(data.revalidate_secret ?? ''),
    };

    updateOption('headless_storefront_config', sanitized);

    return restEnsureResponse(sanitized);
  }

  // ── Cache invalidation webhook ─────────────────────────────────────

  @Action('update_option_headless_storefront_config', { priority: 10, acceptedArgs: 2 })
  onConfigUpdate(_oldValue: any, newValue: any): void {
    const frontendUrl: string = newValue.frontend_url ?? '';
    const secret: string = newValue.revalidate_secret ?? '';

    if (!frontendUrl || !secret) {
      return;
    }

    // Fire-and-forget: blocking: false means WP dispatches the request
    // without waiting for a response, so no error handling is possible.
    wpSafeRemotePost(`${frontendUrl}/api/revalidate`, {
      body: jsonEncode({ type: 'branding' }),
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': secret,
      },
      blocking: false,
      timeout: 5,
    });
  }
}
