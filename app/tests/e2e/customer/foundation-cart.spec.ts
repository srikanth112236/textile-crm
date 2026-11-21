import { test, expect } from '@playwright/test';
import { clearCart, collectPageErrors } from '../helpers/auth';

/**
 * P0 foundation smoke test — the customer add-to-cart path.
 *
 * Uses the first in-stock listing result instead of a hard-coded product id,
 * so it works against the lightweight foundation seed and the full demo seed.
 */

test.describe('P0 foundations — customer cart', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearCart(page);
  });

  test('customer navbar keeps wishlist/cart and hides staff mode', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Shopping Cart/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Wishlist/i })).toBeVisible();
    await expect(page.getByText(/Staff mode/i)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Open account menu' })).toBeVisible();
  });

  test('customer can open a product and add it to the cart', async ({ page }) => {
    const errors = collectPageErrors(page);

    await page.goto('/products?inStock=true');
    const firstProduct = page.locator('main a[href^="/products/"]').first();
    await expect(firstProduct).toBeVisible();

    await firstProduct.click();
    await page.waitForURL(/\/products\/[a-f0-9]{24}$/);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();

    const add = page.locator('button:visible', { hasText: /^Add to Cart$/ }).first();
    await expect(add).toBeEnabled();
    await add.click();

    // AddToCartButton swaps to quantity controls once the line is in the cart.
    await expect(page.getByRole('button', { name: 'Increase quantity' }).first()).toBeVisible({
      timeout: 20_000,
    });

    expect(errors, errors.join('\n')).toEqual([]);
  });
});
