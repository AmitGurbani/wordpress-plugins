import { test, expect } from '../../fixtures/wordpress';

const SLUG = 'headless-fuzzyfind';

test.describe('Headless FuzzyFind — Admin Settings UI', () => {
  test.afterAll(async ({ restApi }) => {
    await restApi.updateSettings(SLUG, {
      weight_title: 10,
      weight_sku: 8,
      weight_content: 2,
    });
  });

  test('can save and reload weight settings via admin UI', async ({
    page,
    restApi,
  }) => {
    // Reset to defaults
    await restApi.updateSettings(SLUG, {
      weight_title: 10,
      weight_sku: 8,
      weight_content: 2,
    });

    await page.goto(
      'http://localhost:8889/wp-admin/admin.php?page=headless-fuzzyfind-settings',
    );
    await expect(page.locator('#wpts-admin-app')).toBeVisible();

    // Change title weight
    const titleWeightInput = page.getByLabel('Title Weight');
    await titleWeightInput.fill('7');

    // Save
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 10_000 });

    // Reload and verify persistence
    await page.reload();
    await expect(page.locator('#wpts-admin-app')).toBeVisible();

    await expect(page.getByLabel('Title Weight')).toHaveValue('7');
  });
});
