import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import type { SettingsConfig, SettingsState } from '../types';

export function useSettings<S extends object>(
  config: SettingsConfig<S>,
): SettingsState<S> {
  const { slug, textDomain, defaults } = config;
  const [settings, setSettings] = useState<S>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch({ path: `/${slug}/v1/settings` })
      .then((data: any) => {
        setSettings({ ...defaults, ...data });
        setLoading(false);
      })
      .catch(() => {
        setError(__('Failed to load settings.', textDomain));
        setLoading(false);
      });
  }, [slug, textDomain]);

  const update = (key: keyof S, value: S[keyof S]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      await apiFetch({
        path: `/${slug}/v1/settings`,
        method: 'POST',
        data: settings,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError(__('Failed to save settings.', textDomain));
    }
    setSaving(false);
  };

  return { settings, loading, saving, saved, error, update, save };
}
