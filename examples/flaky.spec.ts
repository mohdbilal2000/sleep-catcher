// examples/flaky.spec.ts
//
// A deliberately flaky spec used to demo sleep-catcher.
// Every hard wait below is exactly the kind of smell the scanner flags.
//
// Run:  sleep-catcher examples/

declare const cy: { wait(arg: number | string): void };
declare const browser: { pause(ms: number): void };
declare const driver: { sleep(ms: number): Promise<void> };
declare function sleep(ms: number): Promise<void>;
declare function expect(value: unknown): { toBeTruthy(): void };

export async function flakyCheckout(page: {
  goto(url: string): Promise<void>;
  waitForTimeout(ms: number): Promise<void>;
}): Promise<void> {
  await page.goto('/checkout');

  // 1) bare sleep()
  await sleep(1000);

  // 2) Playwright fixed timeout
  await page.waitForTimeout(2000);

  // 3) Cypress numeric wait — alias waits like cy.wait('@order') are fine
  cy.wait(500);

  // 4) Selenium WebDriver sleep
  await driver.sleep(3000);

  // 5) WebdriverIO fixed pause
  browser.pause(750);

  // 6) setTimeout used as a bare delay
  await new Promise((resolve) => setTimeout(resolve, 250));

  // The two lines below must NOT be flagged (a comment + a string literal):
  // page.waitForTimeout(9999)
  const docs = 'prefer cy.wait("@alias") instead of cy.wait(1000)';
  expect(docs).toBeTruthy();
}
