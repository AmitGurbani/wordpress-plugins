import { SelectControl, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { FormSection } from 'admin-ui';
import type { Settings, TabProps } from '../types';

interface Preset {
  name: string;
  label: string;
  colors: Settings['colors'];
  font_family: string;
  tokens: Settings['tokens'];
}

const PRESETS: Preset[] = [
  {
    name: 'default',
    label: 'Default',
    colors: { primary: '#6366f1', secondary: '#64748b', accent: '#94a3b8' },
    font_family: 'Inter',
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
  },
  {
    name: 'cinder',
    label: 'Cinder',
    colors: { primary: '#e8622a', secondary: '#d4a017', accent: '#2d9f3f' },
    font_family: 'Inter',
    tokens: {
      section_gap: '2rem',
      card_padding: '0.75rem',
      card_radius: '0.75rem',
      button_radius: '0.5rem',
      image_radius: '0.5rem',
      card_shadow: '0 1px 2px oklch(0 0 0 / 0.05)',
      card_hover_shadow: '0 4px 12px oklch(0 0 0 / 0.1)',
      hover_duration: '150ms',
    },
  },
  {
    name: 'bloom',
    label: 'Bloom',
    colors: { primary: '#d4618c', secondary: '#f5e6cc', accent: '#8b5e3c' },
    font_family: 'DM Sans',
    tokens: {
      section_gap: '3rem',
      card_padding: '1rem',
      card_radius: '1rem',
      button_radius: '9999px',
      image_radius: '0.75rem',
      card_shadow: '0 2px 12px -2px oklch(0 0 0 / 0.06)',
      card_hover_shadow: '0 8px 24px -4px oklch(0 0 0 / 0.12)',
      hover_duration: '300ms',
    },
  },
];

function ColorField({
  label,
  help,
  value,
  onChange,
  required,
}: {
  label: string;
  help: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <p style={{ fontWeight: 600, marginBottom: '4px' }}>
        {label}
        {required && <span style={{ color: '#d63638' }}> *</span>}
      </p>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: '48px', height: '36px', padding: '2px', cursor: 'pointer' }}
        />
        <TextControl
          value={value}
          onChange={onChange}
          placeholder="#RRGGBB"
          __nextHasNoMarginBottom
        />
      </div>
      <p style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>{help}</p>
    </div>
  );
}

function PresetCard({
  preset,
  active,
  onClick,
}: {
  preset: Preset;
  active: boolean;
  onClick: () => void;
}) {
  const t = preset.tokens;
  const c = preset.colors;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? `2px solid ${c.primary}` : '2px solid #ddd',
        borderRadius: '8px',
        padding: '16px',
        background: active ? '#f8f9ff' : '#fff',
        cursor: 'pointer',
        textAlign: 'left',
        minWidth: '220px',
        transition: 'border-color 150ms',
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: '12px', fontSize: '14px' }}>{preset.label}</p>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        <span
          title="primary"
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: c.primary,
            border: '1px solid rgba(0,0,0,0.1)',
          }}
        />
        <span
          title="secondary"
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: c.secondary || '#eee',
            border: '1px solid rgba(0,0,0,0.1)',
          }}
        />
        <span
          title="accent"
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: c.accent || '#eee',
            border: '1px solid rgba(0,0,0,0.1)',
          }}
        />
      </div>

      <p
        style={{
          fontFamily: preset.font_family,
          fontSize: '13px',
          color: '#333',
          marginBottom: '12px',
        }}
      >
        Aa <span style={{ color: '#666', fontSize: '11px' }}>{preset.font_family}</span>
      </p>

      <div
        style={{
          border: '1px solid #e0e0e0',
          borderRadius: t.card_radius,
          padding: t.card_padding,
          boxShadow: t.card_shadow === 'none' ? undefined : t.card_shadow,
        }}
      >
        <div
          style={{
            background: '#f0f0f0',
            borderRadius: t.image_radius,
            height: '40px',
            marginBottom: '8px',
          }}
        />
        <div
          style={{
            fontSize: '10px',
            color: '#666',
            marginBottom: '6px',
            fontFamily: preset.font_family,
          }}
        >
          Product Name
        </div>
        <button
          type="button"
          style={{
            background: c.primary,
            color: '#fff',
            border: 'none',
            borderRadius: t.button_radius,
            padding: '4px 12px',
            fontSize: '10px',
            cursor: 'default',
            fontFamily: preset.font_family,
          }}
        >
          Add to Cart
        </button>
      </div>
    </button>
  );
}

