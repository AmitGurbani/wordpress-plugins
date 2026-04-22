import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { FormSection } from 'admin-ui';
import type { Settings, TabProps } from '../types';

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

export function ColorsTab({ settings, update }: TabProps) {
  const colors = settings.colors;

  const updateColor = (key: keyof Settings['colors'], value: string) => {
    update('colors', { ...colors, [key]: value });
  };

  return (
    <FormSection>
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
    </FormSection>
  );
}
