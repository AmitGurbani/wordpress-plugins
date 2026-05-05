import { Button, CheckboxControl, Notice, SelectControl, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { FormSection } from 'admin-ui';
import type { BakeryOccasion, TabProps, TemplateConfig, TemplateName } from '../types';
import { DEFAULT_TEMPLATE_CONFIG } from '../types';

const TEMPLATE_OPTIONS: { value: TemplateName; label: string }[] = [
  { value: '', label: __('— Select a template —', 'headless-storefront') },
  { value: 'kirana', label: __('Kirana', 'headless-storefront') },
  { value: 'megamart', label: __('Megamart', 'headless-storefront') },
  { value: 'bakery', label: __('Bakery', 'headless-storefront') },
  { value: 'quickcommerce', label: __('Quickcommerce', 'headless-storefront') },
  { value: 'ecommerce', label: __('E-commerce', 'headless-storefront') },
  { value: 'fooddelivery', label: __('Food Delivery', 'headless-storefront') },
];

function parseIntegerInput(raw: string): number {
  if (raw.trim() === '') return 0;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n < 0) return 0;
  return n;
}

function patchTemplateConfig<K extends keyof TemplateConfig>(
  current: TemplateConfig,
  vertical: K,
  partial: Partial<TemplateConfig[K]>,
): TemplateConfig {
  return {
    ...current,
    [vertical]: { ...current[vertical], ...partial },
  };
}

function ensureTemplateConfig(tc: TemplateConfig | undefined): TemplateConfig {
  // Defensive: external callers (PATCH from a dashboard) could omit the
  // template_config key entirely. The form needs a fully-shaped object.
  if (!tc) return DEFAULT_TEMPLATE_CONFIG;
  return {
    bakery: { ...DEFAULT_TEMPLATE_CONFIG.bakery, ...(tc.bakery ?? {}) },
    quickcommerce: {
      ...DEFAULT_TEMPLATE_CONFIG.quickcommerce,
      ...(tc.quickcommerce ?? {}),
      eta_band_minutes: {
        ...DEFAULT_TEMPLATE_CONFIG.quickcommerce.eta_band_minutes,
        ...(tc.quickcommerce?.eta_band_minutes ?? {}),
      },
    },
    fooddelivery: { ...DEFAULT_TEMPLATE_CONFIG.fooddelivery, ...(tc.fooddelivery ?? {}) },
    ecommerce: { ...DEFAULT_TEMPLATE_CONFIG.ecommerce, ...(tc.ecommerce ?? {}) },
  };
}

function BakerySection({
  tc,
  setTc,
}: {
  tc: TemplateConfig;
  setTc: (next: TemplateConfig) => void;
}) {
  const { occasions, eggless_default } = tc.bakery;

  const updateOccasion = (i: number, partial: Partial<BakeryOccasion>) => {
    const next = occasions.map((o, idx) => (idx === i ? { ...o, ...partial } : o));
    setTc(patchTemplateConfig(tc, 'bakery', { occasions: next }));
  };
  const removeOccasion = (i: number) => {
    setTc(
      patchTemplateConfig(tc, 'bakery', {
        occasions: occasions.filter((_, idx) => idx !== i),
      }),
    );
  };
  const addOccasion = () => {
    setTc(
      patchTemplateConfig(tc, 'bakery', {
        occasions: [...occasions, { id: '', label: '' }],
      }),
    );
  };

  return (
    <div style={{ marginTop: '24px' }}>
      <h3>{__('Bakery', 'headless-storefront')}</h3>
      <p style={{ color: '#666', marginBottom: '12px' }}>
        {__('Occasions surface as filter chips on cake category pages.', 'headless-storefront')}
      </p>
      {occasions.map((o, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: position is the identity here
        <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <TextControl
            label={__('ID', 'headless-storefront')}
            value={o.id}
            onChange={(v: string) => updateOccasion(i, { id: v })}
          />
          <TextControl
            label={__('Label', 'headless-storefront')}
            value={o.label}
            onChange={(v: string) => updateOccasion(i, { label: v })}
          />
          <Button variant="tertiary" isDestructive onClick={() => removeOccasion(i)}>
            {__('Remove', 'headless-storefront')}
          </Button>
        </div>
      ))}
      <Button variant="secondary" onClick={addOccasion}>
        {__('Add Occasion', 'headless-storefront')}
      </Button>
      <div style={{ marginTop: '16px' }}>
        <CheckboxControl
          label={__('Default Eggless', 'headless-storefront')}
          help={__('Pre-select the eggless option on cake product pages.', 'headless-storefront')}
          checked={eggless_default}
          onChange={(v: boolean) =>
            setTc(patchTemplateConfig(tc, 'bakery', { eggless_default: v }))
          }
        />
      </div>
    </div>
  );
}

