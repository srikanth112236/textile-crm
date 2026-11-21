import { expect, test, type Page } from '@playwright/test';

/**
 * Shared helpers. The web build is React Native Web, so most UI is divs with
 * text; accessible names come from accessibilityLabel / role props.
 */

export const REACH_ERROR = /Can’t reach the store|Couldn’t load this|Can't reach the store/i;

export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    // React Native Web logs a devtools hint and some benign warnings via console.
    if (/Download the React DevTools/i.test(text)) return;
    errors.push(text);
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  return errors;
}

/** Waits for the first *visible* match of a data-driven screen. */
export async function waitForData(page: Page, matcher: RegExp | string, timeout = 60_000) {
  // React Navigation keeps previously visited screens mounted on web, so match
  // only the visible instance.
  const locator =
    matcher instanceof RegExp
      ? page.getByText(matcher).filter({ visible: true })
      : page.getByText(matcher).filter({ visible: true });
  await expect(locator.first()).toBeVisible({ timeout });
}

export async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('MENTOOS').first()).toBeVisible({ timeout: 90_000 });
}
