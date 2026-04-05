import { __experimentalNumberControl as NumberControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { FormSection } from 'admin-ui';
import type { TabProps } from '../types';

export function GeneralTab({ settings, update }: TabProps) {
  return (
    <FormSection narrow={false}>
      <NumberControl
        label={__('Retention Days', 'headless-pos-sessions')}
        help={__(
          'Auto-delete closed sessions older than this many days. Set to 0 to disable.',
          'headless-pos-sessions',
        )}
        value={settings.retention_days}
        onChange={(v: string | undefined) => update('retention_days', v ? parseInt(v, 10) : 90)}
        min={0}
        max={365}
      />
      <NumberControl
        label={__('Max Open Sessions', 'headless-pos-sessions')}
        help={__('Maximum number of concurrently open POS sessions.', 'headless-pos-sessions')}
        value={settings.max_open_sessions}
        onChange={(v: string | undefined) => update('max_open_sessions', v ? parseInt(v, 10) : 10)}
        min={1}
        max={100}
      />
    </FormSection>
  );
}