export function AppearanceTab({ settings, update }: TabProps) {
  const colors = settings.colors;
  const tokens = settings.tokens;

  const updateColor = (key: keyof Settings['colors'], value: string) => {
    update('colors', { ...colors, [key]: value });
  };

  const updateToken = (key: keyof Settings['tokens'], value: string) => {
    update('tokens', { ...tokens, [key]: value });
  };

  const applyPreset = (preset: Preset) => {
    update('colors', { ...preset.colors });
    update('font_family', preset.font_family);
    update('tokens', { ...preset.tokens });
  };

  const isPresetActive = (preset: Preset): boolean => {
    if (
      colors.primary !== preset.colors.primary ||
      colors.secondary !== preset.colors.secondary ||
      colors.accent !== preset.colors.accent
    ) {
      return false;
    }
    if (settings.font_family !== preset.font_family) return false;
    for (const key of Object.keys(preset.tokens) as (keyof Settings['tokens'])[]) {
      if (tokens[key] !== preset.tokens[key]) return false;
    }
    return true;
  };

  return (
    <FormSection>
      <h3>{__('Theme Presets', 'headless-storefront')}</h3>
      <p style={{ color: '#666', marginBottom: '12px' }}>
        {__(
          'Select a preset to apply a complete look — colors, typography, and spacing. You can fine-tune individual values below.',
          'headless-storefront',
        )}
      </p>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
        {PRESETS.map((preset) => (
          <PresetCard
            key={preset.name}
            preset={preset}
            active={isPresetActive(preset)}
            onClick={() => applyPreset(preset)}
          />
        ))}
      </div>

      <h3>{__('Colors', 'headless-storefront')}</h3>
      <ColorField
        label={__('Primary Color', 'headless-storefront')}
        help={__('Main brand color. Required, must be #RRGGBB hex format.', 'headless-storefront')}
        value={colors.primary}
        onChange={(v) => updateColor('primary', v)}
        required
      />
      <ColorField
        label={__('Secondary Color', 'headless-storefront')}
        help={__('Secondary brand color. Optional.', 'headless-storefront')}
        value={colors.secondary}
        onChange={(v) => updateColor('secondary', v)}
      />
      <ColorField
        label={__('Accent Color', 'headless-storefront')}
        help={__('Accent color for highlights. Optional.', 'headless-storefront')}
        value={colors.accent}
        onChange={(v) => updateColor('accent', v)}
      />

      <h3 style={{ marginTop: '32px' }}>{__('Font Family', 'headless-storefront')}</h3>
      <SelectControl
        label={__('Font Family', 'headless-storefront')}
        help={__('Must match a font loaded in the frontend build.', 'headless-storefront')}
        value={settings.font_family}
        options={[
          { label: 'Inter', value: 'Inter' },
          { label: 'DM Sans', value: 'DM Sans' },
        ]}
        onChange={(v: string) => update('font_family', v)}
      />

      <h3 style={{ marginTop: '32px' }}>{__('Design Tokens', 'headless-storefront')}</h3>
      <TextControl
        label={__('Section Gap', 'headless-storefront')}
        help={__(
          'Vertical gap between home sections (CSS value). Default: 2rem',
          'headless-storefront',
        )}
        value={tokens.section_gap}
        onChange={(v: string) => updateToken('section_gap', v)}
      />
      <TextControl
        label={__('Card Padding', 'headless-storefront')}
        help={__('Product card inner padding. Default: 0.75rem', 'headless-storefront')}
        value={tokens.card_padding}
        onChange={(v: string) => updateToken('card_padding', v)}
      />
      <TextControl
        label={__('Card Radius', 'headless-storefront')}
        help={__('Card border radius. Default: 0.75rem', 'headless-storefront')}
        value={tokens.card_radius}
        onChange={(v: string) => updateToken('card_radius', v)}
      />
      <TextControl
        label={__('Button Radius', 'headless-storefront')}
        help={__('Button border radius. Default: 0.5rem', 'headless-storefront')}
        value={tokens.button_radius}
        onChange={(v: string) => updateToken('button_radius', v)}
      />
      <TextControl
        label={__('Image Radius', 'headless-storefront')}
        help={__('Product image border radius. Default: 0.5rem', 'headless-storefront')}
        value={tokens.image_radius}
        onChange={(v: string) => updateToken('image_radius', v)}
      />
      <TextControl
        label={__('Card Shadow', 'headless-storefront')}
        help={__('Card box-shadow at rest. Default: none', 'headless-storefront')}
        value={tokens.card_shadow}
        onChange={(v: string) => updateToken('card_shadow', v)}
      />
      <TextControl
        label={__('Card Hover Shadow', 'headless-storefront')}
        help={__(
          'Card box-shadow on hover. Default: 0 4px 12px oklch(0 0 0 / 0.1)',
          'headless-storefront',
        )}
        value={tokens.card_hover_shadow}
        onChange={(v: string) => updateToken('card_hover_shadow', v)}
      />
      <TextControl
        label={__('Hover Duration', 'headless-storefront')}
        help={__('Hover transition duration. Default: 150ms', 'headless-storefront')}
        value={tokens.hover_duration}
        onChange={(v: string) => updateToken('hover_duration', v)}
      />
    </FormSection>
  );
}
