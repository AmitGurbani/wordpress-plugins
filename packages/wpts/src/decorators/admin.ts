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
export function AdminPage(options: AdminPageOptions): ClassDecorator {
  return function (_target) {
    // No-op at runtime — metadata is extracted at compile time by the transpiler.
  };
}
