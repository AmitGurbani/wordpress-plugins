import apiFetch from '@wordpress/api-fetch';
import { Button, ColorPicker, Panel, PanelBody, Spinner, TextControl } from '@wordpress/components';
import { createRoot, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

function SettingsPage() {
  const [greeting, setGreeting] = useState('');
  const [color, setColor] = useState('#333333');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch({ path: '/hello-world/v1/settings' }).then((settings: any) => {
      setGreeting(settings.greeting);
      setColor(settings.color);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    await apiFetch({
      path: '/hello-world/v1/settings',
      method: 'POST',
      data: { greeting, color },
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <Spinner />;

  return (
    <div className="wrap">
      <h1>{__('Hello World Settings', 'hello-world')}</h1>
      <Panel>
        <PanelBody title={__('General', 'hello-world')} initialOpen={true}>
          <TextControl
            label={__('Greeting Message', 'hello-world')}
            help={__('This message is displayed on single posts and via the [hello] shortcode.', 'hello-world')}
            value={greeting}
            onChange={setGreeting}
          />
        </PanelBody>
        <PanelBody title={__('Appearance', 'hello-world')} initialOpen={true}>
          <p>{__('Text Color', 'hello-world')}</p>
          <ColorPicker color={color} onChangeComplete={(val) => setColor(val.hex)} />
        </PanelBody>
      </Panel>
      <div style={{ marginTop: '16px' }}>
        <Button variant="primary" onClick={save} isBusy={saving}>
          {saving ? <Spinner /> : __('Save Settings', 'hello-world')}
        </Button>
        {saved && (
          <span style={{ marginLeft: '12px', color: '#00a32a' }}>
            {__('Settings saved.', 'hello-world')}
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
