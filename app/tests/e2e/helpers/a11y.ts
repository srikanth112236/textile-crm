import { Page, TestInfo, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export async function expectAccessible(page: Page, info: TestInfo, name: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  await info.attach(`${name}-axe-results`, {
    body: Buffer.from(JSON.stringify(results.violations, null, 2)),
    contentType: 'application/json',
  });

  const summary = results.violations
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.help}`)
    .join('\n');

  expect(results.violations, `Accessibility violations on ${name}:\n${summary}`).toEqual([]);
}
