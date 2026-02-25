import { createRoot, useState, useEffect } from '@wordpress/element';
import {
  Panel,
  PanelBody,
  TextControl,
  TextareaControl,
  ToggleControl,
  RangeControl,
  ColorPicker,
  Button,
  Spinner,
  TabPanel,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

interface Settings {
  site_title: string;
  enabled: boolean;
  max_items: number;
  accent_color: string;
  custom_css: string;
}

function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    site_title: '',
    enabled: true,
    max_items: 5,
    accent_color: '#0073aa',
    custom_css: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch({ path: '/settings-demo/v1/settings' }).then((data: any) => {
      setSettings(data);
      setLoading(false);
    });
  }, []);

  const update = (key: keyof Settings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    await apiFetch({
      path: '/settings-demo/v1/settings',
      method: 'POST',
      data: settings,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="wrap">
        <Spinner />
      </div>
    );
  }

  const tabs = [
    {
      name: 'general',
      title: __('General', 'settings-demo'),
      className: 'tab-general',
    },
    {
      name: 'advanced',
      title: __('Advanced', 'settings-demo'),
      className: 'tab-advanced',
    },
  ];

  return (
    <div className="wrap">
      <h1>{__('Settings Demo', 'settings-demo')}</h1>

      <TabPanel tabs={tabs}>
        {(tab) => {
          if (tab.name === 'general') {
            return (
              <Panel>
                <PanelBody title={__('General Settings', 'settings-demo')} initialOpen={true}>
                  <TextControl
                    label={__('Site Title Override', 'settings-demo')}
                    help={__('Custom title displayed in the plugin output.', 'settings-demo')}
                    value={settings.site_title}
                    onChange={(val) => update('site_title', val)}
                  />
                  <ToggleControl
                    label={__('Enable Plugin Output', 'settings-demo')}
                    help={__('Toggle the plugin greeting on the frontend.', 'settings-demo')}
                    checked={settings.enabled}
                    onChange={(val) => update('enabled', val)}
                  />
                  <RangeControl
                    label={__('Maximum Items', 'settings-demo')}
                    help={__('Maximum number of items to display.', 'settings-demo')}
                    value={settings.max_items}
                    onChange={(val) => update('max_items', val ?? 5)}
                    min={1}
                    max={50}
                  />
                </PanelBody>
              </Panel>
            );
          }

          return (
            <Panel>
              <PanelBody title={__('Appearance', 'settings-demo')} initialOpen={true}>
                <p>{__('Accent Color', 'settings-demo')}</p>
                <ColorPicker
                  color={settings.accent_color}
                  onChangeComplete={(val) => update('accent_color', val.hex)}
                />
              </PanelBody>
              <PanelBody title={__('Custom CSS', 'settings-demo')} initialOpen={true}>
                <TextareaControl
                  label={__('Custom CSS', 'settings-demo')}
                  help={__('Additional CSS injected into the frontend.', 'settings-demo')}
                  value={settings.custom_css}
                  onChange={(val) => update('custom_css', val)}
                  rows={8}
                />
              </PanelBody>
            </Panel>
          );
        }}
      </TabPanel>

      <div style={{ marginTop: '16px' }}>
        <Button variant="primary" onClick={save} isBusy={saving}>
          {saving ? <Spinner /> : __('Save Settings', 'settings-demo')}
        </Button>
        {saved && (
          <span style={{ marginLeft: '12px', color: '#00a32a' }}>
            {__('Settings saved.', 'settings-demo')}
          </span>
        )}
      </div>
    </div>
  );
}

const rootElement = document.getElementById('wpts-admin-app');
if (rootElement) {
  createRoot(rootElement).render(<SettingsPage />);
}
