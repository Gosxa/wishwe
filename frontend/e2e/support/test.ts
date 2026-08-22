import AxeBuilder from '@axe-core/playwright';
import { expect, test as base, type Page } from '@playwright/test';

type AutoFixtures = {
  browserErrors: void;
};

export const test = base.extend<AutoFixtures>({
  browserErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];

      page.on('pageerror', error => errors.push(error.message));
      await use();

      expect(errors, 'uncaught errors were emitted by the page').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';

const KNOWN_A11Y_GAPS = ['button-name', 'label', 'color-contrast'];

export const expectNoA11yViolations = async (page: Page, scope?: string) => {
  let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']);

  if (scope) builder = builder.include(scope);

  const { violations } = await builder.disableRules(KNOWN_A11Y_GAPS).analyze();

  expect(
    violations.map(violation => violation.id),
    'new accessibility violations',
  ).toEqual([]);
};
