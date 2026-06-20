import type { Rule, RuleId } from './types.js';

/**
 * The catalogue of hard-wait patterns sleep-catcher knows about.
 * Each rule carries a severity and a concrete smart-wait suggestion.
 */
export const RULES: Record<RuleId, Rule> = {
  sleep: {
    id: 'sleep',
    label: 'Hard-coded sleep()',
    severity: 'high',
    suggestion:
      'Wait for the condition you actually need, e.g. `await expect(locator).toBeVisible()`, instead of sleeping.',
  },
  waitForTimeout: {
    id: 'waitForTimeout',
    label: 'page.waitForTimeout()',
    severity: 'high',
    suggestion:
      'Replace with a smart wait such as `await page.waitForSelector(selector)` or `await expect(locator).toBeVisible()`.',
  },
  cyWait: {
    id: 'cyWait',
    label: 'cy.wait(<number>)',
    severity: 'high',
    suggestion:
      "Wait on a route alias instead: `cy.intercept(...).as('req'); cy.wait('@req')`, or assert on the DOM.",
  },
  driverSleep: {
    id: 'driverSleep',
    label: 'driver.sleep()',
    severity: 'high',
    suggestion:
      'Use an explicit wait, e.g. `driver.wait(until.elementIsVisible(el), timeout)`, instead of a fixed sleep.',
  },
  browserPause: {
    id: 'browserPause',
    label: 'browser.pause()',
    severity: 'high',
    suggestion: 'Use `browser.waitUntil(() => condition)` instead of a fixed pause.',
  },
  setTimeout: {
    id: 'setTimeout',
    label: 'setTimeout() used as a delay',
    severity: 'medium',
    suggestion:
      'Avoid fixed delays; await the real condition (a waitFor helper or `expect.poll`) rather than `setTimeout`.',
  },
};
