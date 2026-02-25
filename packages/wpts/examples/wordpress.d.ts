/**
 * Ambient type declarations for @wordpress/* packages used in wpts examples.
 *
 * These provide type information for TypeScript to check the example admin UI
 * files (.tsx) without installing the full WordPress packages. The real packages
 * are available at runtime inside a WordPress plugin built with @wordpress/scripts.
 */

// ---------------------------------------------------------------------------
// @wordpress/element
// ---------------------------------------------------------------------------
declare module '@wordpress/element' {
  import type { ReactNode } from 'react';
  export { useState, useEffect } from 'react';
  export function render(element: ReactNode, container: Element | null): void;
  export function createRoot(container: Element): { render: (element: ReactNode) => void };
}

// ---------------------------------------------------------------------------
// @wordpress/i18n
// ---------------------------------------------------------------------------
declare module '@wordpress/i18n' {
  export function __(text: string, domain?: string): string;
}

// ---------------------------------------------------------------------------
// @wordpress/api-fetch
// ---------------------------------------------------------------------------
declare module '@wordpress/api-fetch' {
  interface APIFetchOptions {
    path?: string;
    url?: string;
    method?: string;
    data?: unknown;
    headers?: Record<string, string>;
  }
  export default function apiFetch<T = unknown>(
    options: APIFetchOptions,
  ): Promise<T>;
}

// ---------------------------------------------------------------------------
// @wordpress/components
// ---------------------------------------------------------------------------
declare module '@wordpress/components' {
  import type { FC, ReactNode } from 'react';

  export const Panel: FC<{
    header?: string;
    className?: string;
    children?: ReactNode;
  }>;

  export const PanelBody: FC<{
    title?: string;
    initialOpen?: boolean;
    className?: string;
    children?: ReactNode;
  }>;

  export const TextControl: FC<{
    label?: string;
    help?: string;
    value: string;
    onChange: (value: string) => void;
    className?: string;
  }>;

  export const TextareaControl: FC<{
    label?: string;
    help?: string;
    value: string;
    onChange: (value: string) => void;
    rows?: number;
    className?: string;
  }>;

  export const ToggleControl: FC<{
    label?: string;
    help?: string;
    checked: boolean;
    onChange: (value: boolean) => void;
    className?: string;
  }>;

  export const RangeControl: FC<{
    label?: string;
    help?: string;
    value: number;
    onChange: (value: number | undefined) => void;
    min?: number;
    max?: number;
    className?: string;
  }>;

  interface ColorPickerColor {
    hex: string;
    rgb: { r: number; g: number; b: number; a: number };
    hsl: { h: number; s: number; l: number; a: number };
  }

  export const ColorPicker: FC<{
    color?: string;
    onChangeComplete?: (color: ColorPickerColor) => void;
    className?: string;
  }>;

  export const Button: FC<{
    variant?: 'primary' | 'secondary' | 'tertiary' | 'link';
    onClick?: () => void;
    isBusy?: boolean;
    disabled?: boolean;
    className?: string;
    children?: ReactNode;
  }>;

  export const Spinner: FC<{ className?: string }>;

  interface Tab {
    name: string;
    title: string;
    className?: string;
  }

  export const TabPanel: FC<{
    tabs: Tab[];
    children: (tab: Tab) => ReactNode;
    className?: string;
    initialTabName?: string;
  }>;
}
