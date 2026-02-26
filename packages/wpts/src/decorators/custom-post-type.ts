export interface CustomPostTypeOptions {
  singularName: string;
  pluralName: string;
  description?: string;
  public?: boolean;
  showInRest?: boolean;
  hasArchive?: boolean;
  supports?: string[];
  menuIcon?: string;
  menuPosition?: number;
  rewriteSlug?: string;
  capabilityType?: string;
}

/**
 * Registers a WordPress Custom Post Type.
 * The generated PHP calls `register_post_type()` on the `init` hook.
 */
export function CustomPostType(slug: string, options: CustomPostTypeOptions): (...args: any[]) => any {
  return function (..._args: any[]) {
    // No-op at runtime — metadata is extracted at compile time by the transpiler.
  };
}
