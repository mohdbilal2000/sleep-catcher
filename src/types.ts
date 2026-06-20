/** Severity of a detected hard wait. */
export type Severity = 'high' | 'medium' | 'low';

/** Identifier for each detection rule. */
export type RuleId =
  | 'sleep'
  | 'waitForTimeout'
  | 'cyWait'
  | 'driverSleep'
  | 'browserPause'
  | 'setTimeout';

/** A detection rule: how a pattern is labelled, scored and fixed. */
export interface Rule {
  id: RuleId;
  /** Human-readable name of the pattern. */
  label: string;
  severity: Severity;
  /** A concrete smart-wait suggestion shown to the user. */
  suggestion: string;
}

/** A single hard-wait occurrence found in a file. */
export interface Finding {
  /** File path (relative to the current working directory when scanned via a directory). */
  file: string;
  /** 1-based line number. */
  line: number;
  /** 1-based column number. */
  column: number;
  rule: RuleId;
  severity: Severity;
  /** The matched source code (single line, truncated). */
  code: string;
  /** A concrete smart-wait suggestion. */
  suggestion: string;
}

/** Options for scanning a directory. */
export interface ScanOptions {
  /** Additional glob patterns to ignore (node_modules/dist/build are always ignored). */
  ignore?: string[];
}

/** The result of scanning a directory. */
export interface ScanResult {
  findings: Finding[];
  /** Number of files that were parsed. */
  filesScanned: number;
}
