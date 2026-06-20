import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scanDir } from '../src/scan-dir.js';
import { formatJson, formatTable } from '../src/report.js';
import { run } from '../src/cli.js';

describe('scanDir — examples directory', () => {
  it('finds every pattern in flaky.spec.ts', async () => {
    const result = await scanDir('examples');
    const flaky = result.findings.filter((f) => f.file.endsWith('flaky.spec.ts'));
    const rules = [...new Set(flaky.map((f) => f.rule))].sort();
    expect(rules).toEqual([
      'browserPause',
      'cyWait',
      'driverSleep',
      'setTimeout',
      'sleep',
      'waitForTimeout',
    ]);
  });

  it('reports zero findings for clean.spec.ts', async () => {
    const result = await scanDir('examples');
    const clean = result.findings.filter((f) => f.file.endsWith('clean.spec.ts'));
    expect(clean).toEqual([]);
  });

  it('honours additional ignore globs', async () => {
    const result = await scanDir('examples', { ignore: ['**/flaky.spec.ts'] });
    expect(result.findings).toEqual([]);
  });
});

describe('formatJson — output shape', () => {
  it('produces parseable JSON with summary and findings', async () => {
    const result = await scanDir('examples');
    const parsed = JSON.parse(formatJson(result));

    expect(parsed.summary).toMatchObject({
      findings: result.findings.length,
    });
    expect(parsed.summary.bySeverity).toHaveProperty('high');
    expect(Array.isArray(parsed.findings)).toBe(true);
    expect(parsed.findings[0]).toHaveProperty('file');
    expect(parsed.findings[0]).toHaveProperty('line');
    expect(parsed.findings[0]).toHaveProperty('suggestion');
  });
});

describe('formatTable — output', () => {
  it('shows a success message when there are no findings', () => {
    const out = formatTable({ findings: [], filesScanned: 3 });
    expect(out).toContain('No hard waits found');
  });
});

describe('run — exit codes', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exits 1 when findings exist', async () => {
    const code = await run(['node', 'sleep-catcher', 'examples', '--json']);
    expect(code).toBe(1);
  });

  it('exits 0 when everything is ignored', async () => {
    const code = await run(['node', 'sleep-catcher', 'examples', '--ignore', '**/flaky.spec.ts']);
    expect(code).toBe(0);
  });
});
