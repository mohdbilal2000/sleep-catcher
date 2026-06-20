import { describe, expect, it } from 'vitest';
import { scanCode } from '../src/scanner.js';
import type { RuleId } from '../src/types.js';

function rules(code: string): RuleId[] {
  return scanCode(code, 'test.ts').map((f) => f.rule);
}

describe('scanCode — pattern detection', () => {
  it('detects a bare sleep() call', () => {
    expect(rules('await sleep(1000);')).toEqual(['sleep']);
  });

  it('detects sleep() with a variable delay', () => {
    expect(rules('const ms = 500; await sleep(ms);')).toEqual(['sleep']);
  });

  it('detects page.waitForTimeout()', () => {
    expect(rules('await page.waitForTimeout(2000);')).toEqual(['waitForTimeout']);
  });

  it('detects numeric cy.wait()', () => {
    expect(rules('cy.wait(500);')).toEqual(['cyWait']);
  });

  it('detects driver.sleep()', () => {
    expect(rules('await driver.sleep(3000);')).toEqual(['driverSleep']);
  });

  it('detects browser.pause()', () => {
    expect(rules('browser.pause(750);')).toEqual(['browserPause']);
  });

  it('detects setTimeout used as a bare delay (promise resolve)', () => {
    expect(rules('await new Promise((resolve) => setTimeout(resolve, 250));')).toEqual([
      'setTimeout',
    ]);
  });

  it('detects setTimeout with an empty callback', () => {
    expect(rules('setTimeout(() => {}, 100);')).toEqual(['setTimeout']);
  });

  it('reports accurate line and column numbers', () => {
    const [finding] = scanCode('const x = 1;\n  await sleep(10);', 'test.ts');
    expect(finding).toMatchObject({ line: 2, column: 9, rule: 'sleep' });
  });
});

describe('scanCode — no false positives', () => {
  it('ignores alias-based cy.wait()', () => {
    expect(rules("cy.wait('@getUser');")).toEqual([]);
  });

  it('ignores media element pause() with no delay', () => {
    expect(rules('video.pause();')).toEqual([]);
  });

  it('ignores real setTimeout scheduling with a non-empty callback', () => {
    expect(rules('setTimeout(() => doWork(), 100);')).toEqual([]);
  });

  it('ignores matches inside line and block comments', () => {
    const code = `
      // await sleep(1000);
      /* page.waitForTimeout(2000); cy.wait(500); */
      const ok = true;
    `;
    expect(rules(code)).toEqual([]);
  });

  it('ignores matches inside string literals', () => {
    const code = `
      const a = 'await sleep(1000)';
      const b = "page.waitForTimeout(2000)";
      const c = \`cy.wait(500)\`;
    `;
    expect(rules(code)).toEqual([]);
  });

  it('returns nothing for unparseable code instead of throwing', () => {
    expect(() => scanCode('const = = =;;; <<<', 'broken.ts')).not.toThrow();
  });
});

describe('scanCode — finding shape', () => {
  it('includes a severity, snippet and suggestion', () => {
    const [finding] = scanCode('await sleep(1000);', 'a.ts');
    expect(finding).toMatchObject({
      file: 'a.ts',
      rule: 'sleep',
      severity: 'high',
      code: 'sleep(1000)',
    });
    expect(finding?.suggestion).toMatch(/expect\(/);
  });
});
