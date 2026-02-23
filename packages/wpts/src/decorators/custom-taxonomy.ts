export interface CustomTaxonomyOptions {
  singularName: string;
  pluralName: string;
  postTypes: string | string[];
  description?: string;
  public?: boolean;
  showInRest?: boolean;
  hierarchical?: boolean;
  showAdminColumn?: boolean;
  rewriteSlug?: string;
}

/**
 * Registers a WordPress Custom Taxonomy.
 * The generated PHP calls `register_taxonomy()` on the `init` hook.
 */
export function CustomTaxonomy(slug: string, options: CustomTaxonomyOptions): ClassDecorator {
  return function (_target) {
    // No-op at runtime — metadata is extracted at compile time by the transpiler.
  };
}
