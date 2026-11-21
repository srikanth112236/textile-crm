import { test, expect, Page } from '@playwright/test';
import { collectPageErrors, shot } from '../helpers/auth';

/**
 * Covers the storefront UX pass:
 *  1. Announcement bar is a seamless CSS marquee (pauses on hover).
 *  2. Product filters: every section has an icon + only ONE accordion open.
 *  3. Coupons are no longer advertised on the public homepage.
 *  4. All live coupons surface at cart/checkout with eligibility + 1-click apply.
 */

const PRODUCT_ID = '6acf3b31e5192c6bafa49ed8';
const PRODUCT_PRICE = 499;

const FILTER_SECTIONS = [
  'Categories',
  'Price Range',
  'Size',
  'Color',
  'Fit',
  'Fabric',
  'Pattern',
  'Occasion',
  'Rating',
  'Badges',
];

async function seedGuestCart(page: Page, quantity = 1) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ([productId, qty]) => {
      localStorage.setItem(
        'mentoos_guest_cart',
        JSON.stringify([{ productId, quantity: qty, variations: [] }])
      );
      localStorage.removeItem('mentoos_coupon');
    },
    [PRODUCT_ID, quantity] as const
  );
}

test.describe('Storefront UX pass', () => {
  test('announcement bar is a seamless infinite marquee', async ({ page }, testInfo) => {
    const errors = collectPageErrors(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const bar = page.getByTestId('announcement-marquee');
    const track = page.getByTestId('announcement-track');
    await expect(bar).toBeVisible();
    await expect(track).toBeVisible();

    // At least 10 messages are always fed into the loop (admin list or defaults).
    await expect
      .poll(async () => Number(await bar.getAttribute('data-message-count')), { timeout: 10_000 })
      .toBeGreaterThanOrEqual(10);

    // CSS animation wired up as an infinite marquee.
    const anim = await track.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        name: s.animationName,
        iteration: s.animationIterationCount,
        duration: s.animationDuration,
        state: s.animationPlayState,
      };
    });
    expect(anim.name).toBe('marquee');
    expect(anim.iteration).toBe('infinite');
    expect(anim.state).toBe('running');
    expect(parseFloat(anim.duration)).toBeGreaterThanOrEqual(20);

    // Track must be wider than the viewport and duplicated for a seamless loop.
    const metrics = await track.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      viewport: window.innerWidth,
      groups: el.children.length,
      duplicatesHidden: Array.from(el.children).filter((c) => c.getAttribute('aria-hidden') === 'true').length,
    }));
    expect(metrics.scrollWidth).toBeGreaterThan(metrics.viewport);
    expect(metrics.groups).toBe(2);
    expect(metrics.duplicatesHidden).toBe(1);

    // It actually moves.
    const t0 = await track.evaluate((el) => getComputedStyle(el).transform);
    await page.waitForTimeout(700);
    const t1 = await track.evaluate((el) => getComputedStyle(el).transform);
    expect(t1).not.toBe(t0);

    // Hover pauses reading.
    await bar.hover();
    await page.waitForTimeout(150);
    await expect
      .poll(async () => track.evaluate((el) => getComputedStyle(el).animationPlayState), { timeout: 3000 })
      .toBe('paused');

    // Nothing clipped horizontally.
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1);

    await shot(page, testInfo, 'ux-announcement-marquee');
    expect(errors, `Page errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('product filters: icons on every section, groups open independently', async ({ page }, testInfo) => {
    const errors = collectPageErrors(page);
    await page.goto('/products', { waitUntil: 'domcontentloaded' });

    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();
    // Wait for the dynamic filter metadata to land so all sections render.
    await expect(sidebar.getByText(/Categories \(\d+\)/i).first()).toBeVisible({ timeout: 20_000 });

    const triggers = sidebar.locator('button[aria-expanded]');
    await expect(triggers).toHaveCount(FILTER_SECTIONS.length);

    // Every section title has an icon (svg) inside it.
    const iconCount = await sidebar.locator('button[aria-expanded] > span > svg').count();
    expect(iconCount).toBe(FILTER_SECTIONS.length);

    // No emoji fallback left behind in the price header.
    await expect(sidebar.getByText('💰')).toHaveCount(0);

    // Categories + Price are open on first paint for high-intent shoppers.
    const expanded = () =>
      sidebar.locator('button[aria-expanded="true"]').count();
    expect(await expanded()).toBe(2);
    await expect(sidebar.getByRole('button', { name: /^Categories/i })).toHaveAttribute('aria-expanded', 'true');
    await expect(sidebar.getByRole('button', { name: /^Price Range/i })).toHaveAttribute('aria-expanded', 'true');

    // Opening Size adds to the open set instead of closing Categories.
    await sidebar.getByRole('button', { name: /^Size/i }).click();
    await expect(sidebar.getByRole('button', { name: /^Size/i })).toHaveAttribute('aria-expanded', 'true');
    await expect(sidebar.getByRole('button', { name: /^Categories/i })).toHaveAttribute('aria-expanded', 'true');
    expect(await expanded()).toBe(3);

    // Opening Fabric keeps the other groups open.
    await sidebar.getByRole('button', { name: /^Fabric/i }).click();
    await expect(sidebar.getByRole('button', { name: /^Fabric/i })).toHaveAttribute('aria-expanded', 'true');
    await expect(sidebar.getByRole('button', { name: /^Size/i })).toHaveAttribute('aria-expanded', 'true');
    expect(await expanded()).toBe(4);

    // Every group is still individually collapsible.
    await sidebar.getByRole('button', { name: /^Fabric/i }).click();
    await expect(sidebar.getByRole('button', { name: /^Fabric/i })).toHaveAttribute('aria-expanded', 'false');
    expect(await expanded()).toBe(3);

    // Picking a filter still updates the URL + result count, without closing the rail.
    // Price Range stays open from first paint, so its presets are already visible.
    await expect(sidebar.getByRole('button', { name: /^Price Range/i })).toHaveAttribute('aria-expanded', 'true');
    await sidebar.getByRole('button', { name: 'Under ₹500' }).click();
    await expect(page).toHaveURL(/[?&]maxPrice=500/);
    await expect(sidebar.getByRole('button', { name: /^Price Range/i })).toHaveAttribute('aria-expanded', 'true');

    await shot(page, testInfo, 'ux-product-filters');
    expect(errors, `Page errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('category page filters use the same single-open accordion', async ({ page }, testInfo) => {
    await page.goto('/categories/t-shirts', { waitUntil: 'domcontentloaded' });
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();

    const triggers = sidebar.locator('button[aria-expanded]');
    await expect(triggers).toHaveCount(4); // Categories / Price / Size / Color
    expect(await sidebar.locator('button[aria-expanded] > span > svg').count()).toBe(4);

    const priceTrigger = sidebar.getByRole('button', { name: /^Price Range/i });
    // Retry once hydration has settled; a click during the dev compile window
    // can land on the server-rendered copy and be replaced.
    await expect(async () => {
      if ((await priceTrigger.getAttribute('aria-expanded')) !== 'true') {
        await priceTrigger.click();
      }
      await expect(priceTrigger).toHaveAttribute('aria-expanded', 'true', { timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    await expect(sidebar.getByRole('button', { name: /^All Categories/i })).toHaveAttribute('aria-expanded', 'false');
    expect(await sidebar.locator('button[aria-expanded="true"]').count()).toBe(1);

    await shot(page, testInfo, 'ux-category-filters');
  });

  test('homepage no longer advertises the coupon showcase', async ({ page }, testInfo) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: /OFFERS & DISCOUNT SHOWCASE/i })).toHaveCount(0);
    await expect(page.getByText(/Exclusive Savings & Coupons/i)).toHaveCount(0);
    await expect(page.getByTestId('available-coupons')).toHaveCount(0);

    // The rest of the storefront is untouched.
    await expect(page.getByText('SHOP BY CATEGORY').first()).toBeVisible();
    await expect(page.getByText('NEW ARRIVALS').first()).toBeVisible();

    await shot(page, testInfo, 'ux-home-no-coupons');
  });

  test('cart shows every live coupon with eligibility and 1-click apply', async ({ page }, testInfo) => {
    const errors = collectPageErrors(page);
    await seedGuestCart(page, 1); // ₹499 basket: WELCOME10 + FREESHIP usable
    await page.goto('/cart', { waitUntil: 'domcontentloaded' });

    const panel = page.getByTestId('available-coupons');
    await expect(panel).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Available coupons/i).first()).toBeVisible();
    await expect(page.getByText(/\d+ usable/).first()).toBeVisible();

    // Manual entry still available alongside the picker.
    await expect(page.getByPlaceholder(/Coupon code/i)).toBeVisible();

    // All six seeded coupons render.
    for (const code of ['FREESHIP', 'WELCOME10', 'MENTOOS15', 'BUY2GET10', 'FLAT200', 'FESTIVE20']) {
      await expect(page.getByTestId(`coupon-card-${code}`)).toBeVisible();
    }

    // Eligibility is evaluated against the ₹499 basket.
    await expect(page.getByTestId('coupon-card-WELCOME10')).toHaveAttribute('data-locked', 'false');
    await expect(page.getByTestId('coupon-card-FREESHIP')).toHaveAttribute('data-locked', 'false');
    await expect(page.getByTestId('coupon-card-MENTOOS15')).toHaveAttribute('data-locked', 'true');

    // Locked rows state the unlock condition instead of an Apply button.
    await expect(page.getByTestId('coupon-apply-MENTOOS15')).toBeDisabled();
    await expect(page.getByTestId('coupon-card-MENTOOS15')).toContainText(/Add ₹500 more/i);

    // 1-click apply an eligible coupon.
    await page.getByTestId('coupon-apply-WELCOME10').click();
    await expect(page.getByTestId('coupon-apply-WELCOME10')).toContainText(/On/i, { timeout: 20_000 });

    const applied = await page.evaluate(() => localStorage.getItem('mentoos_coupon'));
    expect(applied).toBe('WELCOME10');

    // Discount is priced from the real subtotal (10% of 499 ≈ ₹50).
    const couponPaid = Math.round(PRODUCT_PRICE * 0.1);
    await expect(page.getByText(new RegExp(`−₹${couponPaid}\\b`)).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remove coupon' })).toBeVisible();

    // Removing clears the stored code.
    await page.getByRole('button', { name: 'Remove coupon' }).click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('mentoos_coupon'))).toBeNull();

    await shot(page, testInfo, 'ux-cart-coupons');
    expect(errors, `Page errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('checkout surfaces the same coupon picker', async ({ page }, testInfo) => {
    await seedGuestCart(page, 2); // ₹998 basket
    await page.goto('/checkout?guest=1', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('available-coupons')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('coupon-card-WELCOME10')).toHaveAttribute('data-locked', 'false');
    // 2-item basket unlocks the combo coupon.
    await expect(page.getByTestId('coupon-card-BUY2GET10')).toHaveAttribute('data-locked', 'false');

    await page.getByTestId('coupon-apply-WELCOME10').click();
    await expect(page.getByTestId('coupon-apply-WELCOME10')).toContainText(/On/i, { timeout: 20_000 });
    expect(await page.evaluate(() => localStorage.getItem('mentoos_coupon'))).toBe('WELCOME10');

    // Coupon survives into the order summary totals section.
    await expect(page.getByText(/WELCOME10/).first()).toBeVisible();

    await shot(page, testInfo, 'ux-checkout-coupons');
  });
});
