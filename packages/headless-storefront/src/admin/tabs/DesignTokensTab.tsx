import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { FormSection } from 'admin-ui';
import type { Settings, TabProps } from '../types';

interface Preset {
  name: string;
  label: string;
  tokens: Settings['tokens'];
}

const PRESETS: Preset[] = [
  {
    name: 'compact',
    label: 'Compact',
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
    name: 'boutique',
    label: 'Boutique',
    tokens: {
      section_gap: '3rem',
      card_padding: '1rem',
      card_radius: '1rem',
      button_radius: '9999px',
      image_radius: '0.5rem',
      card_shadow: '0 2px 12px -2px oklch(0 0 0 / 0.06)',
      card_hover_shadow: '0 8px 24px -4px oklch(0 0 0 / 0.12)',
      hover_duration: '300ms',
    },
  },
];

function PresetCard({
  preset,
  active,
  primaryColor,
  onClick,
}: {
  preset: Preset;
  active: boolean;
  primaryColor: string;
  onClick: () => void;
}) {
  const t = preset.tokens;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? `2px solid ${primaryColor || '#6366f1'}` : '2px solid #ddd',
        borderRadius: '8px',
        padding: '16px',
        background: active ? '#f0f0ff' : '#fff',
        cursor: 'pointer',
        textAlign: 'left',
        minWidth: '200px',
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: '12px' }}>{preset.label}</p>
      {/* Visual preview card */}
      <div
        style={{
          border: '1px solid #e0e0e0',
          borderRadius: t.card_radius,
          padding: t.card_padding,
          boxShadow: t.card_shadow === 'none' ? undefined : t.card_shadow,
          transition: `box-shadow ${t.hover_duration}`,
        }}
      >
        <div
          style={{
            background: '#f0f0f0',
            borderRadius: t.image_radius,
            height: '48px',
            marginBottom: '8px',
          }}
        />
        <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px' }}>Product Name</div>
        <button
          type="button"
          style={{
            background: primaryColor || '#6366f1',
            color: '#fff',
            border: 'none',
            borderRadius: t.button_radius,
            padding: '4px 12px',
            fontSize: '10px',
            cursor: 'default',
          }}
        >
          Add to Cart
        </button>
      </div>
    </button>
  );
}

export function DesignTokensTab({ settings, update }: TabProps) {
  const tokens = settings.tokens;

  const updateToken = (key: keyof Settings['tokens'], value: string) => {
    update('tokens', { ...tokens, [key]: value });
  };

  const applyPreset = (preset: Preset) => {
    update('tokens', { ...preset.tokens });
  };

  const isPresetActive = (preset: Preset): boolean => {
    for (const key of Object.keys(preset.tokens) as (keyof Settings['tokens'])[]) {
      if (tokens[key] !== preset.tokens[key]) return false;
    }
    return true;
  };

  return (
    <FormSection>
      <h3>{__('Style Presets', 'headless-storefront')}</h3>
      <p style={{ color: '#666', marginBottom: '12px' }}>
        {__(
          'Select a preset to pre-fill token values. You can tweak individual values below.',
          'headless-storefront',
        )}
      </p>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        {PRESETS.map((preset) => (
          <PresetCard
            key={preset.name}
            preset={preset}
            active={isPresetActive(preset)}
            primaryColor={settings.colors.primary}
            onClick={() => applyPreset(preset)}
          />
        ))}
      </div>

      <h3>{__('Individual Tokens', 'headless-storefront')}</h3>
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
