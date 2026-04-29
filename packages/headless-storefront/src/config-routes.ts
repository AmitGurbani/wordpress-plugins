/**
 * Headless Storefront Config Routes
 *
 * Public /config endpoint, admin /settings endpoints, and the manual
 * /admin/revalidate endpoint used by the "Re-push storefront config" button.
 *
 * Option-update hooks that automatically fire the revalidation webhook
 * live in `revalidate-hooks.ts` (kept separate so the shared helper lands
 * in the same PHP class as the action handlers).
 */

import { RestRoute } from '@amitgurbani/wpts';

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
      hours_text: sanitizeTextareaField(config.hours_text ?? ''),
      delivery_area_text: sanitizeTextareaField(config.delivery_area_text ?? ''),
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
      hours_text: config.hours_text ?? '',
      delivery_area_text: config.delivery_area_text ?? '',
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
      frontend_url: config.frontend_url ?? '',
      revalidate_secret: config.revalidate_secret ?? '',
      _fallbacks: {
        app_name: getOption('blogname', ''),
        tagline: getOption('blogdescription', ''),
        contact_email: getOption('woocommerce_email_from_address', ''),
      },
      _last_revalidate_at: getOption('headless_storefront_last_revalidate_at', '')
        ? getOption('headless_storefront_last_revalidate_at', '')
        : null,
    });
  }

  // ── POST /settings (admin) — full replace ──────────────────────────

  @RestRoute('/settings', { method: 'POST', capability: 'manage_options' })
  saveSettings(request: any): any {
    const sanitized: any = this.sanitizePayload(request.get_json_params());
    updateOption('headless_storefront_config', sanitized);
    return restEnsureResponse(sanitized);
  }

  // ── PATCH /settings (admin) — partial update ───────────────────────
  //
  // Merge semantics: keys present in the body override existing values;
  // omitted keys leave existing values unchanged. Note that `null` is
  // treated the same as "absent" (PHP `isset()` semantics) — to clear a
  // field, send `""` (string), `[]` (array), or `false` (boolean).
  // Top-level objects (contact, colors, tokens) are shallow-merged so
  // `{"colors": {"secondary": ""}}` only touches `colors.secondary`.
  // Arrays (social, cities, trust_signals) are replaced wholesale when
  // present.

  @RestRoute('/settings', { method: 'PATCH', capability: 'manage_options' })
  patchSettings(request: any): any {
    const patch: any = request.get_json_params();
    const existing: any = getOption('headless_storefront_config', []);
    const merged: any = this.mergePatch(existing, patch);
    const sanitized: any = this.sanitizePayload(merged);
    updateOption('headless_storefront_config', sanitized);
    return restEnsureResponse(sanitized);
  }

  // ── POST /admin/revalidate (admin) — manual re-push ────────────────

  @RestRoute('/admin/revalidate', { method: 'POST', capability: 'manage_options' })
  manualRevalidate(_request: any): any {
    const dispatched: boolean = this.dispatchRevalidate();
    return restEnsureResponse({ dispatched: dispatched });
  }

  // ── Helper: dispatch revalidation webhook ──────────────────────────
  //
  // Mirrored in `revalidate-hooks.ts`. Both copies exist because wpts
  // places a given source class's helper into a single PHP class (REST
  // here, Public there), so action handlers and REST routes each need
  // their own reachable copy.

  dispatchRevalidate(): boolean {
    if (defined('WP_CLI') && WP_CLI) {
      return false;
    }

    const config: any = getOption('headless_storefront_config', []);
    const frontendUrl: string = config.frontend_url ?? '';
    const secret: string = config.revalidate_secret ?? '';

    if (!frontendUrl || !secret) {
      return false;
    }

    // Record "last attempted" timestamp before firing. Mirrors the helper
    // copy in revalidate-hooks.ts so manual re-pushes via this REST route
    // and auto-fires from option-update hooks both update the surface.
    updateOption('headless_storefront_last_revalidate_at', gmdate('c', time()));

    wpSafeRemotePost(`${frontendUrl}/api/revalidate`, {
      body: jsonEncode({ type: 'storefront' }),
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': secret,
      },
      blocking: false,
      timeout: 5,
    });

    if (defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
      errorLog(`[headless-storefront] revalidate dispatched to ${frontendUrl}/api/revalidate`);
    }

    return true;
  }

  // ── Helper: sanitize a full settings payload ───────────────────────
  //
  // Shared by POST /settings and PATCH /settings. The PATCH route merges
  // first (via mergePatch) and then runs the merged object through here,
  // so the persisted shape and validation rules stay identical for both.

  sanitizePayload(data: any): any {
    const rawContact: any = data.contact ?? {};
    const contact: any = {
      phone: sanitizeTextField(rawContact.phone ?? ''),
      phone_href: sanitizeTextField(rawContact.phone_href ?? ''),
      email: sanitizeEmail(rawContact.email ?? ''),
      whatsapp_number: sanitizeTextField(rawContact.whatsapp_number ?? ''),
      whatsapp_label: sanitizeTextField(rawContact.whatsapp_label ?? ''),
    };

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

    const rawColors: any = data.colors ?? {};
    const colors: any = {
      primary: sanitizeHexColor(rawColors.primary ?? '#6366f1') ?? '#6366f1',
      secondary: sanitizeHexColor(rawColors.secondary ?? '') ?? '',
      accent: sanitizeHexColor(rawColors.accent ?? '') ?? '',
    };

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

    const rawCities: any = data.cities ?? [];
    const cities: any = isArray(rawCities) ? arrayMap('sanitize_text_field', rawCities) : [];

    const rawTrustSignals: any = data.trust_signals ?? [];
    const trustSignals: any = isArray(rawTrustSignals)
      ? arrayMap('sanitize_text_field', rawTrustSignals)
      : [];

    return {
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
      hours_text: sanitizeTextareaField(data.hours_text ?? ''),
      delivery_area_text: sanitizeTextareaField(data.delivery_area_text ?? ''),
      colors: colors,
      tokens: tokens,
      frontend_url: escUrlRaw(data.frontend_url ?? ''),
      revalidate_secret: sanitizeTextField(data.revalidate_secret ?? ''),
    };
  }

  // ── Helper: merge a PATCH body onto the existing config ────────────
  //
  // For each schema key, if the patch has it (PHP isset semantics: present
  // and non-null), use the patch value; otherwise carry forward the
  // existing value. Nested objects (contact, colors, tokens) are shallow-
  // merged at the inner level so a partial subobject only updates its own
  // keys. Arrays are replaced wholesale when the array key is present.

  mergePatch(existing: any, patch: any): any {
    const base: any = existing ? existing : {};
    const result: any = {};

    // Top-level scalars
    result.app_name = patch.app_name !== undefined ? patch.app_name : (base.app_name ?? '');
    result.short_name = patch.short_name !== undefined ? patch.short_name : (base.short_name ?? '');
    result.tagline = patch.tagline !== undefined ? patch.tagline : (base.tagline ?? '');
    result.title_tagline =
      patch.title_tagline !== undefined ? patch.title_tagline : (base.title_tagline ?? '');
    result.description =
      patch.description !== undefined ? patch.description : (base.description ?? '');
    result.logo_url = patch.logo_url !== undefined ? patch.logo_url : (base.logo_url ?? '');
    result.font_family =
      patch.font_family !== undefined ? patch.font_family : (base.font_family ?? 'Inter');
    result.delivery_message =
      patch.delivery_message !== undefined ? patch.delivery_message : (base.delivery_message ?? '');
    result.return_policy =
      patch.return_policy !== undefined ? patch.return_policy : (base.return_policy ?? '');
    result.delivery_badge =
      patch.delivery_badge !== undefined ? patch.delivery_badge : (base.delivery_badge ?? '');
    result.hours_text = patch.hours_text !== undefined ? patch.hours_text : (base.hours_text ?? '');
    result.delivery_area_text =
      patch.delivery_area_text !== undefined
        ? patch.delivery_area_text
        : (base.delivery_area_text ?? '');
    result.frontend_url =
      patch.frontend_url !== undefined ? patch.frontend_url : (base.frontend_url ?? '');
    result.revalidate_secret =
      patch.revalidate_secret !== undefined
        ? patch.revalidate_secret
        : (base.revalidate_secret ?? '');

    // Nested: contact (shallow merge)
    const baseContact: any = base.contact ?? {};
    if (patch.contact !== undefined) {
      const pc: any = patch.contact;
      result.contact = {
        phone: pc.phone !== undefined ? pc.phone : (baseContact.phone ?? ''),
        phone_href: pc.phone_href !== undefined ? pc.phone_href : (baseContact.phone_href ?? ''),
        email: pc.email !== undefined ? pc.email : (baseContact.email ?? ''),
        whatsapp_number:
          pc.whatsapp_number !== undefined
            ? pc.whatsapp_number
            : (baseContact.whatsapp_number ?? ''),
        whatsapp_label:
          pc.whatsapp_label !== undefined ? pc.whatsapp_label : (baseContact.whatsapp_label ?? ''),
      };
    } else {
      result.contact = baseContact;
    }

    // Nested: colors (shallow merge)
    const baseColors: any = base.colors ?? {};
    if (patch.colors !== undefined) {
      const pc: any = patch.colors;
      result.colors = {
        primary: pc.primary !== undefined ? pc.primary : (baseColors.primary ?? '#6366f1'),
        secondary: pc.secondary !== undefined ? pc.secondary : (baseColors.secondary ?? ''),
        accent: pc.accent !== undefined ? pc.accent : (baseColors.accent ?? ''),
      };
    } else {
      result.colors = baseColors;
    }

    // Nested: tokens (shallow merge)
    const baseTokens: any = base.tokens ?? {};
    if (patch.tokens !== undefined) {
      const pt: any = patch.tokens;
      result.tokens = {
        section_gap:
          pt.section_gap !== undefined ? pt.section_gap : (baseTokens.section_gap ?? '2rem'),
        card_padding:
          pt.card_padding !== undefined ? pt.card_padding : (baseTokens.card_padding ?? '0.75rem'),
        card_radius:
          pt.card_radius !== undefined ? pt.card_radius : (baseTokens.card_radius ?? '0.75rem'),
        button_radius:
          pt.button_radius !== undefined
            ? pt.button_radius
            : (baseTokens.button_radius ?? '0.5rem'),
        image_radius:
          pt.image_radius !== undefined ? pt.image_radius : (baseTokens.image_radius ?? '0.5rem'),
        card_shadow:
          pt.card_shadow !== undefined ? pt.card_shadow : (baseTokens.card_shadow ?? 'none'),
        card_hover_shadow:
          pt.card_hover_shadow !== undefined
            ? pt.card_hover_shadow
            : (baseTokens.card_hover_shadow ?? '0 4px 12px oklch(0 0 0 / 0.1)'),
        hover_duration:
          pt.hover_duration !== undefined
            ? pt.hover_duration
            : (baseTokens.hover_duration ?? '150ms'),
      };
    } else {
      result.tokens = baseTokens;
    }

    // Arrays — replaced wholesale when key is present
    result.social = patch.social !== undefined ? patch.social : (base.social ?? []);
    result.cities = patch.cities !== undefined ? patch.cities : (base.cities ?? []);
    result.trust_signals =
      patch.trust_signals !== undefined ? patch.trust_signals : (base.trust_signals ?? []);

    return result;
  }
}
