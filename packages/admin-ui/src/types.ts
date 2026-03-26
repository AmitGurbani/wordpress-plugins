import type { ReactNode } from 'react';

export interface SettingsConfig<S extends object> {
  slug: string;
  textDomain: string;
  defaults: S;
}

export interface SettingsState<S extends object> {
  settings: S;
  loading: boolean;
  saving: boolean;
  saved: boolean;
  error: string;
  update: (key: keyof S, value: S[keyof S]) => void;
  save: () => Promise<void>;
}

export interface TabProps<S extends object> {
  settings: S;
  update: (key: keyof S, value: S[keyof S]) => void;
}

export interface TabDef {
  name: string;
  title: string;
}

export interface SettingsShellProps<S extends object> {
  title: string;
  textDomain: string;
  tabs: TabDef[];
  settingsState: SettingsState<S>;
  children: (tab: TabDef, tabProps: TabProps<S>) => ReactNode;
}

export interface DiagnosticsConfig {
  slug: string;
  textDomain: string;
  lastErrorPath?: string;
  lastErrorTitle?: string;
  testAction?: {
    path: string;
    method?: string;
    buttonLabel: string;
    title: string;
    description: string;
  };
  renderTestExtra?: (result: Record<string, unknown>) => ReactNode;
}
