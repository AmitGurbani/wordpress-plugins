import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { SecretFieldProps } from '../types';

export function SecretField({ label, help, textDomain, value, onChange }: SecretFieldProps) {
  return (
    <TextControl
      label={label}
      help={`${help} ${__('Never exposed to the browser.', textDomain)}`}
      value={value}
      onChange={onChange}
      type="password"
    />
  );
}
