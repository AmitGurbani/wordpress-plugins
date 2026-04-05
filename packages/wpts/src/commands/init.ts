import path from 'node:path';
import { ensureDir, writeFile } from '../utils/fs-utils.js';

export async function initProject(
  directory: string,
  options: { name?: string; slug?: string; author?: string },
): Promise<void> {
  const projectDir = path.resolve(directory);
  const pluginName = options.name ?? 'My Plugin';
  const author = options.author ?? 'Developer';

  console.log(`Creating wpts project in ${projectDir}...`);

  await ensureDir(path.join(projectDir, 'src'));
  await ensureDir(path.join(projectDir, 'src', 'admin'));

  // Create plugin.ts
  const pluginTs = `import { Plugin, Action, Filter, AdminPage, Setting, Activate, Shortcode } from 'wpts';

@Plugin({
  name: '${pluginName}',
  description: 'A WordPress plugin built with wpts.',
  version: '1.0.0',
  author: '${author}',
  license: 'GPL-2.0+',
  textDomain: '${options.slug ?? 'my-plugin'}',
  requiresWP: '6.7',
  requiresPHP: '8.2',
})
class MyPlugin {

  @Setting({
    key: 'message',
    type: 'string',
    default: 'Hello from wpts!',
    label: 'Message',
    sanitize: 'sanitize_text_field',
  })
  message: string = 'Hello from wpts!';

  @Activate()
  onActivation(): void {
    addOption('${options.slug ?? 'my_plugin'}_version', '1.0.0');
  }

  @Action('init')
  initialize(): void {
    loadPluginTextdomain('${options.slug ?? 'my-plugin'}', false, '${options.slug ?? 'my-plugin'}/languages');
  }

  @Filter('the_content')
  appendMessage(content: string): string {
    const msg = getOption('${options.slug ?? 'my_plugin'}_message', 'Hello!');
    if (isSingle()) {
      return content + '<p>' + escHtml(msg) + '</p>';
    }
    return content;
  }

  @AdminPage({
    pageTitle: '${pluginName} Settings',
    menuTitle: '${pluginName}',
    capability: 'manage_options',
    menuSlug: '${options.slug ?? 'my-plugin'}-settings',
    iconUrl: 'dashicons-admin-generic',
  })

  @Shortcode('${(options.slug ?? 'my_plugin').replace(/-/g, '_')}_hello')
  helloShortcode(atts: Record<string, string>): string {
    const msg = atts['message'] || getOption('${options.slug ?? 'my_plugin'}_message', 'Hello!');
    return '<span>' + escHtml(msg) + '</span>';
  }
}
`;

  await writeFile(path.join(projectDir, 'src', 'plugin.ts'), pluginTs);

  // Create admin/index.tsx
  const adminTsx = `import { createRoot, useState, useEffect } from '@wordpress/element';
import { Panel, PanelBody, TextControl, Button, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

function SettingsPage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch({ path: '/${options.slug ?? 'my-plugin'}/v1/settings' }).then((settings: any) => {
      setMessage(settings.message);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    await apiFetch({
      path: '/${options.slug ?? 'my-plugin'}/v1/settings',
      method: 'POST',
      data: { message },
    });
    setSaving(false);
  };

  if (loading) return <Spinner />;

  return (
    <div className="wrap">
      <h1>{__('${pluginName} Settings', '${options.slug ?? 'my-plugin'}')}</h1>
      <Panel>
        <PanelBody title={__('General Settings', '${options.slug ?? 'my-plugin'}')}>
          <TextControl
            label={__('Message', '${options.slug ?? 'my-plugin'}')}
            value={message}
            onChange={setMessage}
          />
        </PanelBody>
      </Panel>
      <Button variant="primary" onClick={save} isBusy={saving}>
        {saving ? <Spinner /> : __('Save Settings', '${options.slug ?? 'my-plugin'}')}
      </Button>
    </div>
  );
}

const rootElement = document.getElementById('wpts-admin-app');
if (rootElement) {
  createRoot(rootElement).render(<SettingsPage />);
}
`;

  await writeFile(path.join(projectDir, 'src', 'admin', 'index.tsx'), adminTsx);

  // Create tsconfig.json for the user project
  const tsconfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'ES2022',
      moduleResolution: 'Node16',
      strict: true,
      esModuleInterop: true,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      jsx: 'react-jsx',
      skipLibCheck: true,
    },
    include: ['src/**/*'],
  };

  await writeFile(path.join(projectDir, 'tsconfig.json'), `${JSON.stringify(tsconfig, null, 2)}\n`);

  // Create .gitignore to track generated plugin output
  const gitignore = `# Track generated plugin output (un-ignore dist from root rule)
!dist/

# Exclude non-plugin artifacts
dist/*.zip
`;

  await writeFile(path.join(projectDir, '.gitignore'), gitignore);

  console.log('\nProject created successfully!');
  console.log('\nFiles created:');
  console.log('  src/plugin.ts       - Plugin backend (transpiled to PHP)');
  console.log('  src/admin/index.tsx  - Admin page (React, bundled with wp-scripts)');
  console.log('  tsconfig.json       - TypeScript configuration');
  console.log('  .gitignore          - Track generated output in source control');
  console.log('\nNext steps:');
  console.log('  wpts build          - Build the plugin');
  console.log('  wpts validate       - Validate without building');
}
