import { expect, test } from '../../fixtures/wordpress';

test.describe('Headless Wishlist — Admin Page', () => {
  test('admin page renders without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('http://localhost:8889/wp-admin/admin.php?page=headless-wishlist');

    await expect(page.locator('#headless-wishlist-admin-app')).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('analytics content loads', async ({ page }) => {
    await page.goto('http://localhost:8889/wp-admin/admin.php?page=headless-wishlist');

    await expect(page.locator('#headless-wishlist-admin-app')).toBeVisible();

    // Wait for React app to finish loading (spinner disappears, content renders)
    await expect(page.getByText('Wishlist Analytics')).toBeVisible({ timeout: 15_000 });

    // Summary cards should be present
    await expect(page.getByText('Users with Wishlists')).toBeVisible();
    await expect(page.getByText('Total Wishlisted Items')).toBeVisible();
  });
});
