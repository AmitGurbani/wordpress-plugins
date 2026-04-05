export interface AdminPageOptions {
  pageTitle: string;
  menuTitle: string;
  capability: string;
  menuSlug: string;
  iconUrl?: string;
  position?: number;
  parentSlug?: string;
}

/**
 * Registers a WordPress admin menu page.
 * The generated PHP registers the page with `add_menu_page()` and enqueues
 * the React admin bundle to render the UI.
 */
export function AdminPage(_options: AdminPageOptions): (...args: any[]) => any {
  return (..._args: any[]) => {
    // No-op at runtime — metadata is extracted at compile time by the transpiler.
  };
}
