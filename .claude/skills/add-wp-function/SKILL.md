---
name: add-wp-function
description: Add new WordPress function mappings to the wpts transpiler. Use when adding WordPress API functions like post management, taxonomy, user, media, or other WP functions.
argument-hint: [function-category]
---

Add WordPress function mappings for $ARGUMENTS to the wpts transpiler.

## Workflow

For each function:

1. **Map the function** in `packages/wpts/src/transpiler/wp-function-map.ts`
   - Add camelCase → snake_case entry in the appropriate section
   - Group related functions together with a comment header

2. **Add type declaration** in `packages/wpts/src/runtime/wp-types.ts`
   - Add `declare function` with correct parameter types and return type
   - Verify signatures against https://developer.wordpress.org before adding

3. **Add tests** in `packages/wpts/tests/unit/transpiler/expression-transpiler.test.ts`
   - Add test cases verifying camelCase TS transpiles to snake_case PHP
   - Cover representative functions from the category

4. **Update README** in `packages/wpts/README.md`
   - Add row to the WordPress Functions table

## Verification

After all functions are added, run all three checks:
- `npx tsc --noEmit` (type checking)
- `pnpm test` (unit + integration tests)
- `pnpm build` (compile + template copy)

All three must pass before the task is complete.
