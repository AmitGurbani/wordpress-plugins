import { expect, test } from '../../fixtures/wordpress';
import { PLUGINS } from '../../utils/settings';

for (const plugin of PLUGINS) {
  test.describe(`${plugin.name} — Admin Page`, () => {
    test('admin page renders without errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));

      await page.goto(`http://localhost:8889/wp-admin/admin.php?page=${plugin.menuSlug}`);

      // Wait for the React app container to be present
      await expect(page.locator(`#${plugin.slug}-admin-app`)).toBeVisible();

      // No JS errors
      expect(errors).toEqual([]);
    });

    test('tab navigation works', async ({ page }) => {
      await page.goto(`http://localhost:8889/wp-admin/admin.php?page=${plugin.menuSlug}`);

      await expect(page.locator(`#${plugin.slug}-admin-app`)).toBeVisible();

      // Wait for React app to finish loading (spinner disappears, tabs render)
      const firstTab = page.getByRole('tab').first();
      await expect(firstTab).toBeVisible({ timeout: 15_000 });

      const tabs = page.getByRole('tab');
      const tabCount = await tabs.count();
      expect(tabCount).toBeGreaterThanOrEqual(1);

      // Click through all tabs and verify content changes
      for (let i = 0; i < tabCount; i++) {
        await tabs.nth(i).click();
        await expect(tabs.nth(i)).toHaveAttribute('aria-selected', 'true');
      }
    });
  });
}
