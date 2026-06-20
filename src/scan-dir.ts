import { readFile } from 'node:fs/promises';
import { relative } from 'node:path';
import fg from 'fast-glob';
import { scanCode } from './scanner.js';
import type { Finding, ScanOptions, ScanResult } from './types.js';

const FILE_GLOB = '**/*.{js,ts,mjs,cjs,jsx,tsx}';

const DEFAULT_IGNORE = ['**/node_modules/**', '**/dist/**', '**/build/**'];

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

function sortFindings(findings: Finding[]): Finding[] {
  return findings.sort(
    (a, b) =>
      a.file.localeCompare(b.file) ||
      a.line - b.line ||
      a.column - b.column ||
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );
}

/**
 * Recursively scan a directory for hard waits.
 *
 * `node_modules`, `dist` and `build` are always skipped; extra patterns can be
 * supplied via {@link ScanOptions.ignore}.
 */
export async function scanDir(dir: string, options: ScanOptions = {}): Promise<ScanResult> {
  const ignore = [...DEFAULT_IGNORE, ...(options.ignore ?? [])];

  const files = await fg(FILE_GLOB, {
    cwd: dir,
    ignore,
    absolute: true,
    onlyFiles: true,
    dot: false,
  });

  const findings: Finding[] = [];
  for (const file of files) {
    const code = await readFile(file, 'utf8');
    const label = relative(process.cwd(), file) || file;
    findings.push(...scanCode(code, label));
  }

  return { findings: sortFindings(findings), filesScanned: files.length };
}
