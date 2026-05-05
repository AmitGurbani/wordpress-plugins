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

    // ── Operations / merchant policy fields (v1.8) ──
    // Output `null` when unset so storefronts can distinguish "not configured"
    // from "explicit zero" — relevant for mov / delivery_fee where 0 is a
    // valid policy ("no minimum", "free delivery").
    const rawMov: any = config.mov ?? null;
    const mov: any = rawMov === null || rawMov === '' ? null : absint(rawMov);
    const rawDeliveryFee: any = config.delivery_fee ?? null;
    const deliveryFee: any =
      rawDeliveryFee === null || rawDeliveryFee === '' ? null : absint(rawDeliveryFee);
    const rawDeliveryAreas: any = config.delivery_areas ?? [];
    const deliveryAreas: any = isArray(rawDeliveryAreas)
      ? arrayMap('sanitize_text_field', rawDeliveryAreas)
      : [];
    const rawOwnerName: string = sanitizeTextField(config.owner_name ?? '');
    const rawFssaiLicense: string = sanitizeTextField(config.fssai_license ?? '');
    const rawEstdLine: string = sanitizeTextField(config.estd_line ?? '');

    // ── Template selector + per-vertical config (v1.8) ──
    // Allowlist declared inline (wpts doesn't carry module-level consts
    // into generated PHP class methods).
    const validTemplates: string[] = [
      'kirana',
      'megamart',
      'bakery',
      'quickcommerce',
      'ecommerce',
      'fooddelivery',
    ];
    const rawTemplate: string = sanitizeTextField(config.template ?? '');
    const template: any = inArray(rawTemplate, validTemplates, true) ? rawTemplate : null;

    const templateConfig: any = this.publicTemplateConfig(config.template_config ?? {});

    const response: any = {
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
        config.delivery_message ?? 'Delivery in 1–2 business days',
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
      // v1.8 additive fields. Strings normalize empty → null so storefronts
      // can `field ?? defaultLabel` without an extra empty-string check.
      fssai_license: rawFssaiLicense ? rawFssaiLicense : null,
      estd_line: rawEstdLine ? rawEstdLine : null,
      owner_name: rawOwnerName ? rawOwnerName : null,
      mov: mov,
      delivery_fee: deliveryFee,
      delivery_areas: deliveryAreas,
      template: template,
      template_config: templateConfig,
    };

    // Filter hook: lets sibling plugins or theme code mutate the public
    // /config response without owning the option blob. Documented in README
    // under "Extending". Applied last so filters see the fully assembled
    // shape including v1.8 additions.
    const filtered: any = applyFilters('headless_storefront_config_response', response);

    return restEnsureResponse(filtered);
  }

  // ── GET /settings (admin) ──────────────────────────────────────────

  @RestRoute('/settings', { method: 'GET', capability: 'manage_options' })
  getSettings(_request: any): any {
    const config: any = getOption('headless_storefront_config', []);
    const lastAt: string = getOption('headless_storefront_last_revalidate_at', '');

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
      delivery_message: config.delivery_message ?? 'Delivery in 1–2 business days',
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
      // Mask the shared secret. Anyone with manage_options can already read
      // the raw value via `wp option get headless_storefront_config`, but
      // the REST surface is reachable from JWT-authenticated dashboards on
      // separate origins — masking limits the blast radius if the network
      // path is logged or proxied. The admin UI re-submits '********' when
      // the user does not edit the field; saveSettings/patchSettings detect
      // that sentinel and preserve the existing value.
      revalidate_secret: config.revalidate_secret ? '********' : '',
      // v1.8 additive fields — raw shapes for the admin form. Numeric fields
      // are surfaced as strings to preserve the "unset" state in the form
      // (an empty input box) vs. an explicit 0.
      fssai_license: config.fssai_license ?? '',
      estd_line: config.estd_line ?? '',
      owner_name: config.owner_name ?? '',
      mov: config.mov ?? '',
      delivery_fee: config.delivery_fee ?? '',
      delivery_areas: isArray(config.delivery_areas ?? []) ? config.delivery_areas : [],
      template: config.template ?? '',
      template_config: this.adminTemplateConfig(config.template_config ?? {}),
      _fallbacks: {
        app_name: getOption('blogname', ''),
        tagline: getOption('blogdescription', ''),
        contact_email: getOption('woocommerce_email_from_address', ''),
      },
      _last_revalidate_at: lastAt ? lastAt : null,
    });
  }

  // ── POST /settings (admin) — full replace ──────────────────────────

  @RestRoute('/settings', { method: 'POST', capability: 'manage_options' })
  saveSettings(request: any): any {
    const data: any = this.preserveSecretOnMask(request.get_json_params());
    const sanitized: any = this.sanitizePayload(data);
    updateOption('headless_storefront_config', sanitized);
    return restEnsureResponse(this.maskResponse(sanitized));
  }

  // ── PATCH /settings (admin) — partial update ───────────────────────
  //
  // Merge semantics: keys present in the body override existing values;
  // omitted keys leave existing values unchanged. Note that `null` is
  // treated the same as "absent" (PHP `isset()` semantics) — to clear a
  // field, send `""` (string), `[]` (array), or `false` (boolean).
  // Top-level objects (contact, colors, tokens, template_config) are
  // shallow-merged so `{"colors": {"secondary": ""}}` only touches
  // `colors.secondary`. `template_config` merges per-vertical sub-objects
  // shallowly as well — sending `{"template_config":{"bakery":{"eggless_default":true}}}`
  // updates only that one nested key without disturbing other verticals
  // or other bakery fields.
  // Arrays (social, cities, trust_signals, delivery_areas, occasions) are
  // replaced wholesale when present.

  @RestRoute('/settings', { method: 'PATCH', capability: 'manage_options' })
  patchSettings(request: any): any {
    const patch: any = this.preserveSecretOnMask(request.get_json_params());
    const existing: any = getOption('headless_storefront_config', []);
    const merged: any = this.mergePatch(existing, patch);
    const sanitized: any = this.sanitizePayload(merged);
    updateOption('headless_storefront_config', sanitized);
    return restEnsureResponse(this.maskResponse(sanitized));
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
        // Pass `true` for strict comparison (in_array's third arg) — defends
        // against PHP's loose-comparison foot-gun (e.g. in_array(0, ['x'])
        // returning true on PHP < 8.0).
        if (inArray(platform, validPlatforms, true)) {
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

    const rawDeliveryAreas: any = data.delivery_areas ?? [];
    const deliveryAreas: any = isArray(rawDeliveryAreas)
      ? arrayMap('sanitize_text_field', rawDeliveryAreas)
      : [];

    // Numeric policy fields. Empty string / null = "unset"; persist as ''
    // so /config can echo it back as `null` (vs. an explicit 0, which is a
    // valid policy meaning "free / no minimum"). absint guards against
    // negative values and stringy junk for the explicit case.
    const rawMov: any = data.mov ?? '';
    const mov: any = rawMov === '' || rawMov === null ? '' : absint(rawMov);
    const rawDeliveryFee: any = data.delivery_fee ?? '';
    const deliveryFee: any =
      rawDeliveryFee === '' || rawDeliveryFee === null ? '' : absint(rawDeliveryFee);

    // Template selector — allowlist enum, empty string means "unset".
    // Inline allowlist (wpts doesn't carry module-level consts into PHP).
    const validTemplates: string[] = [
      'kirana',
      'megamart',
      'bakery',
      'quickcommerce',
      'ecommerce',
      'fooddelivery',
    ];
    const rawTemplate: string = sanitizeTextField(data.template ?? '');
    const template: string = inArray(rawTemplate, validTemplates, true) ? rawTemplate : '';

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
      fssai_license: sanitizeTextField(data.fssai_license ?? ''),
      estd_line: sanitizeTextField(data.estd_line ?? ''),
      owner_name: sanitizeTextField(data.owner_name ?? ''),
      mov: mov,
      delivery_fee: deliveryFee,
      delivery_areas: deliveryAreas,
      template: template,
      template_config: this.sanitizeTemplateConfig(data.template_config ?? {}),
    };
  }

  // ── Helper: sanitize the namespaced template_config blob ───────────
  //
  // Returns a fully-shaped object with one entry per known vertical, even
  // if the input only touched one of them. Unknown verticals are dropped.
  // Per-field sanitization mirrors the rest of the plugin (sanitizeTextField,
  // absint, restSanitizeBoolean).

  sanitizeTemplateConfig(input: any): any {
    const tc: any = input ?? {};

    const bakeryIn: any = tc.bakery ?? {};
    const occasionsIn: any = bakeryIn.occasions ?? [];
    const occasions: any[] = [];
    if (isArray(occasionsIn)) {
      for (const o of occasionsIn) {
        const id: string = sanitizeTextField(o.id ?? '');
        const label: string = sanitizeTextField(o.label ?? '');
        if (id && label) {
          occasions.push({ id: id, label: label });
        }
      }
    }
    const bakery: any = {
      occasions: occasions,
      eggless_default: restSanitizeBoolean(bakeryIn.eggless_default ?? false),
    };

    const qcIn: any = tc.quickcommerce ?? {};
    const etaIn: any = qcIn.eta_band_minutes ?? {};
    const quickcommerce: any = {
      eta_band_minutes: {
        min: absint(etaIn.min ?? 0),
        max: absint(etaIn.max ?? 0),
      },
      cod_enabled: restSanitizeBoolean(qcIn.cod_enabled ?? false),
    };

    const fdIn: any = tc.fooddelivery ?? {};
    const fooddelivery: any = {
      veg_only: restSanitizeBoolean(fdIn.veg_only ?? false),
      jain_filter_enabled: restSanitizeBoolean(fdIn.jain_filter_enabled ?? false),
    };

    const ecIn: any = tc.ecommerce ?? {};
    const ecommerce: any = {
      returns_window_days: absint(ecIn.returns_window_days ?? 0),
      exchange_enabled: restSanitizeBoolean(ecIn.exchange_enabled ?? false),
    };

    return {
      bakery: bakery,
      quickcommerce: quickcommerce,
      fooddelivery: fooddelivery,
      ecommerce: ecommerce,
    };
  }

  // ── Helper: shape template_config for the public /config response ──
  //
  // Returns sections only when they hold meaningful values, so a fresh
  // install doesn't pollute the response with empty per-vertical objects.
  // /config does NOT filter by the active `template` — every populated
  // section is returned so a misconfigured tenant still gets useful data.

  publicTemplateConfig(input: any): any {
    const tc: any = input ?? {};
    const out: any = {};

    const bakeryIn: any = tc.bakery ?? {};
    const occasionsIn: any = bakeryIn.occasions ?? [];
    const occasions: any[] = [];
    if (isArray(occasionsIn)) {
      for (const o of occasionsIn) {
        const id: string = sanitizeTextField(o.id ?? '');
        const label: string = sanitizeTextField(o.label ?? '');
        if (id && label) {
          occasions.push({ id: id, label: label });
        }
      }
    }
    const egglessDefault: boolean = restSanitizeBoolean(bakeryIn.eggless_default ?? false);
    if (!empty(occasions) || egglessDefault) {
      out.bakery = {
        occasions: occasions,
        eggless_default: egglessDefault,
      };
    }

    const qcIn: any = tc.quickcommerce ?? {};
    const etaIn: any = qcIn.eta_band_minutes ?? {};
    const etaMin: number = absint(etaIn.min ?? 0);
    const etaMax: number = absint(etaIn.max ?? 0);
    const codEnabled: boolean = restSanitizeBoolean(qcIn.cod_enabled ?? false);
    if (etaMin || etaMax || codEnabled) {
      out.quickcommerce = {
        eta_band_minutes: { min: etaMin, max: etaMax },
        cod_enabled: codEnabled,
      };
    }

    const fdIn: any = tc.fooddelivery ?? {};
    const vegOnly: boolean = restSanitizeBoolean(fdIn.veg_only ?? false);
    const jainEnabled: boolean = restSanitizeBoolean(fdIn.jain_filter_enabled ?? false);
    if (vegOnly || jainEnabled) {
      out.fooddelivery = {
        veg_only: vegOnly,
        jain_filter_enabled: jainEnabled,
      };
    }

    const ecIn: any = tc.ecommerce ?? {};
    const returnsWindow: number = absint(ecIn.returns_window_days ?? 0);
    const exchangeEnabled: boolean = restSanitizeBoolean(ecIn.exchange_enabled ?? false);
    if (returnsWindow || exchangeEnabled) {
      out.ecommerce = {
        returns_window_days: returnsWindow,
        exchange_enabled: exchangeEnabled,
      };
    }

    return out;
  }

  // ── Helper: shape template_config for the admin /settings response ─
  //
  // Always returns every vertical with default-zero values, so the admin
  // form has stable controlled inputs even before any data has been saved.

  adminTemplateConfig(input: any): any {
    const tc: any = input ?? {};

    const bakeryIn: any = tc.bakery ?? {};
    const occasionsIn: any = bakeryIn.occasions ?? [];
    const occasions: any = isArray(occasionsIn) ? occasionsIn : [];

    const qcIn: any = tc.quickcommerce ?? {};
    const etaIn: any = qcIn.eta_band_minutes ?? {};

    const fdIn: any = tc.fooddelivery ?? {};
    const ecIn: any = tc.ecommerce ?? {};

    return {
      bakery: {
        occasions: occasions,
        eggless_default: !!(bakeryIn.eggless_default ?? false),
      },
      quickcommerce: {
        eta_band_minutes: {
          min: etaIn.min ?? 0,
          max: etaIn.max ?? 0,
        },
        cod_enabled: !!(qcIn.cod_enabled ?? false),
      },
      fooddelivery: {
        veg_only: !!(fdIn.veg_only ?? false),
        jain_filter_enabled: !!(fdIn.jain_filter_enabled ?? false),
      },
      ecommerce: {
        returns_window_days: ecIn.returns_window_days ?? 0,
        exchange_enabled: !!(ecIn.exchange_enabled ?? false),
      },
    };
  }

  // ── Helper: merge a PATCH body onto the existing config ────────────
  //
  // For each schema key, if the patch has it (PHP isset semantics: present
  // and non-null), use the patch value; otherwise carry forward the
  // existing value. Nested objects (contact, colors, tokens, template_config)
  // are shallow-merged at the inner level so a partial subobject only
  // updates its own keys. Arrays are replaced wholesale when the array key
  // is present.

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

    // v1.8 top-level scalars
    result.fssai_license =
      patch.fssai_license !== undefined ? patch.fssai_license : (base.fssai_license ?? '');
    result.estd_line = patch.estd_line !== undefined ? patch.estd_line : (base.estd_line ?? '');
    result.owner_name = patch.owner_name !== undefined ? patch.owner_name : (base.owner_name ?? '');
    result.mov = patch.mov !== undefined ? patch.mov : (base.mov ?? '');
    result.delivery_fee =
      patch.delivery_fee !== undefined ? patch.delivery_fee : (base.delivery_fee ?? '');
    result.template = patch.template !== undefined ? patch.template : (base.template ?? '');

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
    result.delivery_areas =
      patch.delivery_areas !== undefined ? patch.delivery_areas : (base.delivery_areas ?? []);

    // Nested: template_config (shallow merge per vertical, then per field
    // within each vertical). A patch that touches one nested key inside
    // one vertical preserves every other vertical and every other field
    // within that vertical. Guard the access so the helper doesn't have
    // to deal with PHP 8 "undefined array key" warnings.
    if (patch.template_config !== undefined) {
      result.template_config = this.mergeTemplateConfig(
        base.template_config ?? {},
        patch.template_config,
      );
    } else {
      result.template_config = base.template_config ?? {};
    }

    return result;
  }

  // ── Helper: shallow-merge per vertical inside template_config ──────

  mergeTemplateConfig(baseTc: any, patchTc: any): any {
    if (patchTc === null) {
      return baseTc;
    }
    const result: any = {
      bakery: baseTc.bakery ?? {},
      quickcommerce: baseTc.quickcommerce ?? {},
      fooddelivery: baseTc.fooddelivery ?? {},
      ecommerce: baseTc.ecommerce ?? {},
    };

    // bakery
    if (patchTc.bakery !== undefined) {
      const pb: any = patchTc.bakery;
      const bb: any = result.bakery;
      result.bakery = {
        occasions: pb.occasions !== undefined ? pb.occasions : (bb.occasions ?? []),
        eggless_default:
          pb.eggless_default !== undefined ? pb.eggless_default : (bb.eggless_default ?? false),
      };
    }

    // quickcommerce
    if (patchTc.quickcommerce !== undefined) {
      const pq: any = patchTc.quickcommerce;
      const bq: any = result.quickcommerce;
      const baseEta: any = bq.eta_band_minutes ?? {};
      let mergedEta: any = baseEta;
      if (pq.eta_band_minutes !== undefined) {
        const pe: any = pq.eta_band_minutes;
        mergedEta = {
          min: pe.min !== undefined ? pe.min : (baseEta.min ?? 0),
          max: pe.max !== undefined ? pe.max : (baseEta.max ?? 0),
        };
      }
      result.quickcommerce = {
        eta_band_minutes: mergedEta,
        cod_enabled: pq.cod_enabled !== undefined ? pq.cod_enabled : (bq.cod_enabled ?? false),
      };
    }

    // fooddelivery
    if (patchTc.fooddelivery !== undefined) {
      const pf: any = patchTc.fooddelivery;
      const bf: any = result.fooddelivery;
      result.fooddelivery = {
        veg_only: pf.veg_only !== undefined ? pf.veg_only : (bf.veg_only ?? false),
        jain_filter_enabled:
          pf.jain_filter_enabled !== undefined
            ? pf.jain_filter_enabled
            : (bf.jain_filter_enabled ?? false),
      };
    }

    // ecommerce
    if (patchTc.ecommerce !== undefined) {
      const pe: any = patchTc.ecommerce;
      const be: any = result.ecommerce;
      result.ecommerce = {
        returns_window_days:
          pe.returns_window_days !== undefined
            ? pe.returns_window_days
            : (be.returns_window_days ?? 0),
        exchange_enabled:
          pe.exchange_enabled !== undefined ? pe.exchange_enabled : (be.exchange_enabled ?? false),
      };
    }

    return result;
  }

  // ── Helper: preserve secret when client re-submits the mask ────────
  //
  // GET /settings returns `revalidate_secret` as `'********'` when set.
  // The admin UI then re-POSTs whatever the user sees — including the
  // mask, when they did not edit the field. Detect that case and replace
  // the mask with the existing stored value before sanitization runs, so
  // the real secret is preserved across saves. Mirrors the wpts
  // class-rest-api.hbs preserve-on-mask pattern used by @Setting decorators.

  preserveSecretOnMask(data: any): any {
    if (data.revalidate_secret === '********') {
      const existing: any = getOption('headless_storefront_config', []);
      data.revalidate_secret = existing.revalidate_secret ?? '';
    }
    return data;
  }

  // ── Helper: mask the secret in REST responses ──────────────────────
  //
  // Returns a copy of the sanitized config with `revalidate_secret`
  // replaced by `'********'` (or `''` if unset). Used by GET/POST/PATCH
  // responses so the raw secret never leaves the server over REST.

  maskResponse(config: any): any {
    return {
      ...config,
      revalidate_secret: config.revalidate_secret ? '********' : '',
    };
  }
}
