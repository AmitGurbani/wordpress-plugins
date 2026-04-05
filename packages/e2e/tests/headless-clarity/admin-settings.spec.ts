import { expect, test } from '../../fixtures/wordpress';

const SLUG = 'headless-clarity';

test.describe('Headless Clarity — Admin Settings UI', () => {
  test.afterAll(async ({ restApi }) => {
    await restApi.updateSettings(SLUG, {
      project_id: '',
      enable_identify: true,
    });
  });

  test('can save and reload settings via admin UI', async ({ page, restApi }) => {
    // Reset to defaults first
    await restApi.updateSettings(SLUG, {
      project_id: '',
      enable_identify: true,
    });

    await page.goto('http://localhost:8889/wp-admin/admin.php?page=headless-clarity-settings');
    await expect(page.locator('#wpts-admin-app')).toBeVisible();

    // Fill in project ID
    const projectIdInput = page.getByLabel('Clarity Project ID');
    await projectIdInput.fill('test123456');

    // Toggle user identification off
    const identifyToggle = page.getByLabel('Enable user identification');
    if (await identifyToggle.isChecked()) {
      await identifyToggle.click();
    }

    // Save
    await page.getByRole('button', { name: /save/i }).click();

    // Wait for save confirmation
    await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 10_000 });

    // Reload and verify persistence
    await page.reload();
    await expect(page.locator('#wpts-admin-app')).toBeVisible();

    await expect(page.getByLabel('Clarity Project ID')).toHaveValue('test123456');
    await expect(page.getByLabel('Enable user identification')).not.toBeChecked();
  });
});