function QuickcommerceSection({
  tc,
  setTc,
}: {
  tc: TemplateConfig;
  setTc: (next: TemplateConfig) => void;
}) {
  const { eta_band_minutes, cod_enabled } = tc.quickcommerce;
  return (
    <div style={{ marginTop: '24px' }}>
      <h3>{__('Quickcommerce', 'headless-storefront')}</h3>
      <p style={{ color: '#666', marginBottom: '12px' }}>
        {__('ETA bands show as the headline delivery promise.', 'headless-storefront')}
      </p>
      <div style={{ display: 'flex', gap: '8px' }}>
        <TextControl
          label={__('ETA Min (minutes)', 'headless-storefront')}
          type="number"
          min={0}
          step={1}
          value={String(eta_band_minutes.min)}
          onChange={(v: string) =>
            setTc(
              patchTemplateConfig(tc, 'quickcommerce', {
                eta_band_minutes: { ...eta_band_minutes, min: parseIntegerInput(v) },
              }),
            )
          }
        />
        <TextControl
          label={__('ETA Max (minutes)', 'headless-storefront')}
          type="number"
          min={0}
          step={1}
          value={String(eta_band_minutes.max)}
          onChange={(v: string) =>
            setTc(
              patchTemplateConfig(tc, 'quickcommerce', {
                eta_band_minutes: { ...eta_band_minutes, max: parseIntegerInput(v) },
              }),
            )
          }
        />
      </div>
      <div style={{ marginTop: '16px' }}>
        <CheckboxControl
          label={__('Cash on Delivery enabled', 'headless-storefront')}
          checked={cod_enabled}
          onChange={(v: boolean) =>
            setTc(patchTemplateConfig(tc, 'quickcommerce', { cod_enabled: v }))
          }
        />
      </div>
    </div>
  );
}

function FoodDeliverySection({
  tc,
  setTc,
}: {
  tc: TemplateConfig;
  setTc: (next: TemplateConfig) => void;
}) {
  const { veg_only, jain_filter_enabled } = tc.fooddelivery;
  return (
    <div style={{ marginTop: '24px' }}>
      <h3>{__('Food Delivery', 'headless-storefront')}</h3>
      <CheckboxControl
        label={__('Veg only', 'headless-storefront')}
        help={__('Hide non-vegetarian items across the storefront.', 'headless-storefront')}
        checked={veg_only}
        onChange={(v: boolean) => setTc(patchTemplateConfig(tc, 'fooddelivery', { veg_only: v }))}
      />
      <div style={{ marginTop: '12px' }}>
        <CheckboxControl
          label={__('Jain filter', 'headless-storefront')}
          help={__('Expose a Jain-friendly filter on menu pages.', 'headless-storefront')}
          checked={jain_filter_enabled}
          onChange={(v: boolean) =>
            setTc(patchTemplateConfig(tc, 'fooddelivery', { jain_filter_enabled: v }))
          }
        />
      </div>
    </div>
  );
}

function EcommerceSection({
  tc,
  setTc,
}: {
  tc: TemplateConfig;
  setTc: (next: TemplateConfig) => void;
}) {
  const { returns_window_days, exchange_enabled } = tc.ecommerce;
  return (
    <div style={{ marginTop: '24px' }}>
      <h3>{__('E-commerce', 'headless-storefront')}</h3>
      <TextControl
        label={__('Returns Window (days)', 'headless-storefront')}
        type="number"
        min={0}
        step={1}
        help={__('Number of days a customer may return an order.', 'headless-storefront')}
        value={String(returns_window_days)}
        onChange={(v: string) =>
          setTc(
            patchTemplateConfig(tc, 'ecommerce', {
              returns_window_days: parseIntegerInput(v),
            }),
          )
        }
      />
      <CheckboxControl
        label={__('Exchanges enabled', 'headless-storefront')}
        checked={exchange_enabled}
        onChange={(v: boolean) =>
          setTc(patchTemplateConfig(tc, 'ecommerce', { exchange_enabled: v }))
        }
      />
    </div>
  );
}

export function TemplateTab({ settings, update }: TabProps) {
  const tc = ensureTemplateConfig(settings.template_config);
  const setTc = (next: TemplateConfig) => update('template_config', next);
  const setTemplate = (v: string) => update('template', v as TemplateName);

  let section: JSX.Element | null = null;
  if (settings.template === 'bakery') {
    section = <BakerySection tc={tc} setTc={setTc} />;
  } else if (settings.template === 'quickcommerce') {
    section = <QuickcommerceSection tc={tc} setTc={setTc} />;
  } else if (settings.template === 'fooddelivery') {
    section = <FoodDeliverySection tc={tc} setTc={setTc} />;
  } else if (settings.template === 'ecommerce') {
    section = <EcommerceSection tc={tc} setTc={setTc} />;
  }
  // kirana / megamart / unset: no per-vertical fields today.

  return (
    <FormSection>
      <SelectControl
        label={__('Storefront Template', 'headless-storefront')}
        help={__(
          'The Astro storefront template this WordPress install drives. Determines which vertical-specific fields appear below.',
          'headless-storefront',
        )}
        value={settings.template}
        options={TEMPLATE_OPTIONS}
        onChange={setTemplate}
      />
      {settings.template === '' && (
        <Notice status="info" isDismissible={false}>
          {__(
            'Select a template above to configure vertical-specific options. Kirana and Megamart have no template-specific fields today.',
            'headless-storefront',
          )}
        </Notice>
      )}
      {(settings.template === 'kirana' || settings.template === 'megamart') && (
        <Notice status="info" isDismissible={false}>
          {__(
            'No template-specific options for this vertical yet. Add fields here when a real ask lands.',
            'headless-storefront',
          )}
        </Notice>
      )}
      {section}
    </FormSection>
  );
}
