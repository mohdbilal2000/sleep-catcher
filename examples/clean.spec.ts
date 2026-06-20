// examples/clean.spec.ts
//
// A healthy spec — it waits on real conditions, so sleep-catcher
// reports zero findings here.

declare const cy: {
  intercept(method: string, url: string): { as(alias: string): void };
  get(selector: string): { click(): void };
  wait(alias: string): void;
};
declare function expect(locator: unknown): { toBeVisible(): Promise<void> };

export async function cleanCheckout(page: {
  goto(url: string): Promise<void>;
  locator(selector: string): unknown;
  waitForSelector(selector: string): Promise<void>;
}): Promise<void> {
  await page.goto('/checkout');

  // Smart waits: assert on the condition you actually care about.
  await expect(page.locator('#summary')).toBeVisible();
  await page.waitForSelector('#pay-button');

  // Cypress alias waits are fine — they wait on a real network response.
  cy.intercept('POST', '/api/order').as('order');
  cy.get('#pay-button').click();
  cy.wait('@order');

  // pause() with no fixed delay (e.g. media controls) is not a hard wait.
  const video = { pause: (): void => undefined };
  video.pause();
}
