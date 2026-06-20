import Table from 'cli-table3';
import pc from 'picocolors';
import type { ScanResult, Severity } from './types.js';

function colorSeverity(severity: Severity): string {
  switch (severity) {
    case 'high':
      return pc.red(pc.bold(severity));
    case 'medium':
      return pc.yellow(severity);
    case 'low':
      return pc.blue(severity);
  }
}

function pluralize(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

function countBySeverity(result: ScanResult): Record<Severity, number> {
  const counts: Record<Severity, number> = { high: 0, medium: 0, low: 0 };
  for (const finding of result.findings) counts[finding.severity] += 1;
  return counts;
}

/** Render a scan result as a human-friendly table (with a summary line). */
export function formatTable(result: ScanResult): string {
  const scanned = pc.dim(`(${pluralize(result.filesScanned, 'file')} scanned)`);

  if (result.findings.length === 0) {
    return `${pc.green('✔ No hard waits found.')} ${scanned}`;
  }

  const table = new Table({
    head: ['Location', 'Severity', 'Code', 'Suggestion'].map((h) => pc.bold(h)),
    colWidths: [34, 10, 28, 42],
    wordWrap: true,
    style: { head: [], border: [] },
  });

  for (const f of result.findings) {
    table.push([
      `${f.file}:${f.line}:${f.column}`,
      colorSeverity(f.severity),
      f.code,
      f.suggestion,
    ]);
  }

  const fileCount = new Set(result.findings.map((f) => f.file)).size;
  const summary = pc.red(
    `✖ Found ${pluralize(result.findings.length, 'hard wait')} in ${pluralize(fileCount, 'file')}.`,
  );

  return `${table.toString()}\n${summary} ${scanned}`;
}

/** Render a scan result as a stable JSON string. */
export function formatJson(result: ScanResult): string {
  const payload = {
    summary: {
      filesScanned: result.filesScanned,
      findings: result.findings.length,
      bySeverity: countBySeverity(result),
    },
    findings: result.findings,
  };
  return JSON.stringify(payload, null, 2);
}
